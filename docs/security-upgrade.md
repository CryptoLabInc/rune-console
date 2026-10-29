# Security boundary and coordinated upgrade

These notes describe the authenticated-metadata and capture-privacy changes in
this source branch, pending PR review and release. They do not establish that
existing release tags or installer downloads contain the changes. Compatible
release tags and RUNE runtime pins, clean-install verification, and live HE
service evidence are still pending.

## Protection and limits

Stored item vectors are encrypted for RuneSpace search. Recall query vectors are
plaintext to Console and RuneSpace; encrypted storage does not provide query
privacy. Capture embeds locally, encrypts the item vectors, and inserts without
a plaintext-vector novelty search. Separate capture calls can store duplicates.

The trusted Console holds HE secret keys and payload keys, authenticates inserted
payloads, and opens authorized content. Console operators and host root remain
trusted: this is not end-to-end privacy from Console or root. Payload
authentication does not assure correct search computation by a malicious server.

Metadata envelope v2 uses AES-256-GCM with a fresh 12-byte nonce and 16-byte tag.
Its 32-byte key is derived with HKDF-SHA256, using info
`rune/metadata/aes256gcm/v2`. Authentication binds both the agent identity and the
outer storage record identity to the payload.

Console advertises a manifest `capabilities` array containing
`metadata_envelope_v2`. The new MCP capture path checks this capability before
embedding or insertion and fails with an upgrade-required error if it is absent.
Refresh the agent manifest after upgrading Console.

## Compatibility

“Old” means before these source changes; “new” means with these changes. These
labels do not identify published versions.

| MCP / Console | Capture | Reading existing records |
| --- | --- | --- |
| Old / old | Legacy behavior; no v2 guarantee | Legacy behavior |
| New / old | Blocked before embedding/insertion: capability absent | No v2 reader guarantee |
| Old / new | Blocked: Console rejects legacy writes | Legacy requires explicit read compatibility |
| New / new | Authenticated v2 writes | v2 by default; legacy requires explicit read compatibility |

Console defaults to `allow_legacy_metadata_read: false`: legacy reads are
rejected. Temporarily setting `allow_legacy_metadata_read: true` permits
recognized legacy AES-CTR envelopes and plaintext JSON records for read-only
compatibility. These records are unauthenticated and malleable, and accepting
them weakens downgrade resistance. This setting never permits legacy writes.
There is no silent legacy fallback after a v2 authentication failure, unknown
version, or stripped v2 envelope retaining its record-ID field. A corrupt metadata
hit fails the whole search; no partial results are returned.

## Upgrade procedure

1. Arrange a maintenance window and coordinate the Console and MCP client
   upgrades. Back up Console keys and configuration with an encrypted,
   access-controlled backup and verify restoration. Losing HE or payload keys can
   make existing records unreadable.
2. Install the new Console reader and insert validator first. Old MCP captures
   will be interrupted because Console rejects legacy writes, even with legacy
   read compatibility enabled.
3. If legacy records must remain readable, explicitly enable
   `allow_legacy_metadata_read` temporarily. Validate representative legacy reads
   and the chosen migration process against backups before changing production
   data. No automated migration tool is provided by these changes.
4. Upgrade MCP clients and refresh their manifests. Confirm that
   `metadata_envelope_v2` is advertised, then validate a new v2 write and read with
   representative permissions. Confirm that missing capability, old writes, and
   damaged payloads fail as described above.
5. After migrating and verifying legacy data, disable legacy read compatibility
   and confirm strict reads. Keep the backup and maintenance recovery plan until
   validation is complete.

Local fixture and unit coverage exercises envelope compatibility, integrity
failures, and capture gates. Such coverage is not proof of a clean installation
or a live RuneSpace HE round trip. Obtain that evidence for the exact released
binaries and runtime pins before presenting a reproducible public demo.
