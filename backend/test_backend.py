"""
Script de prueba para verificar que todo funciona
"""
import sys

print("="*70)
print("🔍 DIAGNÓSTICO DEL BACKEND")
print("="*70)

# Test 1: Imports
print("\n1️⃣ Verificando imports...")
try:
    from database import init_db, get_db, User
    print("✅ database.py OK")
except Exception as e:
    print(f"❌ Error en database.py: {e}")
    sys.exit(1)

try:
    from auth import hash_password, verify_password
    print("✅ auth.py OK")
except Exception as e:
    print(f"❌ Error en auth.py: {e}")
    sys.exit(1)

try:
    from utils import get_interactions_remaining
    print("✅ utils.py OK")
except Exception as e:
    print(f"❌ Error en utils.py: {e}")
    sys.exit(1)

try:
    from schemas import UserRegister, UserLogin
    print("✅ schemas.py OK")
except Exception as e:
    print(f"❌ Error en schemas.py: {e}")
    sys.exit(1)

# Test 2: Base de datos
print("\n2️⃣ Inicializando base de datos...")
try:
    init_db()
    print("✅ Base de datos inicializada")
except Exception as e:
    print(f"❌ Error inicializando BD: {e}")
    sys.exit(1)

# Test 3: Crear usuario de prueba
print("\n3️⃣ Probando creación de usuario...")
try:
    from sqlalchemy.orm import Session
    db = next(get_db())
    
    # Verificar si ya existe
    existing = db.query(User).filter(User.username == "test").first()
    if existing:
        print("⚠️ Usuario 'test' ya existe, eliminándolo...")
        db.delete(existing)
        db.commit()
    
    # Crear usuario
    hashed = hash_password("test123")
    new_user = User(username="test", password=hashed)
    db.add(new_user)
    db.commit()
    print("✅ Usuario de prueba creado")
    
    # Verificar password
    if verify_password("test123", hashed):
        print("✅ Verificación de password OK")
    else:
        print("❌ Error verificando password")
    
    db.close()
except Exception as e:
    print(f"❌ Error creando usuario: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: FastAPI
print("\n4️⃣ Verificando FastAPI...")
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    print("✅ FastAPI OK")
except Exception as e:
    print(f"❌ Error con FastAPI: {e}")
    sys.exit(1)

print("\n" + "="*70)
print("✅ TODOS LOS TESTS PASARON")
print("="*70)
print("\nAhora puedes ejecutar: python main.py")
