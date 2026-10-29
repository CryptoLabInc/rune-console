package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hkdf"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
	"strings"
)

func deriveMetadataV2Key(baseDEK []byte) ([]byte, error) {
	if len(baseDEK) != 32 {
		return nil, errors.New("crypto: metadata v2 base key must be 32 bytes")
	}
	return hkdf.Key(sha256.New, baseDEK, nil, "rune/metadata/aes256gcm/v2", 32)
}

// MetadataV2Envelope contains the canonical security fields of a v2 envelope.
type MetadataV2Envelope struct {
	Version    int
	AgentID    string
	RecordID   string
	Ciphertext string
}

// ParseMetadataV2 accepts exactly one object with the four lowercase fields.
// Token-level parsing rejects duplicate fields before JSON can overwrite or
// ignore earlier values (including a valid value followed by null).
func ParseMetadataV2(envelopeJSON string) (MetadataV2Envelope, error) {
	var envelope MetadataV2Envelope
	invalid := errors.New("crypto: invalid metadata v2 envelope")
	decoder := json.NewDecoder(strings.NewReader(envelopeJSON))
	start, err := decoder.Token()
	if err != nil || start != json.Delim('{') {
		return envelope, invalid
	}
	fields := make(map[string]json.RawMessage, 4)
	for decoder.More() {
		token, err := decoder.Token()
		if err != nil {
			return envelope, invalid
		}
		name, ok := token.(string)
		if !ok || (name != "v" && name != "a" && name != "r" && name != "c") {
			return envelope, invalid
		}
		if _, duplicate := fields[name]; duplicate {
			return envelope, invalid
		}
		var value json.RawMessage
		if decoder.Decode(&value) != nil || string(value) == "null" {
			return envelope, invalid
		}
		fields[name] = value
	}
	end, err := decoder.Token()
	var trailing json.RawMessage
	if err != nil || end != json.Delim('}') || decoder.Decode(&trailing) != io.EOF || len(fields) != 4 {
		return envelope, invalid
	}
	if json.Unmarshal(fields["v"], &envelope.Version) != nil ||
		json.Unmarshal(fields["a"], &envelope.AgentID) != nil ||
		json.Unmarshal(fields["r"], &envelope.RecordID) != nil ||
		json.Unmarshal(fields["c"], &envelope.Ciphertext) != nil ||
		envelope.AgentID == "" || envelope.RecordID == "" || envelope.Ciphertext == "" {
		return MetadataV2Envelope{}, invalid
	}
	if envelope.Version != 2 {
		return MetadataV2Envelope{}, errors.New("crypto: unsupported metadata version")
	}
	return envelope, nil
}

// DecryptMetadataV2 authenticates metadata against caller-supplied identities.
// It accepts only v2 envelopes; failures never return plaintext or fall back to
// legacy decryption. Callers must obtain expected IDs from trusted context.
func DecryptMetadataV2(envelopeJSON string, baseDEK []byte, expectedAgentID, expectedRecordID string) ([]byte, error) {
	if expectedAgentID == "" || expectedRecordID == "" {
		return nil, errors.New("crypto: metadata v2 expected identities are required")
	}
	envelope, err := ParseMetadataV2(envelopeJSON)
	if err != nil {
		return nil, err
	}
	if envelope.AgentID != expectedAgentID || envelope.RecordID != expectedRecordID {
		return nil, errors.New("crypto: metadata v2 identity mismatch")
	}
	key, err := deriveMetadataV2Key(baseDEK)
	if err != nil {
		return nil, err
	}
	raw, err := base64.StdEncoding.Strict().DecodeString(envelope.Ciphertext)
	if err != nil {
		return nil, errors.New("crypto: invalid metadata v2 encoding")
	}
	// Standard GCM uses a 12-byte nonce and a 16-byte authentication tag.
	if len(raw) < 12+16 {
		return nil, errors.New("crypto: truncated metadata v2 payload")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	aad, err := json.Marshal([4]string{"rune-metadata", "2", expectedAgentID, expectedRecordID})
	if err != nil {
		return nil, err
	}
	plaintext, err := aead.Open(nil, raw[:12], raw[12:], aad)
	if err != nil {
		return nil, errors.New("crypto: metadata v2 authentication failed")
	}
	return plaintext, nil
}
