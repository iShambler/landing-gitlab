"""
Base de datos y modelos SQLAlchemy
"""
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, ForeignKey, CheckConstraint, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime, date
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de la base de datos
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./demo.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ============================================================================
# MODELOS
# ============================================================================

class User(Base):
    """Usuario del sistema"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    imputaciones = relationship("Imputacion", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    """Proyecto de un usuario (máximo 3 por usuario)"""
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(100), nullable=False)
    color = Column(String(7), default="#3B82F6")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", back_populates="projects")
    imputaciones = relationship("Imputacion", back_populates="project", cascade="all, delete-orphan")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'nombre', name='unique_user_project'),
    )


class ChatMessage(Base):
    """Mensaje del chat entre usuario y bot"""
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(10), nullable=False)  # 'user' o 'bot'
    message = Column(String(2000), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relación
    user = relationship("User", backref="chat_messages")


class Imputacion(Base):
    """Imputación de horas de un proyecto en una fecha (solo L-V)"""
    __tablename__ = "imputaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    fecha = Column(Date, nullable=False, index=True)
    horas = Column(Float, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relaciones
    user = relationship("User", back_populates="imputaciones")
    project = relationship("Project", back_populates="imputaciones")
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'project_id', 'fecha', name='unique_user_project_fecha'),
        CheckConstraint('horas >= 0 AND horas <= 24', name='check_horas_range'),
    )


# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

def get_db():
    """Generador de sesión de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Inicializa la base de datos creando todas las tablas"""
    Base.metadata.create_all(bind=engine)
    print("[DB] ✅ Base de datos inicializada correctamente")


if __name__ == "__main__":
    init_db()
