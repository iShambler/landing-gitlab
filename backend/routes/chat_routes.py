"""
Rutas para gestión del historial del chat
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db, ChatMessage
from routes.auth_routes import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/chat", tags=["chat"])


# ============================================================================
# SCHEMAS
# ============================================================================

class ChatMessageCreate(BaseModel):
    role: str  # 'user' o 'bot'
    message: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/messages", response_model=List[ChatMessageResponse])
def get_chat_messages(
    limit: int = 50,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el historial de mensajes del usuario
    
    Args:
        limit: Número máximo de mensajes a devolver (default: 50)
    """
    messages = db.query(ChatMessage)\
        .filter(ChatMessage.user_id == current_user["user_id"])\
        .order_by(ChatMessage.created_at.asc())\
        .limit(limit)\
        .all()
    
    return messages


@router.post("/messages", response_model=ChatMessageResponse)
def save_chat_message(
    message_data: ChatMessageCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Guarda un mensaje del chat
    """
    if message_data.role not in ['user', 'bot']:
        raise HTTPException(status_code=400, detail="Role debe ser 'user' o 'bot'")
    
    new_message = ChatMessage(
        user_id=current_user["user_id"],
        role=message_data.role,
        message=message_data.message
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return new_message


@router.delete("/messages")
def clear_chat_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Borra todo el historial de chat del usuario
    """
    deleted = db.query(ChatMessage)\
        .filter(ChatMessage.user_id == current_user["user_id"])\
        .delete()
    
    db.commit()
    
    return {"message": f"Se eliminaron {deleted} mensajes", "deleted": deleted}
