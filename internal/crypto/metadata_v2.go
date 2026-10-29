package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/hkdf"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
)

func deriveMetadataV2Key(baseDEK []byte) ([]byte, error) {
	if len(baseDEK) != 32 {
		return nil, errors.New("crypto: metadata v2 base key must be 32 bytes")
	}
	return hkdf.Key(sha256.New, baseDEK, nil, "rune/metadata/aes256gcm/v2", 32)
}

// DecryptMetadataV2 authenticates metadata against caller-supplied identities.
// It accepts only v2 envelopes; failures never return plaintext or fall back to
// legacy decryption. Callers must obtain expected IDs from trusted context.
func DecryptMetadataV2(envelopeJSON string, baseDEK []byte, expectedAgentID, expectedRecordID string) ([]byte, error) {
	if expectedAgentID == "" || expectedRecordID == "" {
		return nil, errors.New("crypto: metadata v2 expected identities are required")
	}
	var envelope struct {
		Version    int    `json:"v"`
		AgentID    string `json:"a"`
		RecordID   string `json:"r"`
		Ciphertext string `json:"c"`
	}
	if err := json.Unmarshal([]byte(envelopeJSON), &envelope); err != nil {
		return nil, errors.New("crypto: invalid metadata v2 envelope")
	}
	if envelope.Version != 2 {
		return nil, errors.New("crypto: unsupported metadata version")
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
