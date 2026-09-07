from app.auth.security import create_access_token, decode_access_token, hash_password, verify_password


def test_password_hash_round_trip() -> None:
    password = "correct-horse-battery-staple"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_access_token_round_trip() -> None:
    subject = "9f6f6e8d-2e3c-4c6e-a8d6-1e1c2e9b3c10"
    token = create_access_token(subject)

    assert decode_access_token(token) == subject
    assert decode_access_token("not-a-valid-token") is None
