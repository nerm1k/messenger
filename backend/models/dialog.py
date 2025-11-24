from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Boolean, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.base import Base

class Dialog(Base):
    __tablename__ = "dialogs"

    id = Column(Integer, primary_key=True, index=True)
    user1_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user2_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('user1_id', 'user2_id', name='unique_dialog_pair'),
    )
    
    user1 = relationship("User", foreign_keys=[user1_id])
    user2 = relationship("User", foreign_keys=[user2_id])
    messages = relationship("Message", back_populates="dialog")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    dialog_id = Column(Integer, ForeignKey('dialogs.id'), nullable=False)
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    content = Column(String(1000), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    dialog = relationship("Dialog", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])