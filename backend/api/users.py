from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.session import get_db
from models.user import User
from schemas.user import UserResponse
from core.security import get_current_user

router = APIRouter()

@router.get("/search", response_model=list[UserResponse])
def search_users(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if len(username) < 2:
        raise HTTPException(status_code=400, detail="Search query too short")
    
    users = db.query(User).filter(
        User.username.ilike(f"%{username}%"),
        User.id != current_user.id
    ).limit(10).all()
    
    return users