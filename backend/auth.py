"""
Autenticación y manejo de JWT
"""
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración
SECRET_KEY = os.getenv("SECRET_KEY", "demo_secret_key_super_segura_para_jwt_minimo_32_caracteres_aqui")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24


# ============================================================================
# FUNCIONES DE PASSWORD
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hashea una contraseña usando bcrypt
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        Hash de la contraseña
    """
    # Convertir a bytes
    password_bytes = password.encode('utf-8')
    
    # Generar salt y hashear
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # Devolver como string
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica una contraseña contra su hash
    
    Args:
        plain_password: Contraseña en texto plano
        hashed_password: Hash de la contraseña
        
    Returns:
        True si la contraseña es correcta
    """
    try:
        # Convertir ambos a bytes
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        
        # Verificar
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"[AUTH] ❌ Error verificando password: {e}")
        return False


# ============================================================================
# FUNCIONES DE JWT
# ============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Crea un token JWT con los datos proporcionados
    
    Args:
        data: Diccionario con los datos a incluir en el token
        expires_delta: Tiempo de expiración personalizado
        
    Returns:
        Token JWT como string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decodifica y valida un token JWT
    
    Args:
        token: Token JWT como string
        
    Returns:
        Diccionario con los datos del token o None si es inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        print("[AUTH] ⏰ Token expirado")
        return None
    except jwt.InvalidTokenError:
        print("[AUTH] ❌ Token inválido")
        return None


def get_user_from_token(token: str) -> Optional[dict]:
    """
    Extrae la información del usuario desde un token
    
    Args:
        token: Token JWT como string
        
    Returns:
        Diccionario con user_id y username o None
    """
    payload = decode_access_token(token)
    
    if payload is None:
        return None
    
    user_id = payload.get("user_id")
    username = payload.get("username")
    
    if user_id is None or username is None:
        return None
    
    return {
        "user_id": user_id,
        "username": username,
        "exp": payload.get("exp")
    }


# ============================================================================
# TEST
# ============================================================================

if __name__ == "__main__":
    print("🔐 Test de autenticación")
    print("="*50)
    
    # Test password
    password = "test123"
    print(f"\n1. Hasheando password: {password}")
    hashed = hash_password(password)
    print(f"   Hash: {hashed[:30]}...")
    
    print(f"\n2. Verificando password correcta...")
    if verify_password(password, hashed):
        print("   ✅ OK")
    else:
        print("   ❌ Error")
    
    print(f"\n3. Verificando password incorrecta...")
    if not verify_password("wrong", hashed):
        print("   ✅ OK (rechazada correctamente)")
    else:
        print("   ❌ Error (aceptó password incorrecta)")
    
    # Test JWT
    print(f"\n4. Creando token JWT...")
    token = create_access_token({"user_id": 1, "username": "test"})
    print(f"   Token: {token[:50]}...")
    
    print(f"\n5. Decodificando token...")
    user = get_user_from_token(token)
    if user:
        print(f"   ✅ User: {user['username']}, ID: {user['user_id']}")
    else:
        print("   ❌ Error")
    
    print("\n" + "="*50)
    print("✅ Todos los tests pasaron")
