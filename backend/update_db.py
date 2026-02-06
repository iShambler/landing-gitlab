"""
Script para actualizar la base de datos con la tabla de chat_messages
"""
import sys
from pathlib import Path

# Añadir el directorio del backend al path
sys.path.insert(0, str(Path(__file__).parent))

from database import Base, engine

def update_database():
    """Actualiza la base de datos añadiendo las nuevas tablas"""
    print("🔄 Actualizando base de datos...")
    
    try:
        # Crear todas las tablas (incluida chat_messages)
        Base.metadata.create_all(bind=engine)
        print("✅ Base de datos actualizada correctamente")
        print("📋 Tabla 'chat_messages' creada")
        
    except Exception as e:
        print(f"❌ Error actualizando la base de datos: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    update_database()
