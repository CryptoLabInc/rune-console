package server

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hkdf"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/CryptoLabInc/rune-console/internal/crypto"
	"github.com/CryptoLabInc/rune-console/internal/groups"
	"github.com/CryptoLabInc/rune-console/internal/tokens"
	pb "github.com/CryptoLabInc/rune-console/pkg/consolepb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"gopkg.in/yaml.v3"
)

// Independent test sealer; production has only the authenticated reader.
func testMetadataV2(t *testing.T, v *Console, token, id string) string {
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
	raw := aead.Seal(nonce, nonce, []byte(`{"text":"shared memory"}`), aad)
	b, _ := json.Marshal(map[string]any{"v": 2, "a": agent, "r": id, "c": base64.StdEncoding.EncodeToString(raw)})
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
					meta = strings.Replace(meta, `"c":"`, `"c":"AAAA`, 1)
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
					meta = strings.Replace(meta, `"c":"`, `"c":"AAAA`, 1)
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
				success := kind == "valid" || migration && (kind == "legacy" || kind == "plaintext")
				if success {
					if err != nil || len(resp.GetHits()) != 2 {
						t.Fatalf("search: %v %v", resp, err)
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
