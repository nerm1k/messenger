from fastapi import WebSocket, WebSocketDisconnect, Query, APIRouter
from sqlalchemy.orm import Session
from database.session import SessionLocal
from core.websocket_manager import manager
from core.security import get_current_user_ws
from models.user import User
import json
from models.dialog import Dialog, Message
from sqlalchemy import func

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
):
    await websocket.accept()
    print(f"🔗 New WebSocket connection attempt with token: {token[:20]}...")
    
    try:
        user = await get_current_user_ws(token)
        if not user:
            print("❌ Authentication failed")
            await websocket.close(code=1008)
            return
        
        print(f"✅ User authenticated: {user.username}")
        await manager.connect(user.id, websocket)
        
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "message": "WebSocket connected successfully"
        }))
        
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        await websocket.close(code=1011)
        return

    db = SessionLocal()
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            print(f"📨 Received: {message_data}")
            
            await handle_websocket_message(message_data, user, db)
            
    except WebSocketDisconnect:
        print(f"🔌 User {user.username} disconnected")
        manager.disconnect(user.id, websocket)
    except Exception as e:
        print(f"❌ WebSocket error: {e}")
        manager.disconnect(user.id, websocket)
    finally:
        db.close()

async def handle_websocket_message(message_data: dict, user: User, db: Session):
    message_type = message_data.get("type")
    
    if message_type == "send_message":
        await handle_send_message(message_data, user, db)
    elif message_type == "typing":
        await handle_typing(message_data, user, db)
    elif message_type == "read_messages":
        await handle_read_messages(message_data, user, db)

async def handle_send_message(message_data: dict, user: User, db: Session):
    dialog_id = message_data.get("dialog_id")
    content = message_data.get("content")
    
    dialog = db.query(Dialog).filter(
        Dialog.id == dialog_id,
        (Dialog.user1_id == user.id) | (Dialog.user2_id == user.id)
    ).first()
    
    if not dialog:
        print(f"❌ Dialog {dialog_id} not found or user not participant")
        return
    
    message = Message(
        dialog_id=dialog_id,
        sender_id=user.id,
        content=content,
        is_read=False
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    dialog.updated_at = func.now()
    db.commit()
    
    message_with_sender = db.query(Message).filter(Message.id == message.id).first()
    
    recipient_id = get_other_user_id(dialog_id, user.id, db)
    
    if not recipient_id:
        print(f"❌ Cannot find recipient for dialog {dialog_id}")
        return
    
    message_data = {
        "type": "new_message",
        "message": {
            "id": message.id,
            "dialog_id": message.dialog_id,
            "sender_id": message.sender_id,
            "content": message.content,
            "is_read": message.is_read,
            "created_at": message.created_at.isoformat(),
            "sender": {
                "id": user.id,
                "username": user.username,
                "avatar_url": user.avatar_url
            }
        }
    }
    
    await manager.send_personal_message(message_data, user.id)
    print(f"📤 Sent message to sender {user.id}")
    
    await manager.send_personal_message(message_data, recipient_id)
    print(f"📤 Sent message to recipient {recipient_id}")

async def handle_typing(message_data: dict, user: User, db: Session):
    dialog_id = message_data.get("dialog_id")
    is_typing = message_data.get("is_typing", True)
    
    recipient_id = get_other_user_id(dialog_id, user.id, db)
    
    if not recipient_id:
        print(f"❌ Cannot find recipient for typing indicator in dialog {dialog_id}")
        return
    
    typing_data = {
        "type": "user_typing",
        "dialog_id": dialog_id,
        "user_id": user.id,
        "is_typing": is_typing,
        "username": user.username
    }
    
    await manager.send_personal_message(typing_data, recipient_id)
    print(f"⌨️ Sent typing indicator to {recipient_id}: {is_typing}")

async def handle_read_messages(message_data: dict, user: User, db: Session):
    dialog_id = message_data.get("dialog_id")
    
    updated_count = db.query(Message).filter(
        Message.dialog_id == dialog_id,
        Message.sender_id != user.id,
        Message.is_read == False
    ).update({"is_read": True})
    db.commit()
    
    print(f"📖 Marked {updated_count} messages as read in dialog {dialog_id}")
    
    recipient_id = get_other_user_id(dialog_id, user.id, db)
    
    if recipient_id:
        await manager.send_personal_message({
            "type": "messages_read",
            "dialog_id": dialog_id,
            "reader_id": user.id
        }, recipient_id)
        print(f"✅ Notified user {recipient_id} about read messages")

def get_other_user_id(dialog_id: int, current_user_id: int, db: Session) -> int:
    dialog = db.query(Dialog).filter(Dialog.id == dialog_id).first()
    if not dialog:
        print(f"❌ Dialog {dialog_id} not found")
        return None
    
    if dialog.user1_id == current_user_id:
        return dialog.user2_id
    elif dialog.user2_id == current_user_id:
        return dialog.user1_id
    else:
        print(f"❌ User {current_user_id} is not a participant of dialog {dialog_id}")
        return None