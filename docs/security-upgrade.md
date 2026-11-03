# Security boundary and coordinated upgrade

These notes describe source changes under review, not a released deployment.
The RUNE installer still pins `rune-mcp` v1.0.0, whose capture path performs a
plaintext-vector novelty query. Updating this source or its documentation does
not change installed clients. Release tags, runtime pins, plugin versions/cache,
and clean-install evidence must be coordinated before announcing availability.

## What is protected, and by whom

- Stored item vectors are encrypted for RuneSpace search. This capture source
  embeds locally, encrypts, and inserts without a plaintext-vector novelty query.
  Separate capture calls can create duplicates. Do not use `recall(insight)` as
  a substitute deduplication step: recall sends a plaintext query vector.
- Recall query vectors remain plaintext to Console and RuneSpace. Routing cluster
  IDs, tags, agent IDs, ciphertext lengths, and access patterns are not hidden.
- Console is a trusted component. It holds HE secret keys and derives payload
  keys; its operator and host root can access plaintext. MCP receives its agent's
  payload DEK as well as public HE material. This is not end-to-end privacy from
  Console, and receiving a DEK does not require a write role.
- v2 authenticates the payload and its agent/record IDs. It is not a Console
  attestation or proof of a human author: clients holding a DEK can construct
  payloads, and the `author` text is not a verified identity. Insert checks the
  authenticated caller's agent ID; that check is not a signature on stored data.
- Console sends a scope-filtered search request. Correct filtering by RuneSpace
  remains a trust assumption: metadata authentication does not bind scope tags,
  vectors, or scores, verify search computation, or prove result completeness.
- Revocation stops future authorized service access; it cannot erase keys or
  plaintext already received. Invitation delivery through the relay and email is
  trusted: a registration string carries a bearer credential, endpoint, and CA
  fingerprint. A pinned CA does not make a compromised invitation channel safe.

See the [metadata v2 wire specification](metadata-envelope-v2.md) for exact bytes,
validation, and failure behavior.

## Reader policy and downgrade limits

The default `allow_legacy_metadata_read: false` excludes legacy hits; it does not
fail an otherwise valid search merely because a legacy hit is present. Exclusions
can leave fewer than `top_k` results; the reader does not refill the result set.

Explicit `allow_legacy_metadata_read: true` permits only recognized legacy
AES-CTR `{a,c}` envelopes with valid Record content. Legacy content is
unauthenticated and malleable. Plaintext Record JSON is never a read fallback,
and legacy writes are never permitted by the new Console. Legacy decoding,
decryption, and Record-validation failures are uniformly excluded.

Recognized v2 format, authentication, identity, or Record failures abort the
whole search with generic gRPC `DataLoss`; no partial results are returned.
Malformed envelope JSON, duplicate envelope fields, oversized envelopes, or an
unavailable metadata registry also abort the search. Server logs/audit retain
reason codes and record IDs, not decrypted payloads. Do not automatically retry,
downgrade, or enable legacy compatibility to bypass `DataLoss`.

The Console SQLite `metadata_v2_records` registry durably reserves each v2 record
ID **before** the external insert. A reservation survives failed or uncertain
inserts, process restart, and workspace changes. A reserved ID must remain v2,
even when legacy compatibility is enabled. Unavailable registry storage fails
closed. Reservations contain no content digest: they do not prevent replay or
replacement with another valid payload using the same key and ID.

This protects IDs observed by this registry. Historical records written before
the registry existed are not automatically inventoried or pinned. In compatibility
mode, replacing an unknown historical v2 record with legacy content is not
prevented by the registry. Losing or rolling back SQLite state also loses newer
reservations. Strict mode avoids legacy fallback for unknown IDs. There is no
automatic migration, inventory, bulk rewrite, or deletion tool in these changes;
read counters describe observed hits, not the full stored corpus.

## Compatibility

“Old” means before these source changes; “new” means with them. These are not
published version names.

