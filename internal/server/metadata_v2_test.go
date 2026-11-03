package server

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hkdf"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/CryptoLabInc/rune-console/internal/crypto"
	"github.com/CryptoLabInc/rune-console/internal/groups"
	"github.com/CryptoLabInc/rune-console/internal/tokens"
	pb "github.com/CryptoLabInc/rune-console/pkg/consolepb"
	runespace "github.com/CryptoLabInc/runespace-sdk"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"gopkg.in/yaml.v3"
)

const testValidMetadataRecord = `{"timestamp":"2026-10-28T12:00:00Z","author":"writer@example.com","insight":"A shared insight","context":"Captured by rune-mcp"}`

// Independent test sealer; production has only the authenticated reader.
func testMetadataV2(t *testing.T, v *Console, token, id string) string {
	t.Helper()
	return testMetadataV2Payload(t, v, token, id, []byte(testValidMetadataRecord))
}

func testMetadataV2Payload(t *testing.T, v *Console, token, id string, payload []byte) string {
	t.Helper()
	agent := crypto.AgentIDFromToken(token)
	base, err := crypto.DeriveAgentKey(v.cfg.Tokens.TeamSecret, agent)
	if err != nil {
		t.Fatal(err)
	}
	key, err := hkdf.Key(sha256.New, base, nil, "rune/metadata/aes256gcm/v2", 32)
	if err != nil {
		t.Fatal(err)
	}
	block, _ := aes.NewCipher(key)
	aead, _ := cipher.NewGCM(block)
	aad, _ := json.Marshal([4]string{"rune-metadata", "2", agent, id})
	nonce := make([]byte, 12)
	raw := aead.Seal(nonce, nonce, payload, aad)
	b, _ := json.Marshal(map[string]any{"v": 2, "a": agent, "r": id, "g": base64.StdEncoding.EncodeToString(raw)})
	return string(b)
}

type metadataEngine struct {
	fakeEngine
	hits []crypto.SearchHit
}

func (f *metadataEngine) Search(context.Context, []float32, int, ...string) ([]crypto.SearchHit, error) {
	return f.hits, nil
}

func metadataWriter(t *testing.T) (*Console, *metadataEngine, string) {
	t.Helper()
	v := newTestConsole(t)
	f := &metadataEngine{}
	v.engine = f
	g, err := v.groups.CreateGroup("writers", "")
	if err != nil {
		t.Fatal(err)
	}
	tok, err := v.tokens.AddToken("writer@example.com", nil)
	if err != nil {
		t.Fatal(err)
	}
	user := v.tokens.GetUsername(tok.Token)
	if _, err = v.groups.Grant(user, g.ID, groups.RoleWrite, "local-admin:test"); err != nil {
		t.Fatal(err)
	}
	return v, f, tok.Token
}

