"""
Utilidades y funciones auxiliares
"""
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from database import Project


# ============================================================================
# FUNCIONES DE FECHA
# ============================================================================

def get_monday_of_week(fecha: date) -> date:
    """
    Obtiene el lunes de la semana que contiene la fecha dada
    
    Args:
        fecha: Fecha cualquiera
        
    Returns:
        Fecha del lunes de esa semana
    """
    dias_desde_lunes = fecha.weekday()  # 0 = lunes, 6 = domingo
    lunes = fecha - timedelta(days=dias_desde_lunes)
    return lunes


def is_weekend(fecha: date) -> bool:
    """
    Verifica si una fecha es fin de semana (sábado o domingo)
    
    Args:
        fecha: Fecha a verificar
        
    Returns:
        True si es sábado o domingo
    """
    return fecha.weekday() in [5, 6]  # 5 = sábado, 6 = domingo


def get_week_dates(lunes: date) -> list[date]:
    """
    Obtiene la lista de fechas de una semana (L-V)
    
    Args:
        lunes: Lunes de la semana
        
    Returns:
        Lista de fechas de lunes a viernes
    """
    return [lunes + timedelta(days=i) for i in range(5)]


# ============================================================================
# VALIDACIONES
# ============================================================================

def validate_project_limit(db: Session, user_id: int) -> bool:
    """
    Verifica si el usuario puede crear más proyectos (máximo 3)
    
    Args:
        db: Sesión de base de datos
        user_id: ID del usuario
        
    Returns:
        True si puede crear más proyectos
    """
    count = db.query(Project).filter(Project.user_id == user_id).count()
    return count < 3


def validate_hours(horas: float) -> bool:
    """
    Valida que las horas estén en el rango válido (0-24)
    
    Args:
        horas: Número de horas
        
    Returns:
        True si es válido
    """
    return 0 <= horas <= 24
