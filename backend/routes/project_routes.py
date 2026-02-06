"""
Rutas de proyectos: CRUD completo
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db, Project
from routes.auth_routes import get_current_user
from schemas import ProjectCreate, ProjectResponse
from utils import validate_project_limit

router = APIRouter(prefix="/api/projects", tags=["projects"])


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=List[ProjectResponse])
def get_projects(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Obtiene todos los proyectos del usuario actual
    
    Args:
        current_user: Usuario actual (inyectado)
        db: Sesión de base de datos
        
    Returns:
        Lista de proyectos
    """
    projects = db.query(Project).filter(
        Project.user_id == current_user["user_id"]
    ).order_by(Project.created_at).all()
    
    print(f"[PROJECTS] 📋 Listando {len(projects)} proyectos del usuario {current_user['username']}")
    
    return projects


@router.post("", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crea un nuevo proyecto
    
    Args:
        project_data: Datos del proyecto (nombre, color)
        current_user: Usuario actual
        db: Sesión de base de datos
        
    Returns:
        Proyecto creado
        
    Raises:
        HTTPException 400: Si ya tiene 3 proyectos o el nombre está duplicado
    """
    user_id = current_user["user_id"]
    
    # Verificar límite de proyectos
    if not validate_project_limit(db, user_id):
        raise HTTPException(status_code=400, detail="Máximo 3 proyectos permitidos")
    
    # Verificar nombre duplicado
    existing = db.query(Project).filter(
        Project.user_id == user_id,
        Project.nombre == project_data.nombre
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Ya tienes un proyecto con ese nombre")
    
    # Crear proyecto
    new_project = Project(
        user_id=user_id,
        nombre=project_data.nombre,
        color=project_data.color
    )
    
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    
    print(f"[PROJECTS] ✅ Proyecto creado: {new_project.nombre} por {current_user['username']}")
    
    return new_project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Elimina un proyecto y todas sus imputaciones
    
    Args:
        project_id: ID del proyecto a eliminar
        current_user: Usuario actual
        db: Sesión de base de datos
        
    Returns:
        Mensaje de confirmación
        
    Raises:
        HTTPException 404: Si el proyecto no existe
        HTTPException 403: Si el proyecto no pertenece al usuario
    """
    user_id = current_user["user_id"]
    
    # Buscar proyecto
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == user_id
    ).first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    
    # Guardar nombre para el log
    project_name = project.nombre
    
    # Eliminar proyecto (las imputaciones se borran en cascada)
    db.delete(project)
    db.commit()
    
    print(f"[PROJECTS] 🗑️ Proyecto eliminado: {project_name} por {current_user['username']}")
    
    return {"message": f"Proyecto '{project_name}' eliminado correctamente"}