func TestMetadataV2InsertBoundary(t *testing.T) {
	for _, legacy := range []bool{false, true} {
		for _, tc := range []struct {
			name string
			code codes.Code
		}{
			{"valid", codes.OK}, {"legacy", codes.FailedPrecondition}, {"plaintext", codes.FailedPrecondition}, {"wrong_record", codes.InvalidArgument}, {"wrong_agent", codes.InvalidArgument}, {"corrupt", codes.InvalidArgument}, {"unknown", codes.InvalidArgument}, {"malformed", codes.InvalidArgument}, {"empty", codes.FailedPrecondition}, {"stripped", codes.InvalidArgument},
		} {
			t.Run(tc.name+map[bool]string{false: "/strict", true: "/migration"}[legacy], func(t *testing.T) {
				v, f, token := metadataWriter(t)
				_ = yaml.Unmarshal([]byte("allow_legacy_metadata_read: "+map[bool]string{false: "false", true: "true"}[legacy]), v.cfg)
				meta := testMetadataV2(t, v, token, "record")
				switch tc.name {
				case "legacy":
					meta, _ = NewConsoleGRPC(v).sealMeta(token, `{"timestamp":"2026-10-28T12:00:00Z","author":"writer@example.com","insight":"A legacy insight","context":"Captured by released rune-mcp"}`)
				case "plaintext":
					meta = `{"timestamp":"2026-10-28T12:00:00Z","author":"writer@example.com","insight":"A legacy insight","context":"Captured by released rune-mcp"}`
				case "wrong_record":
					meta = testMetadataV2(t, v, token, "other")
				case "wrong_agent":
					meta = testMetadataV2(t, v, "other-token", "record")
				case "corrupt":
					meta = strings.Replace(meta, `"g":"`, `"g":"AAAA`, 1)
				case "unknown":
					meta = strings.Replace(meta, `"v":2`, `"v":3`, 1)
				case "empty":
					meta = ""
				case "stripped":
					meta = strings.Replace(meta, `,"v":2`, "", 1)
				case "malformed":
					meta = "{"
				}
				_, err := NewConsoleGRPC(v).Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: meta})
				if status.Code(err) != tc.code {
					t.Fatalf("code=%v want %v: %v", status.Code(err), tc.code, err)
				}
				if f.insertCalled != (tc.code == codes.OK) {
					t.Fatalf("forwarded=%v", f.insertCalled)
				}
				if tc.code == codes.OK {
					if f.gotItem.SealedMetadata != meta {
						t.Fatal("sealed metadata changed in transit")
					}
					opened, err := NewConsoleGRPC(v).openMeta(meta, "record")
					if err != nil || opened != testValidMetadataRecord {
						t.Fatalf("accepted metadata must open with the same outer ID: %q %v", opened, err)
					}
				}
				if tc.code == codes.FailedPrecondition && !strings.Contains(err.Error(), "upgrade") {
					t.Fatal("missing upgrade guidance")
				}
			})
		}
	}
}

func TestMetadataV2SearchIntegrity(t *testing.T) {
	for _, migration := range []bool{false, true} {
		for _, kind := range []string{"valid", "corrupt", "wrong_record", "unknown", "stripped", "legacy", "plaintext", "arbitrary_json", "empty"} {
			t.Run(kind+map[bool]string{false: "/strict", true: "/migration"}[migration], func(t *testing.T) {
				v, f, token := metadataWriter(t)
				if migration {
					_ = yaml.Unmarshal([]byte("allow_legacy_metadata_read: true"), v.cfg)
				}
				meta := testMetadataV2(t, v, "different-reader-token", "record")
				switch kind {
				case "corrupt":
					meta = strings.Replace(meta, `"g":"`, `"g":"AAAA`, 1)
				case "wrong_record":
					meta = testMetadataV2(t, v, token, "other")
				case "unknown":
					meta = strings.Replace(meta, `"v":2`, `"v":3`, 1)
				case "stripped":
					meta = strings.Replace(meta, `,"v":2`, "", 1)
				case "legacy":
					meta, _ = NewConsoleGRPC(v).sealMeta(token, `{"timestamp":"2026-10-28T12:00:00Z","author":"writer@example.com","insight":"A legacy insight","context":"Captured by released rune-mcp"}`)
				case "plaintext":
					meta = `{"timestamp":"2026-10-28T12:00:00Z","author":"writer@example.com","insight":"A legacy insight","context":"Captured by released rune-mcp"}`
				case "arbitrary_json":
					meta = `{"text":"not a domain.Record"}`
				case "empty":
					meta = ""
				}
				f.hits = []crypto.SearchHit{{ID: "good", Metadata: testMetadataV2(t, v, token, "good")}, {ID: "record", Metadata: meta}}
				resp, err := NewConsoleGRPC(v).Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5})
				success := kind == "valid" || migration && kind == "legacy"
				excluded := kind == "plaintext" || kind == "arbitrary_json" || kind == "empty" || kind == "legacy" && !migration
				if excluded {
					if err != nil || len(resp.GetHits()) != 1 || resp.Hits[0].Metadata != testValidMetadataRecord {
						t.Fatalf("expected excluded hit and intact v2 result: %v %v", resp, err)
					}
					return
				}
				if success {
					if err != nil || len(resp.GetHits()) != 2 {
						t.Fatalf("search: %v %v", resp, err)
					}
					if resp.Hits[0].Metadata != testValidMetadataRecord {
						t.Fatal("v2 result was not opened")
					}
					if kind == "valid" && resp.Hits[1].Metadata != testValidMetadataRecord {
						t.Fatal("shared result was not opened")
					}
					if kind == "legacy" && !strings.Contains(resp.Hits[1].Metadata, `"insight":"A legacy insight"`) {
						t.Fatal("legacy result was not opened")
					}
					return
				}
				if status.Code(err) != codes.DataLoss || len(resp.GetHits()) != 0 {
					t.Fatalf("expected atomic integrity failure: %v %v", resp, err)
				}
				if status.Convert(err).Message() != "metadata integrity check failed" {
					t.Fatalf("non-generic error: %v", err)
				}
			})
		}
	}
}

