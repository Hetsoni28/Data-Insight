import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.schemas.user import UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class LoginResponse(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    mfa_required: bool = False
    mfa_token: Optional[str] = None
    user: Optional[UserResponse] = None


class MFALoginRequest(BaseModel):
    mfa_token: str
    code: str = Field(..., description="6-digit TOTP code or emergency backup code")


class MFASetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    qr_code_base64: str
    recovery_codes: List[str]


class MFAVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class MFADisableRequest(BaseModel):
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class UserSessionResponse(BaseModel):
    id: uuid.UUID
    device_name: str
    browser: str
    os: str
    ip_address: str
    country: str
    city: str
    is_current: bool = False
    last_active_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoginHistoryResponse(BaseModel):
    id: uuid.UUID
    ip_address: str
    browser: str
    os: str
    device: str
    country: str
    city: str
    success: bool
    failure_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
