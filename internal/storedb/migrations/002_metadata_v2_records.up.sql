-- Local, trusted format reservations. Keep rows across retries, failed remote
-- writes, and workspace replacement: a reserved ID must never be read as CTR.
CREATE TABLE metadata_v2_records (
  record_id TEXT PRIMARY KEY NOT NULL,
  first_seen_at TEXT NOT NULL
);
