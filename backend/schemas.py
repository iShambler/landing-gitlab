"""
Esquemas Pydantic para validación de datos
"""
from pydantic import BaseModel, Field, validator
from datetime import date, datetime
from typing import Optional, Dict


# ============================================================================
# AUTH SCHEMAS
# ============================================================================

class UserRegister(BaseModel):
    """Esquema para registro de usuario"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    """Esquema para login de usuario"""
    username: str
    password: str


class Token(BaseModel):
    """Esquema para respuesta de token"""
    token: str
    user: dict


class UserResponse(BaseModel):
    """Esquema para respuesta de usuario"""
    id: int
    username: str


# ============================================================================
# PROJECT SCHEMAS
# ============================================================================

class ProjectCreate(BaseModel):
    """Esquema para crear proyecto"""
    nombre: str = Field(..., min_length=1, max_length=100)
    color: Optional[str] = "#3B82F6"
    
    @validator('color')
    def validate_color(cls, v):
        """Valida que el color sea un hexadecimal válido"""
        if not v.startswith('#') or len(v) != 7:
            raise ValueError('Color debe ser hexadecimal (#RRGGBB)')
        return v


class ProjectResponse(BaseModel):
    """Esquema para respuesta de proyecto"""
    id: int
    nombre: str
    color: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# IMPUTACION SCHEMAS
# ============================================================================

class ImputacionCreate(BaseModel):
    """Esquema para crear/actualizar imputación"""
    project_id: int
    fecha: date
    horas: float = Field(..., ge=0, le=24)
    
    @validator('fecha')
    def validate_no_weekend(cls, v):
        """Valida que no sea fin de semana"""
        if v.weekday() in [5, 6]:
            raise ValueError('No se puede imputar en sábado o domingo')
        return v


class ImputacionUpdate(BaseModel):
    """Esquema para actualizar horas"""
    horas: float = Field(..., ge=0, le=24)


class ImputacionResponse(BaseModel):
    """Esquema para respuesta de imputación"""
    id: int
    project_id: int
    fecha: date
    horas: float
    
    class Config:
        from_attributes = True


class SemanaResponse(BaseModel):
    """Esquema para respuesta de semana completa"""
    semana: str
    proyectos: list


# ============================================================================
# WEBSOCKET SCHEMAS
# ============================================================================

class WebSocketMessage(BaseModel):
    """Esquema para mensajes WebSocket del cliente"""
    action: str
    project_id: Optional[int] = None
    fecha: Optional[date] = None
    horas: Optional[float] = None


class WebSocketBroadcast(BaseModel):
    """Esquema para broadcast del servidor"""
    type: str
    project_id: Optional[int] = None
    fecha: Optional[date] = None
    horas: Optional[float] = None
    message: Optional[str] = None
