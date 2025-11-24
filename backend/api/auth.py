# api/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from database.session import get_db
from schemas.user import UserCreate, UserResponse, Token, UserLogin
from crud.user import create_user, get_user_by_email_or_username, authenticate_user
from core.security import create_access_token, create_refresh_token, verify_token, SECRET_KEY, ALGORITHM, verify_password, oauth2_scheme, get_current_user
from jose import JWTError, jwt
from models.user import User

router = APIRouter()

@router.post("/register", response_model=Token)
def register(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    response: Response = None
):

    existing_user = get_user_by_email_or_username(
        db, 
        email=user_data.email, 
        username=user_data.username
    )
    
    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )

    user = create_user(db=db, user=user_data)
    
    access_token = create_access_token(data={"user_id": user.id})
    refresh_token = create_refresh_token(data={"user_id": user.id})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=30 * 24 * 60 * 60
    )

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user
    )

@router.post("/login", response_model=Token)
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
    response: Response = None
):
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"user_id": user.id})
    refresh_token = create_refresh_token(data={"user_id": user.id})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=30 * 24 * 60 * 60
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            avatar_url=user.avatar_url,
            is_online=user.is_online,
            created_at=user.created_at
        )
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/refresh")
def refresh_token(
    request: Request,
    db: Session = Depends(get_db),
    response: Response = None
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        new_access_token = create_access_token(data={"user_id": user.id})
        new_refresh_token = create_refresh_token(data={"user_id": user.id})
        
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=30 * 24 * 60 * 60
        )
        
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
        
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")