func TestMetadataV2ManifestAndConfig(t *testing.T) {
	v := newTestConsole(t)
	token := tokens.DemoToken
	for _, tier := range []string{"rmp", "mm"} {
		dir := filepath.Join(v.bundleParams.Root, v.bundleParams.KeyID, tier)
		if err := os.MkdirAll(dir, 0700); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dir, "EncKey.json"), []byte(`{}`), 0600); err != nil {
			t.Fatal(err)
		}
	}
	resp, err := NewConsoleGRPC(v).GetAgentManifest(context.Background(), &pb.GetAgentManifestRequest{Token: token})
	if err != nil {
		t.Fatal(err)
	}
	var manifest map[string]any
	if err = json.Unmarshal([]byte(resp.GetManifestJson()), &manifest); err != nil {
		t.Fatal(err)
	}
	caps, _ := manifest["capabilities"].([]any)
	if len(caps) != 1 || caps[0] != "metadata_envelope_v2" {
		t.Fatalf("capabilities=%v", manifest["capabilities"])
	}
	var cfg Config
	b, _ := yaml.Marshal(cfg)
	if !strings.Contains(string(b), "allow_legacy_metadata_read: false") {
		t.Fatal("missing strict-default migration setting")
	}
	if err = yaml.Unmarshal([]byte("allow_legacy_metadata_read: true"), &cfg); err != nil {
		t.Fatal(err)
	}
	b, _ = yaml.Marshal(cfg)
	if !strings.Contains(string(b), "allow_legacy_metadata_read: true") {
		t.Fatal("migration setting not decoded")
	}
}

func TestMetadataV2ConfigLoad(t *testing.T) {
	for _, enabled := range []bool{false, true} {
		body := minimalValidConfig(t)
		if enabled {
			body += "\nallow_legacy_metadata_read: true\n"
		}
		cfg, err := LoadConfig(writeConfig(t, body))
		if err != nil {
			t.Fatal(err)
		}
		if cfg.AllowLegacyMetadataRead != enabled {
			t.Fatalf("migration=%v want %v", cfg.AllowLegacyMetadataRead, enabled)
		}
	}
}

