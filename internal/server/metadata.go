package server

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/CryptoLabInc/rune-console/internal/crypto"
	"google.golang.org/grpc/peer"
)

// Bounds include room for JSON escaping followed by base64 encoding. Keep
// plaintext field limits aligned with rune-mcp's domain.Record validation.
const (
	maxMetadataEnvelopeBytes = 2 * 1024 * 1024
	maxInsightBytes          = 64 * 1024
	maxContextBytes          = 64 * 1024
	maxAuthorBytes           = 4 * 1024
	metadataClockSkew        = 5 * time.Minute
)

type metadataReadError struct {
	reason   string
	excluded bool
}

func (e *metadataReadError) Error() string { return e.reason }

// openMeta authenticates v2 against the outer record ID. The envelope agent
// selects a key for shared reads; GCM authenticates that selection and both IDs.
// Legacy bytes are never treated as authenticated, even when compatibility
// reads are enabled. Policy exclusions must not fail an entire search.
func (s *ConsoleGRPC) openMeta(stored, recordID string) (string, error) {
	fail := func(reason string) (string, error) { return "", &metadataReadError{reason: reason} }
	skip := func(reason string) (string, error) { return "", &metadataReadError{reason: reason, excluded: true} }
	requiresV2, registryErr := s.v.requiresMetadataV2(recordID)
	if registryErr != nil {
		return fail("metadata_registry")
	}
	if stored == "" {
		if requiresV2 {
			return fail("v2_downgrade")
		}
		return skip("missing_metadata")
	}
	if len(stored) > maxMetadataEnvelopeBytes {
		return fail("envelope_size")
	}
	fields, err := crypto.ParseMetadataFields(stored)
	if err != nil {
		return fail("envelope_format")
	}
	if hasMetadataV2Marker(fields) {
		env, err := crypto.MetadataV2FromFields(fields)
		if err != nil {
			return fail("v2_envelope")
		}
		dek, err := crypto.DeriveAgentKey(s.v.cfg.Tokens.TeamSecret, env.AgentID)
		if err != nil {
			return fail("v2_key")
		}
		pt, err := crypto.DecryptMetadataV2Envelope(env, dek, env.AgentID, recordID)
		if err != nil {
			return fail("v2_authentication")
		}
		if !validMetadataRecord(pt, time.Now()) {
			return fail("v2_record")
		}
		return string(pt), nil
	}
	if requiresV2 {
		return fail("v2_downgrade")
	}
	if !s.v.cfg.AllowLegacyMetadataRead {
		return skip("legacy_disabled")
	}
	// Released producers wrote exactly {a,c}. Plaintext Record objects have no
	// legitimate producer and must never become an unauthenticated fallback.
	if len(fields) != 2 {
		return skip("legacy_invalid")
	}
	var env envelope
	if json.Unmarshal(fields["a"], &env.AgentID) != nil ||
		json.Unmarshal(fields["c"], &env.Cipher) != nil || env.AgentID == "" || env.Cipher == "" {
		return skip("legacy_invalid")
	}
	dek, err := crypto.DeriveAgentKey(s.v.cfg.Tokens.TeamSecret, env.AgentID)
	if err != nil {
		return skip("legacy_invalid")
	}
	pt, err := crypto.DecryptMetadata(env.Cipher, dek)
	if err != nil || !validMetadataRecord(pt, time.Now()) {
		return skip("legacy_invalid")
	}
	count := s.v.legacyMetadataReads.Add(1)
	slog.Warn("console: unauthenticated legacy metadata read", "record_id", recordID, "legacy_reads_total", count)
	return string(pt), nil
}

// validMetadataRecord checks rune-mcp's domain.Record contract before any
// plaintext can be persisted or returned in a protobuf string. JSON alone
// accepts invalid UTF-8 by replacing bytes, so validate the original bytes first.
func validMetadataRecord(raw []byte, now time.Time) bool {
	if len(raw) > maxMetadataEnvelopeBytes || !utf8.Valid(raw) {
		return false
	}
	var record struct {
		Timestamp time.Time `json:"timestamp"`
		Insight   string    `json:"insight"`
		Author    string    `json:"author"`
		Context   string    `json:"context"`
	}
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.DisallowUnknownFields()
	if decoder.Decode(&record) != nil || !json.Valid(raw) {
		return false
	}
	return !record.Timestamp.IsZero() && !record.Timestamp.After(now.Add(metadataClockSkew)) &&
		strings.TrimSpace(record.Insight) != "" && len(record.Insight) <= maxInsightBytes &&
		len(record.Context) <= maxContextBytes && len(record.Author) <= maxAuthorBytes
}

func (s *ConsoleGRPC) emitMetadataEvent(ctx context.Context, user, recordID, outcome, reason string, count uint64) {
	slog.Warn("console: search metadata", "record_id", recordID, "outcome", outcome, "reason", reason,
		"excluded_total", count, "legacy_reads_total", s.v.legacyMetadataReads.Load())
	if s.v.audit == nil || !s.v.audit.Enabled() {
		return
	}
	p, _ := peer.FromContext(ctx)
	s.v.audit.Log(AuditEntry{Timestamp: nowUTCISO(), UserID: user, Method: "search_metadata", Status: outcome,
		SourceIP: ExtractSourceIP(p), Target: recordID, Error: &reason})
}