| MCP / Console | Capture | Reading existing records |
| --- | --- | --- |
| Old / old | Existing behavior, including plaintext novelty queries | Existing legacy behavior |
| New / old | Blocked when v2 capability is absent | No supported v2 read guarantee |
| Old / new | Blocked: Console rejects legacy writes | Recognized legacy requires explicit compatibility |
| New / new | Authenticated v2 writes without novelty queries | v2; legacy excluded unless explicitly enabled |

The source envelope now uses `g` for GCM bytes, leaving `c` exclusively for legacy
CTR. Earlier unreleased v2 fixtures using `c` must be regenerated. This prevents
old code from mistaking GCM bytes for CTR, but does not make an old Console a v2
reader: an old reader can return an opaque envelope that appears as an unusable
record. New configuration keys may also be rejected by old binaries.

## Upgrade and recovery

1. Schedule a coordinated maintenance window. Stop Console and make an encrypted,
   access-controlled, consistent backup of its entire state, then verify restore.
   For a default installation, preserve `/opt/runeconsole` and any configured
   paths outside it. Include both SQLite databases (`runeconsole.db`, containing
   membership/token state and the v2 registry, and
   `console-session.db`, containing cloud sessions, owner bindings, and data-plane
   credentials), configuration/team secret, HE keys, and TLS CA/key
   material. A host backup does not back up the external RuneSpace dataset.
2. Upgrade the Console reader/validator first on the existing host while preserving
   that state. Old MCP captures will be interrupted. If legacy reads are necessary,
   explicitly evaluate the compatibility risks above and validate representative
   reads. Do not promise a migration completion date without a separate migration
   and recovery procedure.
3. Upgrade MCP clients. Diagnostics must show `metadata_envelope_v2`. Missing
   capability and Console upgrade preconditions produce nonretryable
   `CONSOLE_UPGRADE_REQUIRED`. The client requests a rate-limited normal bootstrap
   refresh, but does not replay the capture. After the administrator upgrade,
   deactivate/activate once; if needed reconnect MCP or start a new agent session.
   Verify diagnostics before submitting the capture again.
4. Verify a new capture/recall, policy exclusions, rejection of legacy writes, and
   damaged-v2 failure on the intended workspace. A capture keeps one dependency
   generation; a centroid retry stops if that generation was replaced. Confirm
   the intended workspace before manually resubmitting. Transport retries reuse
   the original item/client; a timeout can still leave the write outcome unknown.
   A new capture call is a new record, not an idempotent replay of the old call.
5. Keep strict mode whenever legacy reads are not required. Keep backups and the
   recovery plan until verification is complete. Once v2 data exists, rolling back
   just the Console binary is not a supported recovery plan; retain a compatible
   reader or restore a verified, mutually consistent state/dataset recovery point.

Cloud provisioning is not an in-place upgrade mechanism. Inspect Terraform plans
for VM replacement and preserve persistent state before applying them. Existing
GCP startup metadata can reinstall its old pinned version on reboot. Review that
startup configuration before restarting an upgraded host; do not blindly rerun a
provisioning script to update an existing Console.

The installer generates a random team secret by default. An explicitly restored
`RUNECONSOLE_TEAM_SECRET` is YAML-quoted; line breaks are rejected before config
replacement. Startup warnings flag obvious placeholders or short secrets without
logging them. These checks do not measure entropy or implement key rotation.
Changing `team_secret` in place changes derived payload keys and can make existing
records unreadable; preserve it during restore unless following a separately
validated rotation/migration procedure.

## Release evidence still required

Local tests and shared fixtures are not proof of a released or live deployment.
Before advertising the coordinated upgrade, verify the actual tags, manifest and
runtime pins, plugin version/cache refresh, clean installation, old/new upgrade
and backup restoration, and a live HE capture/recall round trip. Exercise concurrent
search on supported Linux/macOS builds and representative embedding dimensions.
The live tests require explicit disposable-service opt-in; a skipped test is not
live-service evidence. Security advisories and customer notices require a separate
publication decision; these notes contain no exploit recipe.
