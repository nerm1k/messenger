from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from database.session import get_db
from models.user import User
from models.dialog import Dialog, Message
from schemas.dialog import DialogCreate, DialogResponse, MessageCreate, MessageResponse
from core.security import get_current_user

router = APIRouter()

@router.post("", response_model=dict)
def create_dialog(
    dialog_data: DialogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if dialog_data.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot create dialog with yourself")
    
    other_user = db.query(User).filter(User.id == dialog_data.user_id).first()
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_dialog = db.query(Dialog).filter(
        or_(
            and_(Dialog.user1_id == current_user.id, Dialog.user2_id == dialog_data.user_id),
            and_(Dialog.user1_id == dialog_data.user_id, Dialog.user2_id == current_user.id)
        )
    ).first()
    
    if existing_dialog:
        return {"dialog_id": existing_dialog.id, "existing": True}
    
    user1_id, user2_id = sorted([current_user.id, dialog_data.user_id])
    
    dialog = Dialog(user1_id=user1_id, user2_id=user2_id)
    db.add(dialog)
    db.commit()
    db.refresh(dialog)
    
    return {"dialog_id": dialog.id, "existing": False}

@router.get("", response_model=list[DialogResponse])
def get_my_dialogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dialogs = db.query(Dialog).filter(
        or_(Dialog.user1_id == current_user.id, Dialog.user2_id == current_user.id)
    ).all()
    
    result = []
    for dialog in dialogs:
        other_user = dialog.user1 if dialog.user2_id == current_user.id else dialog.user2
        
        last_message = db.query(Message).filter(
            Message.dialog_id == dialog.id
        ).order_by(Message.created_at.desc()).first()
        
        unread_count = db.query(Message).filter(
            Message.dialog_id == dialog.id,
            Message.sender_id != current_user.id,
            Message.is_read == False
        ).count()
        
        result.append(DialogResponse(
            id=dialog.id,
            user1_id=dialog.user1_id,
            user2_id=dialog.user2_id,
            created_at=dialog.created_at,
            updated_at=dialog.updated_at,
            other_user=other_user,
            last_message=last_message,
            unread_count=unread_count
        ))
    
    return result

@router.get("/{dialog_id}/messages", response_model=list[MessageResponse])
def get_dialog_messages(
    dialog_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dialog = db.query(Dialog).filter(
        Dialog.id == dialog_id,
        (Dialog.user1_id == current_user.id) | (Dialog.user2_id == current_user.id)
    ).first()
    
    if not dialog:
        raise HTTPException(status_code=404, detail="Dialog not found")
    
    messages = db.query(Message).filter(
        Message.dialog_id == dialog_id
    ).order_by(Message.created_at.asc()).all()
    
    return messages