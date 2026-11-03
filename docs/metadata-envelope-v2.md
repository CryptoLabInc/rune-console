# Metadata envelope v2 wire specification

Status: source under review; this document does not identify a published release.
Console and MCP must use this same contract. Earlier unreleased v2 producers that
used `c` instead of `g` are incompatible with this revision.

## Envelope and key derivation

An envelope is one JSON object with exactly four unique, lowercase fields:

```json
{"v":2,"a":"<agent ID>","r":"<outer record ID>","g":"<base64 bytes>"}
```

Field order and surrounding JSON whitespace are insignificant. Unknown, duplicate,
null, missing, or incorrectly typed fields are rejected. `v` is the JSON integer
2. `a`, `r`, and `g` are nonempty strings. IDs are compared exactly; the protocol
does not enforce UUID syntax (the current MCP producer generates UUID record IDs).
Trailing JSON values are rejected.

Starting with the agent's exactly 32-byte base DEK:

```text
key = HKDF-SHA256(
  IKM  = base_DEK,
  salt = absent,
  info = UTF8("rune/metadata/aes256gcm/v2"),
  L    = 32
)
```

Use AES-256-GCM with a fresh cryptographically random 12-byte nonce and a 16-byte
authentication tag. The decoded `g` bytes are `nonce || ciphertext || tag` (minimum
28 bytes). Encode with standard padded Base64, not URL-safe Base64. Decoding must
reject noncanonical pad bits, missing padding when required, and embedded CR/LF;
re-encoding the decoded bytes must equal the original `g` string.

The AAD is exactly the bytes produced by Go's default `encoding/json.Marshal` of:

```text
["rune-metadata", "2", agentID, recordID]
```

There is no whitespace between elements. Use UTF-8 and the default JSON string
escaping, including Go's HTML escaping of `<`, `>`, and `&`, and its escaping of
U+2028/U+2029. Another language must reproduce those bytes; a generic serializer
with different escaping is insufficient. No Unicode normalization is applied.
The version in this AAD is the string `"2"`, while envelope `v` is the integer 2.

On Insert, the expected agent ID comes from authenticated caller context and the
expected record ID from the outer request. On Search, the envelope's agent ID
selects the derived key and the envelope record ID must match the outer hit ID.
Authentication failure never yields plaintext and never falls back to CTR.

## Application Record validation

The crypto primitive can encrypt arbitrary bytes. The Console application accepts
only a JSON Record object and validates it on both Insert and Search:

| Field | Validation |
| --- | --- |
| `timestamp` | Nonzero timestamp accepted by Go `time.Time` JSON decoding (RFC3339 with supported fractional seconds); at most five minutes in the future at validation time. No maximum age. |
| `insight` | String, nonempty after whitespace trimming; at most 65,536 decoded UTF-8 bytes. |
| `context` | Optional string, at most 65,536 decoded UTF-8 bytes; JSON null is treated as empty. |
| `author` | Optional string, at most 4,096 decoded UTF-8 bytes; JSON null is treated as empty. Client-supplied display text, not a verified author. |

Raw decrypted bytes must be valid UTF-8 and valid single-value JSON. Unknown
Record fields are rejected. The current validator uses Go's struct JSON decoder:
it is not a canonical-JSON validator (case-insensitive known field matching and
last-value handling of repeated known fields follow that decoder). Producers
should emit the lowercase field names once each. Size limits are bytes, not
characters. Both the serialized envelope and raw Record have a 2 MiB upper bound;
field limits are separately enforced after decoding.

## Application failure policy

Insert requires v2, checks its IDs, authenticates it, validates the Record, then
reserves the record ID in durable local SQLite before forwarding the external
write. Unknown external write outcomes do not remove that reservation.

Search first consults that registry. A registered ID must use v2, including when
its returned metadata is empty. Unknown IDs with empty metadata are excluded.
Any case-insensitive `v`, `r`, or `g` envelope marker selects strict v2 validation;
a malformed v2 envelope must not be treated as legacy.

Strict mode excludes legacy hits. Compatibility mode considers only exact legacy
`{a,c}` envelopes and valid decoded Records; legacy decoding/decryption/content
failures are uniformly excluded. Plaintext Records are never returned as a
fallback. Invalid envelope syntax, duplicates, oversize, registry failure,
registered-ID downgrade, or v2 format/authentication/Record failure aborts the
whole Search with generic `DataLoss`, without partial results. Server-side
reason codes are for diagnosis; clients must not retry via a weaker format.

## Interoperability fixture

The same public, fixed-key test vector is checked into both repositories:

- Console: `internal/crypto/testdata/metadata_v2.json`
- MCP: `internal/adapters/seal/testdata/metadata_v2.json`
- Independent Python generator in Console:
  `internal/crypto/testdata/generate_metadata_v2.py`

The fixture tests cryptographic encoding and contains arbitrary JSON, not a
valid application Record. Application-path tests separately exercise the Record
contract. Never reuse fixture keys/nonces in production.

## Explicit non-goals

v2 does not bind vectors, scope tags, cluster IDs, or search scores, and does not
prove filtering, completeness, freshness, or correct HE computation. It is not
a Console signature: anyone with an agent DEK can create a valid envelope for
that agent. The registry pins IDs to a format, not a content digest or a history;
it cannot prevent replay or survive loss/rollback of its own state. Unknown
historical IDs remain a compatibility-mode downgrade risk. See the
[security and upgrade guide](security-upgrade.md) for the complete trust boundary,
legacy policy, and operational requirements.
