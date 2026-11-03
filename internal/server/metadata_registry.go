package server

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/CryptoLabInc/rune-console/internal/storedb"
)

// SetMetadataRegistry attaches the trusted format registry before serving RPCs.
// The daemon must use the same durable store as its tokens and memberships.
// A missing/unavailable registry fails closed; it never enables legacy reads.
func (v *Console) SetMetadataRegistry(database *sql.DB) error {
	if database == nil {
		return errors.New("metadata registry unavailable")
	}
	var exists bool
	if err := database.QueryRow("SELECT EXISTS(SELECT 1 FROM metadata_v2_records)").Scan(&exists); err != nil {
		return fmt.Errorf("metadata registry: %w", err)
	}
	v.metadataDB = database
	return nil
}

func (v *Console) reserveMetadataV2(ctx context.Context, recordID string) error {
	if v.metadataDB == nil {
		return errors.New("metadata registry unavailable")
	}
	// Commit before contacting RuneSpace. Uncertain outcomes retain the pin;
	// retries may re-seal with a new nonce but cannot revert the ID to legacy.
	_, err := v.metadataDB.ExecContext(ctx,
		`INSERT INTO metadata_v2_records (record_id, first_seen_at) VALUES (?, ?)
		 ON CONFLICT(record_id) DO NOTHING`, recordID, storedb.FormatTime(time.Now()))
	return err
}

func (v *Console) requiresMetadataV2(recordID string) (bool, error) {
	if v.metadataDB == nil {
		return false, errors.New("metadata registry unavailable")
	}
	var found bool
	err := v.metadataDB.QueryRow("SELECT EXISTS(SELECT 1 FROM metadata_v2_records WHERE record_id = ?)", recordID).Scan(&found)
	return found, err
}