// A producer must not store envelopes whose security fields have ambiguous
// spellings or values. Both insert and read must reject them in either policy.
func TestMetadataV2RejectsNoncanonicalAtBoundary(t *testing.T) {
	for _, migration := range []bool{false, true} {
		v, f, token := metadataWriter(t)
		v.cfg.AllowLegacyMetadataRead = migration
		valid := testMetadataV2(t, v, token, "record")
		var fields map[string]json.RawMessage
		if err := json.Unmarshal([]byte(valid), &fields); err != nil {
			t.Fatal(err)
		}
		cases := map[string]string{
			"uppercase_all": strings.NewReplacer(`"v":`, `"V":`, `"a":`, `"A":`, `"r":`, `"R":`, `"g":`, `"G":`).Replace(valid),
			"extra_field":   strings.TrimSuffix(valid, "}") + `,"extra":true}`,
		}
		for _, field := range []string{"v", "a", "r", "g"} {
			cases["uppercase_"+field] = strings.Replace(valid, `"`+field+`":`, `"`+strings.ToUpper(field)+`":`, 1)
			for _, value := range []struct{ name, raw string }{{"same", string(fields[field])}, {"null", "null"}} {
				cases["duplicate_"+field+"_"+value.name] = strings.TrimSuffix(valid, "}") + `,"` + field + `":` + value.raw + `}`
			}
			for _, value := range []struct{ name, raw string }{{"null", "null"}, {"object", "{}"}} {
				changed := make(map[string]json.RawMessage, len(fields))
				for k, v := range fields {
					changed[k] = v
				}
				changed[field] = json.RawMessage(value.raw)
				b, err := json.Marshal(changed)
				if err != nil {
					t.Fatal(err)
				}
				cases[value.name+"_"+field] = string(b)
			}
		}
		for name, meta := range cases {
			t.Run(name+map[bool]string{false: "/strict", true: "/migration"}[migration], func(t *testing.T) {
				f.insertCalled = false
				_, err := NewConsoleGRPC(v).Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: meta})
				if status.Code(err) != codes.InvalidArgument || f.insertCalled {
					t.Errorf("noncanonical insert: code=%v forwarded=%v", status.Code(err), f.insertCalled)
				}
				if opened, err := NewConsoleGRPC(v).openMeta(meta, "record"); err == nil || opened != "" {
					t.Errorf("noncanonical read returned %q, error=%v", opened, err)
				}
			})
		}
	}
}

func TestMetadataRecordValidationAtInsertAndRead(t *testing.T) {
	v, f, token := metadataWriter(t)
	future, _ := json.Marshal(map[string]any{"timestamp": time.Now().Add(10 * time.Minute), "insight": "future"})
	cases := map[string][]byte{
		"utf8":  append([]byte(`{"timestamp":"2026-10-28T12:00:00Z","insight":"`), append([]byte{0xff}, []byte(`"}`)...)...),
		"empty": {}, "array": []byte(`[]`), "null": []byte(`null`), "missing_time": []byte(`{"insight":"test"}`),
		"missing_insight": []byte(`{"timestamp":"2026-10-28T12:00:00Z"}`),
		"blank_insight":   []byte(`{"timestamp":"2026-10-28T12:00:00Z","insight":" \t "}`),
		"invalid_time":    []byte(`{"timestamp":"invalid","insight":"test"}`), "future": future,
		"insight_limit": []byte(`{"timestamp":"2026-10-28T12:00:00Z","insight":"` + strings.Repeat("x", 64*1024+1) + `"}`),
		"context_limit": []byte(`{"timestamp":"2026-10-28T12:00:00Z","insight":"test","context":"` + strings.Repeat("x", 64*1024+1) + `"}`),
	}
	for name, raw := range cases {
		t.Run(name, func(t *testing.T) {
			meta := testMetadataV2Payload(t, v, token, "record", raw)
			f.insertCalled = false
			_, err := NewConsoleGRPC(v).Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: meta})
			if status.Code(err) != codes.InvalidArgument || f.insertCalled {
				t.Fatalf("invalid record inserted: %v forwarded=%v", err, f.insertCalled)
			}
			f.hits = []crypto.SearchHit{{ID: "record", Metadata: meta}}
			resp, err := NewConsoleGRPC(v).Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5})
			if status.Code(err) != codes.DataLoss || len(resp.GetHits()) != 0 {
				t.Fatalf("invalid v2 record returned: %v %v", resp, err)
			}
		})
	}
	// A small client clock skew is allowed, and escaped unicode remains valid.
	raw, _ := json.Marshal(map[string]any{"timestamp": time.Now().Add(2 * time.Minute), "insight": "공유 기억"})
	_, err := NewConsoleGRPC(v).Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: testMetadataV2Payload(t, v, token, "record", raw)})
	if err != nil {
		t.Fatal(err)
	}
}

