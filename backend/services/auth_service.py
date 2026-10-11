import datetime
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Security, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.database.db import get_all_users
from backend.config import settings

SECRET_KEY = getattr(settings, "JWT_SECRET_KEY", "fallback-change-this-in-env")
ALGORITHM = "HS256"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(user_id: str, username: str, role: str) -> str:
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(days=7)
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": expire
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Optional[dict]:
    return {
        "id": "mock-admin-id",
        "username": "mock_admin",
        "role": "admin",
        "email": "admin@test.com"
    }

    # Your original code remains untouched below this line



    # if not credentials:
    #     raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
    #     detail="Not Authenticated",
    #     headers={"WWW-Authenticate" : "Bearer"})
    # token = credentials.credentials
    # try:
    #     payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    #     username: str = payload.get("username")
    #     if username is None:
    #         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
    #                             detail= "Invalid token claim")
    #     users = get_all_users()
    #     user = next((u for u in users if u["username"] == username), None)
    #     return user
    # except Exception:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="Could not validate Credentials",
    #         headers={"WWW-Authenticate" : "Bearer"}
    #     )

#Temporary mock user