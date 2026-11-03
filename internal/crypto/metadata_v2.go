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
	fields, err := ParseMetadataFields(envelopeJSON)
	if err != nil {
		return MetadataV2Envelope{}, err
	}
	return MetadataV2FromFields(fields)
}

// ParseMetadataFields parses one JSON object without discarding duplicate keys.
// Callers can classify legacy/v2 once, then validate the appropriate envelope.
func ParseMetadataFields(envelopeJSON string) (map[string]json.RawMessage, error) {
	invalid := errors.New("crypto: invalid metadata envelope")
	decoder := json.NewDecoder(strings.NewReader(envelopeJSON))
	start, err := decoder.Token()
	if err != nil || start != json.Delim('{') {
		return nil, invalid
	}
	fields := make(map[string]json.RawMessage, 4)
	for decoder.More() {
		token, err := decoder.Token()
		if err != nil {
			return nil, invalid
		}
		name, ok := token.(string)
		if !ok {
			return nil, invalid
		}
		if _, duplicate := fields[name]; duplicate {
			return nil, invalid
		}
		var value json.RawMessage
		if decoder.Decode(&value) != nil {
			return nil, invalid
		}
		fields[name] = value
	}
	end, err := decoder.Token()
	var trailing json.RawMessage
	if err != nil || end != json.Delim('}') || decoder.Decode(&trailing) != io.EOF {
		return nil, invalid
	}
	return fields, nil
}

// MetadataV2FromFields validates the canonical v2 fields after duplicate-safe parsing.
func MetadataV2FromFields(fields map[string]json.RawMessage) (MetadataV2Envelope, error) {
	var envelope MetadataV2Envelope
	invalid := errors.New("crypto: invalid metadata v2 envelope")
	if len(fields) != 4 {
		return envelope, invalid
	}
	for _, name := range []string{"v", "a", "r", "g"} {
		value, ok := fields[name]
		if !ok || string(value) == "null" {
			return envelope, invalid
		}
	}

	if json.Unmarshal(fields["v"], &envelope.Version) != nil ||
		json.Unmarshal(fields["a"], &envelope.AgentID) != nil ||
		json.Unmarshal(fields["r"], &envelope.RecordID) != nil ||
		json.Unmarshal(fields["g"], &envelope.Ciphertext) != nil ||
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
	envelope, err := ParseMetadataV2(envelopeJSON)
	if err != nil {
		return nil, err
	}
	return DecryptMetadataV2Envelope(envelope, baseDEK, expectedAgentID, expectedRecordID)
}

// DecryptMetadataV2Envelope opens an already parsed envelope against trusted IDs.
func DecryptMetadataV2Envelope(envelope MetadataV2Envelope, baseDEK []byte, expectedAgentID, expectedRecordID string) ([]byte, error) {
	if expectedAgentID == "" || expectedRecordID == "" || envelope.Version != 2 {
		return nil, errors.New("crypto: metadata v2 expected identities and version are required")
	}

	if envelope.AgentID != expectedAgentID || envelope.RecordID != expectedRecordID {
		return nil, errors.New("crypto: metadata v2 identity mismatch")
	}
	key, err := deriveMetadataV2Key(baseDEK)
	if err != nil {
		return nil, err
	}
	raw, err := base64.StdEncoding.Strict().DecodeString(envelope.Ciphertext)
	// Strict checks unused pad bits; equality also rejects CR/LF, which the
	// standard decoder otherwise ignores even in strict mode.
	if err != nil || base64.StdEncoding.EncodeToString(raw) != envelope.Ciphertext {
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
