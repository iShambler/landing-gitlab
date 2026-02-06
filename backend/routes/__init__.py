"""
Paquete de rutas - Exporta todos los routers
"""
from . import auth_routes
from . import project_routes
from . import imputacion_routes
from . import websocket_routes

__all__ = [
    'auth_routes',
    'project_routes', 
    'imputacion_routes',
    'websocket_routes'
]
