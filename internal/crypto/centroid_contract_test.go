package crypto

import (
	"context"
	"errors"
	"fmt"
	"io"
	"testing"

	runespace "github.com/CryptoLabInc/runespace-sdk"
	pb "github.com/CryptoLabInc/runespace-sdk/pkg/runespacepb"
	"google.golang.org/genproto/googleapis/rpc/errdetails"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

type centroidContractStream struct {
	ctx     context.Context
	version string
	sent    bool
}

func (s *centroidContractStream) Header() (metadata.MD, error) { return nil, nil }
func (s *centroidContractStream) Trailer() metadata.MD         { return nil }
func (s *centroidContractStream) CloseSend() error             { return nil }
func (s *centroidContractStream) Context() context.Context     { return s.ctx }
func (s *centroidContractStream) SendMsg(any) error            { return nil }
func (s *centroidContractStream) RecvMsg(msg any) error {
	if s.sent {
		return io.EOF
	}
	s.sent = true
	proto.Merge(msg.(proto.Message), &pb.GetCentroidsChunk{Payload: &pb.GetCentroidsChunk_Header{Header: &pb.CentroidSetHeader{Version: s.version, Dim: 1024}}})
	return nil
}

func TestInsertCentroidMismatchRefreshesCachedSet(t *testing.T) {
	fetches := 0
	client, err := runespace.Dial("passthrough:///centroid-contract", runespace.WithInsecure(),
		runespace.WithUnaryInterceptor(func(context.Context, string, any, any, *grpc.ClientConn, grpc.UnaryInvoker, ...grpc.CallOption) error {
			st, err := status.New(codes.FailedPrecondition, "centroid set replaced").WithDetails(&errdetails.ErrorInfo{Reason: "ERROR_REASON_CENTROID_VERSION_MISMATCH"})
			if err != nil {
				return err
			}
			return st.Err()
		}),
		runespace.WithStreamInterceptor(func(ctx context.Context, _ *grpc.StreamDesc, _ *grpc.ClientConn, _ string, _ grpc.Streamer, _ ...grpc.CallOption) (grpc.ClientStream, error) {
			fetches++
			return &centroidContractStream{ctx: ctx, version: fmt.Sprintf("v%d", fetches)}, nil
		}))
	if err != nil {
		t.Fatal(err)
	}
	defer client.Close()
	eng := &Engine{client: client}
	first, err := eng.Centroids(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if err := eng.InsertPreEncrypted(context.Background(), PreEncryptedItem{ID: "record", RMPBlob: []byte{1}, MMBlob: []byte{1}, CentroidSetVersion: first.Version}); !errors.Is(err, runespace.ErrCentroidVersionMismatch) {
		t.Fatalf("lost mismatch: %v", err)
	}
	next, err := eng.Centroids(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if next.Version == first.Version || fetches != 2 {
		t.Fatalf("stale centroids: %q -> %q fetches=%d", first.Version, next.Version, fetches)
	}
}
