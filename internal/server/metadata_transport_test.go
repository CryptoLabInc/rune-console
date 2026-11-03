package server

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"testing"

	"github.com/CryptoLabInc/rune-console/internal/crypto"
	pb "github.com/CryptoLabInc/rune-console/pkg/consolepb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
)

func TestMetadataInsertSearchThroughValidatedTransport(t *testing.T) {
	v, f, token := metadataWriter(t)
	listener := bufconn.Listen(4 * 1024 * 1024)
	server := grpc.NewServer(grpc.UnaryInterceptor(mustInterceptor(t)))
	pb.RegisterConsoleServiceServer(server, NewConsoleGRPC(v))
	go func() { _ = server.Serve(listener) }()
	t.Cleanup(server.Stop)
	conn, err := grpc.NewClient("passthrough:///metadata-test", grpc.WithTransportCredentials(insecure.NewCredentials()), grpc.WithContextDialer(func(context.Context, string) (net.Conn, error) { return listener.Dial() }))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = conn.Close() })
	client := pb.NewConsoleServiceClient(conn)
	const id = "123e4567-e89b-42d3-a456-426614174000"
	req := &pb.InsertRequest{Token: token, Id: id, RmpItem: []byte{1}, MmItem: []byte{1}, CentroidSetVersion: "v1", Metadata: testMetadataV2(t, v, token, id)}
	if _, err := client.Insert(context.Background(), req); err != nil {
		t.Fatal(err)
	}
	if f.gotItem.SealedMetadata != req.Metadata {
		t.Fatal("forwarded metadata changed")
	}
	f.hits = []crypto.SearchHit{{ID: id, Metadata: f.gotItem.SealedMetadata}}
	resp, err := client.Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5})
	if err != nil || len(resp.GetHits()) != 1 || resp.Hits[0].Metadata != testValidMetadataRecord {
		t.Fatalf("transport round trip: %v %v", resp, err)
	}
	// Bad record data is rejected before it reaches transport response encoding.
	req.Metadata = testMetadataV2Payload(t, v, token, id, []byte("invalid record"))
	if _, err := client.Insert(context.Background(), req); status.Code(err) != codes.InvalidArgument {
		t.Fatalf("invalid record insert: %v", err)
	}
	var audit bytes.Buffer
	v.audit = &AuditLogger{writers: []io.Writer{&audit}}
	f.hits = []crypto.SearchHit{{ID: id, Metadata: req.Metadata}}
	if _, err := client.Search(context.Background(), &pb.SearchRequest{Token: token, Vector: []float32{1}, TopK: 5}); status.Code(err) != codes.DataLoss {
		t.Fatalf("invalid record search: %v", err)
	}
	decoder := json.NewDecoder(&audit)
	var event, summary AuditEntry
	if err := decoder.Decode(&event); err != nil {
		t.Fatal(err)
	}
	if err := decoder.Decode(&summary); err != nil {
		t.Fatal(err)
	}
	if event.Target != id || event.Status != "error" || summary.Status != "error" || summary.ResultCount != 0 {
		t.Fatalf("invalid audit: %+v %+v", event, summary)
	}
}
