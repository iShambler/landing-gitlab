"""
Servidor principal FastAPI
"""
import sys
from pathlib import Path

# Añadir el directorio actual al path
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Imports de módulos locales
try:
    from database import init_db
    from routes.auth_routes import router as auth_router
    from routes.project_routes import router as project_router
    from routes.imputacion_routes import router as imputacion_router
    from routes.websocket_routes import router as websocket_router
    from routes.chat_routes import router as chat_router
except ImportError as e:
    print(f"❌ Error importando módulos: {e}")
    print("Verifica que todas las dependencias estén instaladas")
    sys.exit(1)

# ============================================================================
# INICIALIZAR FASTAPI
# ============================================================================

app = FastAPI(
    title="Demo Gestión de Horas",
    description="API para gestión de imputación de horas con límite de interacciones",
    version="1.0.0"
)

# ============================================================================
# CONFIGURAR CORS
# ============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5500",
        "null"  # Para archivos locales
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ============================================================================
# INCLUIR ROUTERS
# ============================================================================

app.include_router(auth_router)
app.include_router(project_router)
app.include_router(imputacion_router)
app.include_router(websocket_router)
app.include_router(chat_router)

# ============================================================================
# EVENTOS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Inicializa la base de datos al arrancar"""
    try:
        init_db()
        print("\n" + "="*70)
        print("🚀 DEMO GESTIÓN DE HORAS - SERVIDOR INICIADO")
        print("="*70)
        print("📡 API: http://localhost:8003")
        print("📖 Docs: http://localhost:8003/docs")
        print("🔌 WebSocket: ws://localhost:8003/ws/{token}")
        print("🌐 CORS: ✅ Habilitado")
        print("="*70 + "\n")
    except Exception as e:
        print(f"❌ Error al iniciar: {e}")
        import traceback
        traceback.print_exc()

# ============================================================================
# ENDPOINTS BÁSICOS
# ============================================================================

@app.get("/")
async def root():
    """Endpoint raíz"""
    return {
        "message": "Demo Gestión de Horas API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/api/auth",
            "projects": "/api/projects",
            "imputaciones": "/api/imputaciones",
            "websocket": "/ws/{token}"
        },
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check"""
    return {
        "status": "ok",
        "cors": "enabled",
        "database": "sqlite"
    }

# ============================================================================
# EJECUTAR
# ============================================================================

if __name__ == "__main__":
    print("🚀 Iniciando servidor...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8003,
        reload=True,
        log_level="info"
    )
