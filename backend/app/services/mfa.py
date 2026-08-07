"""Enterprise Multi-Factor Authentication (MFA / TOTP) Service.

Provides secure TOTP secret generation, QR Code image encoding,
6-digit code verification, and emergency single-use recovery code management.
"""

import io
import base64
import secrets
import hashlib
import pyotp
import qrcode
from typing import Tuple, List, Optional


class MFAService:
    """Service handling TOTP and Recovery Code operations."""

    @staticmethod
    def generate_totp_secret() -> str:
        """Generate a cryptographically secure Base32 TOTP secret."""
        return pyotp.random_base32()

    @staticmethod
    def get_totp_uri(secret: str, email: str, issuer: str = "Data Insight") -> str:
        """Generate standard otpauth URI for authenticator applications."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name=issuer)

    @staticmethod
    def generate_qr_code_base64(totp_uri: str) -> str:
        """Render a QR Code image as a base64 Data URL."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=4,
        )
        qr.add_data(totp_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="#064e3b", back_color="white")
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return f"data:image/png;base64,{img_str}"

    @staticmethod
    def verify_totp_code(secret: str, code: str) -> bool:
        """Validate a 6-digit TOTP code against the secret with a 30s drift window."""
        if not secret or not code:
            return False
        # Clean user input (strip whitespace/hyphens)
        clean_code = code.replace(" ", "").replace("-", "").strip()
        if not clean_code.isdigit() or len(clean_code) != 6:
            return False
        totp = pyotp.TOTP(secret)
        return totp.verify(clean_code, valid_window=1)

    @staticmethod
    def generate_recovery_codes(count: int = 10) -> List[str]:
        """Generate human-readable 12-character emergency backup recovery codes."""
        codes = []
        for _ in range(count):
            part1 = secrets.token_hex(2).upper()
            part2 = secrets.token_hex(2).upper()
            part3 = secrets.token_hex(2).upper()
            codes.append(f"{part1}-{part2}-{part3}")
        return codes

    @staticmethod
    def hash_code(code: str) -> str:
        """Securely hash a backup code using SHA-256."""
        clean = code.replace("-", "").replace(" ", "").strip().upper()
        return hashlib.sha256(clean.encode("utf-8")).hexdigest()

    @classmethod
    def verify_and_consume_recovery_code(
        cls, hashed_codes: Optional[List[str]], plain_code: str
    ) -> Tuple[bool, List[str]]:
        """
        Verify if a provided plain recovery code matches one in the hashed list.
        If valid, removes the consumed code and returns (True, updated_hashed_codes).
        """
        if not hashed_codes or not plain_code:
            return False, hashed_codes or []

        target_hash = cls.hash_code(plain_code)
        if target_hash in hashed_codes:
            # Consume the code (single-use)
            updated_codes = [h for h in hashed_codes if h != target_hash]
            return True, updated_codes

        return False, hashed_codes
