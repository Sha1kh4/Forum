from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from starlette import status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt  
from models import Users
from db import SessionLocal

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
) 

SECRET_KEY = "12345678aabcdefghijklmnopqrstuvwxyz"
ALGORITHM = "HS256" 

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

class CreateUserRequest(BaseModel):
    username: str
    password: str
    email: str

class Token(BaseModel):
    access_token: str
    token_type: str

def get_db():  
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
db_dependency = Annotated[Session, Depends(get_db)]


def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(
        bytes(plain_password, encoding="utf-8"),
        bytes(hashed_password),
    )


def get_password_hash(password):
    return bcrypt.hashpw(
        bytes(password, encoding="utf-8"),
        bcrypt.gensalt(),
    )

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: CreateUserRequest, db: db_dependency):
    hashed_password = get_password_hash(user.password)  # Updated to use bcrypt
    db_user = Users(username=user.username, password=hashed_password, email=user.email)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"msg": "User created successfully"}

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: db_dependency):
    user = get_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
         user.username,user.userid, timedelta(minutes=190000)
    )
    return {"access_token": access_token, "token_type": "bearer"}


def get_user(db, username: str,password: str):
    user = db.query(Users).filter(Users.username == username).first()
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

def create_access_token(username: str,user_id:int, expires_delta: timedelta | None = None): 
    to_encode = {"sub": username,"user_id":user_id}
    expire = datetime.now() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: db_dependency):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("user_id")

        if username is None or user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(Users).filter(Users.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.get("/users/me")
async def read_users_me():
    current_user = await get_current_user(token=Depends(oauth2_scheme), db=Depends(get_db))

    return current_user