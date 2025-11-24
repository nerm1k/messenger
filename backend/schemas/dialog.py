from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from schemas.user import UserResponse

class MessageBase(BaseModel):
    content: str

class MessageCreate(MessageBase):
    dialog_id: int

class MessageResponse(MessageBase):
    id: int
    sender_id: int
    dialog_id: int
    is_read: bool
    created_at: datetime
    sender: UserResponse
    
    class Config:
        from_attributes = True

class DialogResponse(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    updated_at: datetime
    other_user: UserResponse
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0
    
    class Config:
        from_attributes = True

class DialogCreate(BaseModel):
    user_id: int