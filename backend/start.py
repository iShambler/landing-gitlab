"""
Script de inicio simple para depuración
"""
import sys
import os

# Cambiar al directorio del script
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("📂 Directorio actual:", os.getcwd())
print("🐍 Python:", sys.version)
print()

# Verificar dependencias
print("🔍 Verificando dependencias...")
dependencias = {
    'fastapi': 'FastAPI',
    'uvicorn': 'Uvicorn',
    'sqlalchemy': 'SQLAlchemy',
    'jwt': 'PyJWT',
    'passlib': 'Passlib',
    'dotenv': 'python-dotenv'
}

faltan = []
for modulo, nombre in dependencias.items():
    try:
        __import__(modulo)
        print(f"  ✅ {nombre}")
    except ImportError:
        print(f"  ❌ {nombre} - FALTA")
        faltan.append(nombre)

if faltan:
    print(f"\n❌ Faltan dependencias: {', '.join(faltan)}")
    print("Ejecuta: pip install -r requirements.txt")
    sys.exit(1)

print("\n✅ Todas las dependencias OK")
print("\n🚀 Iniciando servidor...\n")

# Iniciar servidor
import main
