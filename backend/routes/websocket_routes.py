"""
Rutas WebSocket para actualizaciones en tiempo real
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Dict, List
import json

from database import SessionLocal, Imputacion, Project
from auth import get_user_from_token
from utils import is_weekend, validate_hours

router = APIRouter()

# Gestión de conexiones activas por usuario
# Estructura: {user_id: [websocket1, websocket2, ...]}
active_connections: Dict[int, List[WebSocket]] = {}


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

async def broadcast_to_user(user_id: int, message: dict):
    """
    Envía un mensaje a todas las conexiones de un usuario
    
    Args:
        user_id: ID del usuario
        message: Diccionario con el mensaje a enviar
    """
    if user_id not in active_connections:
        return
    
    # Lista de conexiones a eliminar si fallan
    to_remove = []
    
    for websocket in active_connections[user_id]:
        try:
            await websocket.send_json(message)
        except:
            to_remove.append(websocket)
    
    # Eliminar conexiones fallidas
    for ws in to_remove:
        active_connections[user_id].remove(ws)
    
    # Si no quedan conexiones, eliminar el usuario del dict
    if not active_connections[user_id]:
        del active_connections[user_id]


def add_connection(user_id: int, websocket: WebSocket):
    """Añade una conexión WebSocket para un usuario"""
    if user_id not in active_connections:
        active_connections[user_id] = []
    active_connections[user_id].append(websocket)
    print(f"[WS] ✅ Conexión añadida para usuario {user_id} (total: {len(active_connections[user_id])})")


def remove_connection(user_id: int, websocket: WebSocket):
    """Elimina una conexión WebSocket de un usuario"""
    if user_id in active_connections and websocket in active_connections[user_id]:
        active_connections[user_id].remove(websocket)
        print(f"[WS] 🔌 Conexión eliminada para usuario {user_id} (restantes: {len(active_connections[user_id])})")
        
        # Si no quedan conexiones, eliminar el usuario
        if not active_connections[user_id]:
            del active_connections[user_id]


# ============================================================================
# ENDPOINT WEBSOCKET
# ============================================================================

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str):
    """
    Endpoint WebSocket para actualizaciones en tiempo real
    
    Args:
        websocket: Conexión WebSocket
        token: Token JWT del usuario
    """
    # Validar token
    user_data = get_user_from_token(token)
    
    if not user_data:
        await websocket.close(code=4001, reason="Token inválido")
        return
    
    user_id = user_data["user_id"]
    
    # Aceptar conexión
    await websocket.accept()
    add_connection(user_id, websocket)
    
    # Obtener sesión de BD
    db = SessionLocal()
    
    try:
        while True:
            # Recibir mensaje del cliente
            data = await websocket.receive_json()
            
            action = data.get("action")
            
            if action == "imputar":
                # Procesar imputación
                try:
                    project_id = data.get("project_id")
                    fecha_str = data.get("fecha")
                    horas = data.get("horas")
                    
                    # Validaciones
                    if not all([project_id, fecha_str, horas is not None]):
                        await websocket.send_json({
                            "type": "error",
                            "message": "Datos incompletos"
                        })
                        continue
                    
                    # Convertir fecha
                    from datetime import datetime
                    fecha = datetime.fromisoformat(fecha_str).date()
                    
                    # Validar fin de semana
                    if is_weekend(fecha):
                        await websocket.send_json({
                            "type": "error",
                            "message": "No se puede imputar en fin de semana"
                        })
                        continue
                    
                    # Validar horas
                    if not validate_hours(horas):
                        await websocket.send_json({
                            "type": "error",
                            "message": "Horas inválidas (0-24)"
                        })
                        continue
                    
                    # Verificar proyecto
                    project = db.query(Project).filter(
                        Project.id == project_id,
                        Project.user_id == user_id
                    ).first()
                    
                    if not project:
                        await websocket.send_json({
                            "type": "error",
                            "message": "Proyecto no encontrado"
                        })
                        continue
                    
                    # Buscar o crear imputación
                    imputacion = db.query(Imputacion).filter(
                        Imputacion.user_id == user_id,
                        Imputacion.project_id == project_id,
                        Imputacion.fecha == fecha
                    ).first()
                    
                    if imputacion:
                        imputacion.horas = horas
                    else:
                        imputacion = Imputacion(
                            user_id=user_id,
                            project_id=project_id,
                            fecha=fecha,
                            horas=horas
                        )
                        db.add(imputacion)
                    
                    db.commit()
                    
                    # Broadcast a todas las conexiones del usuario
                    await broadcast_to_user(user_id, {
                        "type": "imputacion_updated",
                        "project_id": project_id,
                        "fecha": fecha_str,
                        "horas": horas
                    })
                    
                    print(f"[WS] ✅ Imputación guardada: {horas}h en proyecto {project_id} el {fecha}")
                
                except Exception as e:
                    print(f"[WS] ❌ Error procesando imputación: {e}")
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Error: {str(e)}"
                    })
            
            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Acción desconocida: {action}"
                })
    
    except WebSocketDisconnect:
        print(f"[WS] 🔌 Cliente desconectado: usuario {user_id}")
    
    except Exception as e:
        print(f"[WS] ❌ Error en WebSocket: {e}")
    
    finally:
        remove_connection(user_id, websocket)
        db.close()
