package crypto

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
)

// TestEngineSmoke registers keys and leaves a tagged v2 test record behind.
// Run ONLY against a disposable RuneSpace instance; never a production instance.
// The parallel stage exercises the shared SDK decryption context at dim 1024.
//
// RUNESPACE_SMOKE_DISPOSABLE=1 RUNESPACE_ADDR=127.0.0.1:51024 go test ./internal/crypto -run EngineSmoke -v
func TestEngineSmoke(t *testing.T) {
	addr := os.Getenv("RUNESPACE_ADDR")
	if addr == "" || os.Getenv("RUNESPACE_SMOKE_DISPOSABLE") != "1" {
		t.Skip("set RUNESPACE_ADDR and RUNESPACE_SMOKE_DISPOSABLE=1 for a disposable live instance")
	}
	const dim = 1024
	kp := KeysParams{Root: t.TempDir(), KeyID: "smoke-key", Dim: dim}
	if err := EnsureKeys(kp); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	eng, err := OpenEngine(ctx, EngineParams{Keys: kp, Endpoint: addr, Insecure: true})
	if err != nil {
		t.Fatal(err)
	}
	defer eng.Close()
	vec := make([]float32, dim)
	var norm float64
	for i := range vec {
		vec[i] = float32(math.Sin(float64(i) * 0.01))
		norm += float64(vec[i]) * float64(vec[i])
	}
	for i := range vec {
		vec[i] /= float32(math.Sqrt(norm))
	}
	cs, err := eng.Centroids(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(cs.Vectors) == 0 || cs.Dim != dim {
		t.Fatal("smoke instance needs configured dim-1024 centroids")
	}
	best := math.Inf(-1)
	cluster := uint32(0)
	for i, centroid := range cs.Vectors {
		var dot float64
		if len(centroid) != dim {
			t.Fatal("invalid centroid dimension")
		}
		for j, x := range centroid {
			dot += float64(x) * float64(vec[j])
		}
		if dot > best {
			best, cluster = dot, uint32(i)
		}
	}
	rmp, err := eng.keys.EncryptFlat(vec)
	if err != nil {
		t.Fatal(err)
	}
	mm, err := eng.keys.EncryptClustered(vec)
	if err != nil {
		t.Fatal(err)
	}
	id, scope := uuid.NewString(), uuid.NewString()
	base := make([]byte, 32)
	if _, err = rand.Read(base); err != nil {
		t.Fatal(err)
	}
	key, err := deriveMetadataV2Key(base)
	if err != nil {
		t.Fatal(err)
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		t.Fatal(err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		t.Fatal(err)
	}
	const agent = "0123456789abcdef0123456789abcdef"
	payload, _ := json.Marshal(map[string]any{"timestamp": time.Now().UTC(), "insight": "Disposable concurrent recall smoke " + id})
	aad, _ := json.Marshal([4]string{"rune-metadata", "2", agent, id})
	nonce := make([]byte, aead.NonceSize())
	if _, err = rand.Read(nonce); err != nil {
		t.Fatal(err)
	}
	raw := aead.Seal(nonce, nonce, payload, aad)
	envelope, _ := json.Marshal(map[string]any{"v": 2, "a": agent, "r": id, "g": base64.StdEncoding.EncodeToString(raw)})
	if err = eng.InsertPreEncrypted(ctx, PreEncryptedItem{ID: id, RMPBlob: rmp, MMBlob: mm, ClusterID: cluster, CentroidSetVersion: cs.Version, SealedMetadata: string(envelope)}, scope); err != nil {
		t.Fatal(err)
	}
	check := func() error {
		hits, err := eng.Search(ctx, vec, 5, scope)
		if err != nil {
			return err
		}
		for _, h := range hits {
			if h.ID == id {
				if math.IsNaN(h.Score) || math.IsInf(h.Score, 0) || h.Score < 0.9 || h.Score > 1.1 {
					return fmt.Errorf("self score outside tolerance: %f", h.Score)
				}
				opened, err := DecryptMetadataV2(h.Metadata, base, agent, id)
				if err != nil || string(opened) != string(payload) {
					return fmt.Errorf("metadata round trip mismatch: %v", err)
				}
				return nil
			}
		}
		return fmt.Errorf("inserted record absent from results")
	}
	if err = check(); err != nil {
		t.Fatal(err)
	}
	const workers, perWorker = 8, 50
	errs := make(chan error, workers)
	var wg sync.WaitGroup
	for i := 0; i < workers; i++ {
		wg.Go(func() {
			for j := 0; j < perWorker; j++ {
				if err := check(); err != nil {
					errs <- err
					return
				}
			}
		})
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Error(err)
	}
	t.Logf("completed %d concurrent recalls at dimension %d", workers*perWorker, dim)
}