func TestLegacyReadFailuresAreExcluded(t *testing.T) {
	v, f, token := metadataWriter(t)
	v.cfg.AllowLegacyMetadataRead = true
	invalidUTF8 := string(append([]byte(`{"timestamp":"2026-10-28T12:00:00Z","insight":"`), append([]byte{0xff}, []byte(`"}`)...)...))
	for _, raw := range []string{"", "not json", `[]`, invalidUTF8} {
		meta, err := NewConsoleGRPC(v).sealMeta(token, raw)
		if err != nil {
			t.Fatal(err)
		}
		f.hits = []crypto.SearchHit{{ID: "good", Metadata: testMetadataV2(t, v, token, "good")}, {ID: "legacy", Metadata: meta}}
		resp, err := NewConsoleGRPC(v).Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5})
		if err != nil || len(resp.GetHits()) != 1 || resp.Hits[0].Metadata != testValidMetadataRecord {
			t.Fatalf("legacy failure escaped exclusion: %v %v", resp, err)
		}
		if _, err := proto.Marshal(resp); err != nil {
			t.Fatalf("response cannot be encoded: %v", err)
		}
	}
	for _, meta := range []string{`{"a":"agent","c":"!"}`, `{"a":"agent","c":"!","extra":true}`, `{"a":"agent"}`} {
		f.hits = []crypto.SearchHit{{ID: "legacy", Metadata: meta}}
		resp, err := NewConsoleGRPC(v).Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5})
		if err != nil || len(resp.GetHits()) != 0 {
			t.Fatalf("invalid legacy returned: %v %v", resp, err)
		}
	}
}

func TestMetadataEnvelopeSizeLimit(t *testing.T) {
	v, f, token := metadataWriter(t)
	_, err := NewConsoleGRPC(v).Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: strings.Repeat(" ", 2*1024*1024+1) + testMetadataV2(t, v, token, "record")})
	if status.Code(err) != codes.InvalidArgument || f.insertCalled {
		t.Fatalf("oversized envelope accepted: %v", err)
	}
}

// sealMeta AES-seals plaintext metadata under the caller's per-agent DEK and
// wraps it in an {a,c} envelope for storage. Empty metadata seals to "".
func (s *ConsoleGRPC) sealMeta(token, meta string) (string, error) {
	if meta == "" {
		return "", nil
	}
	if s.v.cfg.Tokens.TeamSecret == "" {
		return "", errors.New("team secret not configured")
	}
	agentID := crypto.AgentIDFromToken(token)
	dek, err := crypto.DeriveAgentKey(s.v.cfg.Tokens.TeamSecret, agentID)
	if err != nil {
		return "", err
	}
	c, err := crypto.EncryptMetadata([]byte(meta), dek)
	if err != nil {
		return "", err
	}
	b, err := json.Marshal(envelope{AgentID: agentID, Cipher: c})
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func TestInsertedV2IDCannotReturnLegacy(t *testing.T) {
	v, f, token := metadataWriter(t)
	v.cfg.AllowLegacyMetadataRead = true
	srv := NewConsoleGRPC(v)
	meta := testMetadataV2(t, v, token, "record")
	if _, err := srv.Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: meta}); err != nil {
		t.Fatal(err)
	}
	legacy, err := srv.sealMeta(token, testValidMetadataRecord)
	if err != nil {
		t.Fatal(err)
	}
	f.hits = []crypto.SearchHit{{ID: "record", Metadata: legacy}}
	if resp, err := srv.Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5}); status.Code(err) != codes.DataLoss || len(resp.GetHits()) != 0 {
		t.Fatalf("known v2 ID accepted legacy: %v %v", resp, err)
	}
}

func TestInsertCentroidMismatchContract(t *testing.T) {
	v, f, token := metadataWriter(t)
	f.insertErr = fmt.Errorf("stale set: %w", runespace.ErrCentroidVersionMismatch)
	_, err := NewConsoleGRPC(v).Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: testMetadataV2(t, v, token, "record")})
	if status.Code(err) != codes.FailedPrecondition || !strings.HasPrefix(status.Convert(err).Message(), "WRONG_CENTROID_VERSION:") {
		t.Fatalf("mismatch contract: %v", err)
	}
}
