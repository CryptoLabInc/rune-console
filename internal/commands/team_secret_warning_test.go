package commands

import (
	"bytes"
	"context"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/CryptoLabInc/rune-console/internal/server"
	"gopkg.in/yaml.v3"
)

func TestDaemonWarnsForObviouslyWeakTeamSecretsWithoutRejectingConfig(t *testing.T) {
	for _, tc := range []struct {
		name   string
		secret string
		warn   bool
	}{
		{"blank", "", true},
		{"whitespace", " \t ", true},
		{"short", "s3cr3t-must-not-appear", true},
		{"sample placeholder", "REPLACE_WITH_RANDOM_HEX_32", true},
		{"long placeholder", "REPLACE_WITH_RANDOM_HEX_32_OR_MORE_BYTES", true},
		{"random hex", "6f18a3be73e40d72cf2918bd1c2f09e57aeab68c21043ed560198bf3920dced7", false},
		{"nonhex", "rA8!u#2wQ9:7z'LM5\\cd$P3et+6VhKxN", false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			dir := t.TempDir()
			blockedDir := filepath.Join(dir, "not-a-directory")
			if err := os.WriteFile(blockedDir, []byte("stop before database initialization"), 0o600); err != nil {
				t.Fatal(err)
			}
			cfg := server.Config{
				Server:  server.ServerConfig{GRPC: server.GRPCConfig{Port: 50051, TLS: server.TLSConfig{Cert: "test.pem", Key: "test.key"}}},
				Keys:    server.KeysConfig{Path: filepath.Join(dir, "keys"), EmbeddingDim: 1024},
				Tokens:  server.TokensConfig{TeamSecret: tc.secret},
				Storage: server.StorageConfig{DataDir: blockedDir},
			}
			if err := cfg.Validate(); err != nil {
				t.Fatalf("secret strength must not reject existing configs: %v", err)
			}
			body, err := yaml.Marshal(cfg)
			if err != nil {
				t.Fatal(err)
			}
			path := filepath.Join(dir, "runeconsole.conf")
			if err := os.WriteFile(path, body, 0o600); err != nil {
				t.Fatal(err)
			}
			oldGlobals, oldLogger := globals, slog.Default()
			t.Cleanup(func() { globals = oldGlobals; slog.SetDefault(oldLogger) })
			globals.configPath = path
			var logs bytes.Buffer
			slog.SetDefault(slog.New(slog.NewTextHandler(&logs, nil)))
			if err := runDaemonStart(context.Background()); err == nil || !strings.Contains(err.Error(), "open store db") {
				t.Fatalf("expected isolated database stop after configuration, got %v", err)
			}
			if strings.Contains(logs.String(), "weak team_secret") != tc.warn {
				t.Fatalf("weak-secret warning present=%v, want %v", strings.Contains(logs.String(), "weak team_secret"), tc.warn)
			}
			if tc.warn && !strings.Contains(logs.String(), "migration") {
				t.Fatal("warning must not encourage changing an existing team's key without migration")
			}
			if len(tc.secret) > 3 && strings.Contains(logs.String(), tc.secret) {
				t.Fatal("startup warning disclosed the team secret")
			}
		})
	}
}
