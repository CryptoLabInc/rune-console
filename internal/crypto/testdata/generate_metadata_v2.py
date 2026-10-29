"""Generate the NON-SECRET metadata v2 interoperability vector independently.

Run with Python 3 and cryptography installed. Fixed keys/nonces are for tests only.
"""
import base64
import json
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

base_key = bytes(range(32))
nonce = bytes(range(0xA0, 0xAC))
agent_id = "0123456789abcdef0123456789abcdef"
record_id = "123e4567-e89b-42d3-a456-426614174000"
info = b"rune/metadata/aes256gcm/v2"
derived_key = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=info).derive(base_key)
aad = json.dumps(["rune-metadata", "2", agent_id, record_id], separators=(",", ":")).encode()
plaintext = '{"title":"public fixture","description":"메타데이터 🔒","count":2}'.encode()
ciphertext_tag = AESGCM(derived_key).encrypt(nonce, plaintext, aad)
envelope = json.dumps({"v": 2, "a": agent_id, "r": record_id,
                       "c": base64.b64encode(nonce + ciphertext_tag).decode()}, separators=(",", ":"))
fixture = {"notice": "NON-SECRET fixed interoperability test vector; never use these keys/nonces in production",
           "base_key_hex": base_key.hex(), "derived_key_hex": derived_key.hex(),
           "nonce_hex": nonce.hex(), "aad_hex": aad.hex(), "plaintext": plaintext.decode(),
           "ciphertext_tag_hex": ciphertext_tag.hex(), "agent_id": agent_id,
           "record_id": record_id, "envelope_json": envelope}
Path(__file__).with_name("metadata_v2.json").write_text(json.dumps(fixture, indent=2, ensure_ascii=False) + "\n")
