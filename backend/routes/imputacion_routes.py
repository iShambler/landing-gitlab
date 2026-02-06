"""
Rutas de imputaciones: CRUD y consulta por semana
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from typing import Dict

from database import get_db, Imputacion, Project
from routes.auth_routes import get_current_user
from schemas import ImputacionCreate, ImputacionUpdate, ImputacionResponse, SemanaResponse
from utils import get_monday_of_week, get_week_dates, is_weekend, validate_hours

router = APIRouter(prefix="/api/imputaciones", tags=["imputaciones"])


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/semana/{fecha_inicio}", response_model=SemanaResponse)
def get_semana(
    fecha_inicio: date,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene todas las imputaciones de una semana (L-V) para el usuario
    
    Args:
        fecha_inicio: Cualquier fecha de la semana (se calculará el lunes)
        current_user: Usuario actual
        db: Sesión de base de datos
        
    Returns:
        Datos de la semana con proyectos y horas
    """
    user_id = current_user["user_id"]
    
    # Calcular el lunes de la semana
    lunes = get_monday_of_week(fecha_inicio)
    
    # Obtener fechas de la semana (L-V)
    fechas = get_week_dates(lunes)
    
    # Obtener todos los proyectos del usuario
    projects = db.query(Project).filter(
        Project.user_id == user_id
    ).order_by(Project.created_at).all()
    
    # Construir respuesta - SOLO proyectos con horas en esta semana
    proyectos_data = []
    
    for project in projects:
        # Obtener imputaciones de esta semana para este proyecto
        imputaciones = db.query(Imputacion).filter(
            Imputacion.user_id == user_id,
            Imputacion.project_id == project.id,
            Imputacion.fecha.in_(fechas)
        ).all()
        
        # Solo incluir el proyecto si tiene al menos una imputación con horas > 0
        if not imputaciones:
            continue
            
        # Verificar si tiene horas reales (> 0)
        total_horas = sum(imp.horas for imp in imputaciones)
        if total_horas == 0:
            continue
        
        # Crear diccionario de horas por fecha
        imputaciones_dict = {imp.fecha: imp.horas for imp in imputaciones}
        
        horas_dict = {}
        # Llenar con 0 las fechas sin imputación
        for fecha in fechas:
            horas_dict[fecha.isoformat()] = imputaciones_dict.get(fecha, 0)
        
        proyectos_data.append({
            "id": project.id,
            "nombre": project.nombre,
            "color": project.color,
            "horas": horas_dict
        })
    
    print(f"[IMPUTACIONES] 📅 Semana del {lunes.isoformat()} para {current_user['username']}")
    
    return {
        "semana": lunes.isoformat(),
        "proyectos": proyectos_data
    }


@router.post("", response_model=ImputacionResponse)
def create_or_update_imputacion(
    imputacion_data: ImputacionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crea o actualiza una imputación de horas
    
    Args:
        imputacion_data: Datos de la imputación (project_id, fecha, horas)
        current_user: Usuario actual
        db: Sesión de base de datos
        
    Returns:
        Imputación creada o actualizada
        
    Raises:
        HTTPException 400: Si es fin de semana o las horas son inválidas
        HTTPException 404: Si el proyecto no existe
    """
    user_id = current_user["user_id"]
    
    # Validar que no sea fin de semana
    if is_weekend(imputacion_data.fecha):
        raise HTTPException(status_code=400, detail="No se puede imputar en sábado o domingo")
    
    # Validar horas
    if not validate_hours(imputacion_data.horas):
        raise HTTPException(status_code=400, detail="Las horas deben estar entre 0 y 24")
    
    # Verificar que el proyecto existe y pertenece al usuario
    project = db.query(Project).filter(
        Project.id == imputacion_data.project_id,
        Project.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Buscar imputación existente
    imputacion = db.query(Imputacion).filter(
        Imputacion.user_id == user_id,
        Imputacion.project_id == imputacion_data.project_id,
        Imputacion.fecha == imputacion_data.fecha
    ).first()
    
    if imputacion:
        # Actualizar existente
        imputacion.horas = imputacion_data.horas
        action = "actualizada"
    else:
        # Crear nueva
        imputacion = Imputacion(
            user_id=user_id,
            project_id=imputacion_data.project_id,
            fecha=imputacion_data.fecha,
            horas=imputacion_data.horas
        )
        db.add(imputacion)
        action = "creada"
    
    db.commit()
    db.refresh(imputacion)
    
    print(f"[IMPUTACIONES] ✅ Imputación {action}: {imputacion.horas}h en {project.nombre} el {imputacion.fecha}")
    
    return imputacion


@router.put("/{imputacion_id}", response_model=ImputacionResponse)
def update_imputacion(
    imputacion_id: int,
    imputacion_data: ImputacionUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualiza las horas de una imputación existente
    
    Args:
        imputacion_id: ID de la imputación
        imputacion_data: Nuevas horas
        current_user: Usuario actual
        db: Sesión de base de datos
        
    Returns:
        Imputación actualizada
        
    Raises:
        HTTPException 404: Si la imputación no existe
        HTTPException 403: Si no es su imputación
    """
    user_id = current_user["user_id"]
    
    # Buscar imputación
    imputacion = db.query(Imputacion).filter(
        Imputacion.id == imputacion_id,
        Imputacion.user_id == user_id
    ).first()
    
    if not imputacion:
        raise HTTPException(status_code=404, detail="Imputación no encontrada")
    
    # Validar horas
    if not validate_hours(imputacion_data.horas):
        raise HTTPException(status_code=400, detail="Las horas deben estar entre 0 y 24")
    
    # Actualizar
    imputacion.horas = imputacion_data.horas
    db.commit()
    db.refresh(imputacion)
    
    print(f"[IMPUTACIONES] 📝 Imputación actualizada: {imputacion.horas}h el {imputacion.fecha}")
    
    return imputacion
