package crypto

import (
	"bytes"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"os"
	"strconv"
	"testing"
)

type metadataV2Fixture struct {
	BaseKeyHex       string `json:"base_key_hex"`
	DerivedKeyHex    string `json:"derived_key_hex"`
	NonceHex         string `json:"nonce_hex"`
	AADHex           string `json:"aad_hex"`
	Plaintext        string `json:"plaintext"`
	CiphertextTagHex string `json:"ciphertext_tag_hex"`
	AgentID          string `json:"agent_id"`
	RecordID         string `json:"record_id"`
	EnvelopeJSON     string `json:"envelope_json"`
}

func loadMetadataV2Fixture(t *testing.T) metadataV2Fixture {
	t.Helper()
	b, err := os.ReadFile("testdata/metadata_v2.json")
	if err != nil {
		t.Fatal(err)
	}
	var f metadataV2Fixture
	if err := json.Unmarshal(b, &f); err != nil {
		t.Fatal(err)
	}
	return f
}

func fixtureHex(t *testing.T, s string) []byte {
	t.Helper()
	b, err := hex.DecodeString(s)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

// A different HKDF info/salt, nonce framing, AAD order or GCM format breaks
// this independent Python-generated vector, rather than a Go round trip.
func TestDecryptMetadataV2IndependentFixture(t *testing.T) {
	f := loadMetadataV2Fixture(t)
	key := fixtureHex(t, f.BaseKeyHex)
	derived, err := deriveMetadataV2Key(key)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(derived, fixtureHex(t, f.DerivedKeyHex)) {
		t.Fatal("derived key does not match independent vector")
	}
	var envelope struct {
		C string `json:"c"`
	}
	if err := json.Unmarshal([]byte(f.EnvelopeJSON), &envelope); err != nil {
		t.Fatal(err)
	}
	raw, err := base64.StdEncoding.DecodeString(envelope.C)
	if err != nil {
		t.Fatal(err)
	}
	wantRaw := append(fixtureHex(t, f.NonceHex), fixtureHex(t, f.CiphertextTagHex)...)
	if !bytes.Equal(raw, wantRaw) {
		t.Fatal("fixture envelope framing mismatch")
	}
	wantAAD := `["rune-metadata","2","0123456789abcdef0123456789abcdef","123e4567-e89b-42d3-a456-426614174000"]`
	if !bytes.Equal(fixtureHex(t, f.AADHex), []byte(wantAAD)) {
		t.Fatal("fixture AAD mismatch")
	}
	got, err := DecryptMetadataV2(f.EnvelopeJSON, key, f.AgentID, f.RecordID)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, []byte(f.Plaintext)) {
		t.Fatal("plaintext does not match independent vector")
	}
}

// Every rejection must return an error and no plaintext. These cases catch
// skipped identity validation, ignored parse failures and missing authentication.
func TestDecryptMetadataV2RejectsInvalidInput(t *testing.T) {
	f := loadMetadataV2Fixture(t)
	key := fixtureHex(t, f.BaseKeyHex)
	change := func(field string, value any) string {
		var e map[string]any
		if err := json.Unmarshal([]byte(f.EnvelopeJSON), &e); err != nil {
			t.Fatal(err)
		}
		e[field] = value
		b, err := json.Marshal(e)
		if err != nil {
			t.Fatal(err)
		}
		return string(b)
	}
	remove := func(field string) string {
		var e map[string]any
		if err := json.Unmarshal([]byte(f.EnvelopeJSON), &e); err != nil {
			t.Fatal(err)
		}
		delete(e, field)
		b, err := json.Marshal(e)
		if err != nil {
			t.Fatal(err)
		}
		return string(b)
	}
	type rejection struct {
		name, envelope string
		key            []byte
		agent, record  string
	}
	cases := []rejection{}
	add := func(name, envelope string) {
		cases = append(cases, rejection{name, envelope, key, f.AgentID, f.RecordID})
	}
	for _, bad := range []struct{ name, input string }{
		{"malformed_json", "{"}, {"trailing_json", f.EnvelopeJSON + " {}"},
		{"null_envelope", "null"}, {"array_envelope", "[]"}, {"empty_object", "{}"},
		{"legacy_ciphertext", `"YWJjZA=="`},
	} {
		add(bad.name, bad.input)
	}
	for _, field := range []string{"v", "a", "r", "c"} {
		add("missing_"+field, remove(field))
		add("null_"+field, change(field, nil))
		add("object_"+field, change(field, map[string]any{}))
	}
	for _, value := range []any{0, 1, 3, -2, 2.1, "2", true} {
		b, _ := json.Marshal(value)
		add("invalid_version_"+string(b), change("v", value))
	}
	add("numeric_agent", change("a", 123))
	add("numeric_record", change("r", 123))
	add("numeric_ciphertext", change("c", 123))
	add("empty_agent", change("a", ""))
	add("empty_record", change("r", ""))
	add("changed_agent", change("a", "fedcba9876543210fedcba9876543210"))
	add("changed_record", change("r", "123e4567-e89b-42d3-a456-426614174001"))
	add("invalid_base64", change("c", "!not-base64!"))
	var e struct {
		C string `json:"c"`
	}
	if err := json.Unmarshal([]byte(f.EnvelopeJSON), &e); err != nil {
		t.Fatal(err)
	}
	raw, err := base64.StdEncoding.DecodeString(e.C)
	if err != nil {
		t.Fatal(err)
	}
	for _, n := range []int{0, 1, 11, 12, 27, len(raw) - 1} {
		add("truncated_"+strconv.Itoa(n), change("c", base64.StdEncoding.EncodeToString(raw[:n])))
	}
	for _, part := range []struct {
		name   string
		offset int
	}{{"nonce", 0}, {"ciphertext", 12}, {"tag", len(raw) - 1}} {
		mutated := bytes.Clone(raw)
		mutated[part.offset] ^= 1
		add("changed_"+part.name, change("c", base64.StdEncoding.EncodeToString(mutated)))
	}
	// Changing both the caller context and envelope must still fail: IDs are AAD.
	cases = append(cases,
		rejection{"rebound_agent", change("a", "fedcba9876543210fedcba9876543210"), key, "fedcba9876543210fedcba9876543210", f.RecordID},
		rejection{"rebound_record", change("r", "123e4567-e89b-42d3-a456-426614174001"), key, f.AgentID, "123e4567-e89b-42d3-a456-426614174001"},
		rejection{"empty_expected_agent", f.EnvelopeJSON, key, "", f.RecordID},
		rejection{"empty_expected_record", f.EnvelopeJSON, key, f.AgentID, ""},
		rejection{"wrong_expected_agent", f.EnvelopeJSON, key, "fedcba9876543210fedcba9876543210", f.RecordID},
		rejection{"wrong_expected_record", f.EnvelopeJSON, key, f.AgentID, "123e4567-e89b-42d3-a456-426614174001"},
		rejection{"nil_key", f.EnvelopeJSON, nil, f.AgentID, f.RecordID},
		rejection{"short_key", f.EnvelopeJSON, key[:31], f.AgentID, f.RecordID},
		rejection{"long_key", f.EnvelopeJSON, append(bytes.Clone(key), 0), f.AgentID, f.RecordID},
		rejection{"wrong_key", f.EnvelopeJSON, bytes.Repeat([]byte{0xff}, 32), f.AgentID, f.RecordID},
	)
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := DecryptMetadataV2(tc.envelope, tc.key, tc.agent, tc.record)
			if err == nil {
				t.Fatal("invalid metadata accepted")
			}
			if got != nil {
				t.Fatal("plaintext returned on rejection")
			}
		})
	}
}
