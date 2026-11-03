package commands

import (
	"encoding/hex"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"

	"github.com/CryptoLabInc/rune-console/internal/server"
)

// Run the installer's real configuration phase without downloads, services,
// certificate generation, or other installation side effects.
func runInstallConfig(t *testing.T, prefix, secret string, force bool) (string, error) {
	t.Helper()
	body, err := os.ReadFile(filepath.Join("..", "..", "install.sh"))
	if err != nil {
		t.Fatal(err)
	}
	definitions, _, found := strings.Cut(string(body), "# ── Main ")
	if !found {
		t.Fatal("installer entry point not found")
	}
	args := []string{"-c", definitions + "\ncollect_and_write_config\n", "install-config-test"}
	if force {
		args = append(args, "--force")
	}
	cmd := exec.Command("bash", args...)
	cmd.Env = append(os.Environ(),
		"RUNECONSOLE_INSTALL_PREFIX="+prefix,
		"RUNECONSOLE_SKIP_SERVICE=1",
		"RUNECONSOLE_TEAM_SECRET="+secret,
		"RUNECONSOLE_CLOUD_API_BASE_URL=https://cloud.invalid",
		"RUNECONSOLE_CLOUD_WEB_BASE_URL=https://console.invalid")
	out, err := cmd.CombinedOutput()
	return string(out), err
}

func TestInstallerPreservesTeamSecret(t *testing.T) {
	for _, tc := range []struct{ name, secret string }{
		{"comment marker", "restore-this-secret # with a comment marker"},
		{"colon", "restore-this-secret: with a colon"},
		{"quotes and backslashes", `restore-this-'quoted'-"secret"-\path\n`},
		{"outer spaces", "  restore this secret with outer spaces  "},
		{"tab", "restore-this-secret\twith-a-tab"},
		{"unicode", "복원할 비밀값 # ': \\ 정확히 유지"},
		{"boolean text", "false"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			secret := tc.secret
			prefix := t.TempDir()
			if err := os.Mkdir(filepath.Join(prefix, "configs"), 0o700); err != nil {
				t.Fatal(err)
			}
			out, err := runInstallConfig(t, prefix, secret, false)
			if err != nil {
				t.Fatalf("configuration phase failed: %v: %s", err, out)
			}
			cfg, err := server.LoadConfig(filepath.Join(prefix, "configs", "runeconsole.conf"))
			if err != nil {
				t.Fatal(err)
			}
			if cfg.Tokens.TeamSecret != secret {
				t.Fatal("installer changed the restored team secret")
			}
			if strings.Contains(out, secret) {
				t.Fatal("installer logged the team secret")
			}
		})
	}
}

func TestInstallerRejectsMultilineSecretBeforeOverwrite(t *testing.T) {
	for _, newline := range []string{"\n", "\r", "\r\n", "\u0085", "\u2028", "\u2029"} {
		t.Run(strings.ReplaceAll(newline, "\n", "LF"), func(t *testing.T) {
			prefix := t.TempDir()
			configDir := filepath.Join(prefix, "configs")
			if err := os.Mkdir(configDir, 0o700); err != nil {
				t.Fatal(err)
			}
			path := filepath.Join(configDir, "runeconsole.conf")
			const previous = "previous configuration must survive\n"
			if err := os.WriteFile(path, []byte(previous), 0o600); err != nil {
				t.Fatal(err)
			}
			secret := "restored-secret-first-line" + newline + "private-second-line"
			out, err := runInstallConfig(t, prefix, secret, true)
			if err == nil {
				t.Fatal("installer accepted a multiline team secret")
			}
			got, err := os.ReadFile(path)
			if err != nil || string(got) != previous {
				t.Fatal("invalid secret overwrote the existing configuration")
			}
			if !strings.Contains(out, "single line") || strings.Contains(out, "private-second-line") {
				t.Fatalf("expected safe single-line validation error, got %q", out)
			}
		})
	}
}

func TestInstallerGeneratesDefaultTeamSecret(t *testing.T) {
	prefix := t.TempDir()
	if err := os.Mkdir(filepath.Join(prefix, "configs"), 0o700); err != nil {
		t.Fatal(err)
	}
	if out, err := runInstallConfig(t, prefix, "", false); err != nil {
		t.Fatalf("configuration phase failed: %v: %s", err, out)
	}
	cfg, err := server.LoadConfig(filepath.Join(prefix, "configs", "runeconsole.conf"))
	if err != nil {
		t.Fatal(err)
	}
	secret, err := hex.DecodeString(cfg.Tokens.TeamSecret)
	if err != nil || len(secret) != 32 {
		t.Fatal("default installation did not generate a 256-bit hex team secret")
	}
}
