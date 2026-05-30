"""Fernet symmetric encryption for credential storage."""

import os
from cryptography.fernet import Fernet

_KEY = os.getenv("FERNET_KEY", "")


def _get_fernet() -> Fernet:
    key = _KEY
    if not key:
        key = Fernet.generate_key().decode()
        os.environ["FERNET_KEY"] = key
    if isinstance(key, str):
        key = key.encode()
    return Fernet(key)


def encrypt(plaintext: str) -> str:
    if not plaintext:
        return ""
    return _get_fernet().encrypt(plaintext.encode()).decode()


def decrypt(ciphertext: str) -> str:
    if not ciphertext:
        return ""
    try:
        return _get_fernet().decrypt(ciphertext.encode()).decode()
    except Exception:
        return ""
