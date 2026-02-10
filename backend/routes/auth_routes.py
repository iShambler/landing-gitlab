"""
Rutas de autenticación: login y registro
"""
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db, User
from auth import hash_password, verify_password, create_access_token, get_user_from_token
from schemas import UserRegister, UserLogin, Token, UserResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ============================================================================
# DEPENDENCIA PARA OBTENER USUARIO ACTUAL
# ============================================================================

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> dict:
    """
    Obtiene el usuario actual desde el token JWT
    
    Args:
        authorization: Header Authorization con formato "Bearer <token>"
        db: Sesión de base de datos
        
    Returns:
        Diccionario con información del usuario
        
    Raises:
        HTTPException: Si el token es inválido o no existe
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    
    token = authorization.replace("Bearer ", "")
    user_data = get_user_from_token(token)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    # Verificar que el usuario existe
    user = db.query(User).filter(User.id == user_data["user_id"]).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    return user_data


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.post("/register", response_model=Token)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registra un nuevo usuario
    
    Args:
        user_data: Datos del usuario (username, password)
        db: Sesión de base de datos
        
    Returns:
        Token JWT y datos del usuario
        
    Raises:
        HTTPException 400: Si el usuario ya existe
    """
    # Verificar si el usuario ya existe
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Crear nuevo usuario
    hashed_password = hash_password(user_data.password)
    new_user = User(
        email=user_data.email,
        password=hashed_password
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Crear token
    token = create_access_token({
        "user_id": new_user.id,
        "email": new_user.email
    })
    
    print(f"[AUTH] ✅ Usuario registrado: {new_user.email}")
    
    return {
        "token": token,
        "user": {
            "id": new_user.id,
            "email": new_user.email
        }
    }


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Inicia sesión de un usuario
    
    Args:
        user_data: Credenciales (username, password)
        db: Sesión de base de datos
        
    Returns:
        Token JWT y datos del usuario
        
    Raises:
        HTTPException 401: Si las credenciales son incorrectas
    """
    # Buscar usuario
    user = db.query(User).filter(User.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    
    # Crear token
    token = create_access_token({
        "user_id": user.id,
        "email": user.email
    })
    
    print(f"[AUTH] 🔓 Login exitoso: {user.email}")
    
    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email
        }
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Obtiene información del usuario actual
    
    Args:
        current_user: Usuario actual (inyectado por dependencia)
        db: Sesión de base de datos
        
    Returns:
        Información del usuario
    """
    return {
        "id": current_user["user_id"],
        "email": current_user["email"]
    }
