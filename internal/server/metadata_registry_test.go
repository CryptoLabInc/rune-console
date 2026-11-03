package server

import (
	"context"
	"errors"
	"path/filepath"
	"testing"

	"github.com/CryptoLabInc/rune-console/internal/crypto"
	pb "github.com/CryptoLabInc/rune-console/pkg/consolepb"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestMetadataRegistrySurvivesRestartAndUncertainInsert(t *testing.T) {
	v, f, token := metadataWriter(t)
	v.cfg.AllowLegacyMetadataRead = true
	path := filepath.Join(t.TempDir(), "registry.db")
	database := openTokensTestDB(t, path)
	if err := v.SetMetadataRegistry(database); err != nil {
		t.Fatal(err)
	}
	srv := NewConsoleGRPC(v)
	// Reserve before the external call: a transport error may follow a write.
	f.insertErr = errors.New("unavailable")
	req := &pb.InsertRequest{Token: token, Id: "record", Metadata: testMetadataV2(t, v, token, "record")}
	if _, err := srv.Insert(context.Background(), req); status.Code(err) != codes.Internal {
		t.Fatalf("insert failure: %v", err)
	}
	if err := database.Close(); err != nil {
		t.Fatal(err)
	}
	restarted := NewConsole(v.cfg, v.tokens, v.groups, nil, nil)
	if err := restarted.SetMetadataRegistry(openTokensTestDB(t, path)); err != nil {
		t.Fatal(err)
	}
	restarted.engine = f
	srv = NewConsoleGRPC(restarted)
	legacy, err := srv.sealMeta(token, testValidMetadataRecord)
	if err != nil {
		t.Fatal(err)
	}
	f.hits = []crypto.SearchHit{{ID: "record", Metadata: legacy}}
	if _, err := srv.Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5}); status.Code(err) != codes.DataLoss {
		t.Fatalf("restart lost v2 reservation: %v", err)
	}
	// A retry/rebuild can use the same record ID and a freshly sealed payload.
	f.insertErr = nil
	req.Metadata = testMetadataV2Payload(t, restarted, token, "record", []byte(`{"timestamp":"2026-10-28T12:00:00Z","insight":"rebuilt capture"}`))
	if _, err := srv.Insert(context.Background(), req); err != nil {
		t.Fatalf("retry failed: %v", err)
	}
	var n int
	if err := restarted.metadataDB.QueryRow("SELECT COUNT(*) FROM metadata_v2_records WHERE record_id = ?", "record").Scan(&n); err != nil || n != 1 {
		t.Fatalf("reservation count %d: %v", n, err)
	}
}

func TestMetadataRegistryUnavailableFailsClosed(t *testing.T) {
	for _, unavailable := range []string{"missing", "closed"} {
		t.Run(unavailable, func(t *testing.T) {
			v, f, token := metadataWriter(t)
			if unavailable == "missing" {
				v.metadataDB = nil
			} else if err := v.metadataDB.Close(); err != nil {
				t.Fatal(err)
			}
			meta := testMetadataV2(t, v, token, "record")
			if _, err := NewConsoleGRPC(v).Insert(context.Background(), &pb.InsertRequest{Token: token, Id: "record", Metadata: meta}); status.Code(err) != codes.FailedPrecondition || f.insertCalled {
				t.Fatalf("registry failure allowed insert: %v", err)
			}
			v.cfg.AllowLegacyMetadataRead = true
			legacy, err := NewConsoleGRPC(v).sealMeta(token, testValidMetadataRecord)
			if err != nil {
				t.Fatal(err)
			}
			f.hits = []crypto.SearchHit{{ID: "record", Metadata: legacy}}
			if _, err := NewConsoleGRPC(v).Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5}); status.Code(err) != codes.DataLoss {
				t.Fatalf("registry failure allowed read: %v", err)
			}
		})
	}
}

func TestRegisteredV2MissingMetadataFailsClosed(t *testing.T) {
	for _, legacy := range []bool{false, true} {
		t.Run(map[bool]string{false: "strict", true: "compatibility"}[legacy], func(t *testing.T) {
			v, f, token := metadataWriter(t)
			v.cfg.AllowLegacyMetadataRead = legacy
			srv := NewConsoleGRPC(v)
			req := &pb.InsertRequest{Token: token, Id: "registered", Metadata: testMetadataV2(t, v, token, "registered")}
			if _, err := srv.Insert(context.Background(), req); err != nil {
				t.Fatal(err)
			}
			f.hits = []crypto.SearchHit{{ID: "good", Metadata: testMetadataV2(t, v, token, "good")}, {ID: "registered", Metadata: ""}}
			resp, err := srv.Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5})
			if status.Code(err) != codes.DataLoss || len(resp.GetHits()) != 0 {
				t.Fatalf("registered v2 metadata omission escaped integrity failure: %v %v", resp, err)
			}
			if status.Convert(err).Message() != "metadata integrity check failed" {
				t.Fatalf("non-generic integrity error: %v", err)
			}
		})
	}
}
