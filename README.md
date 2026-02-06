# 📅 Demo - Gestión de Horas

Sistema de imputación de horas personal con autenticación JWT, límite de interacciones diarias y actualizaciones en tiempo real vía WebSocket.

---

## ✨ Características

- ✅ Autenticación con JWT (Login/Registro)
- ✅ Máximo 3 proyectos por usuario
- ✅ Límite de 5 interacciones diarias
- ✅ Calendario mensual interactivo
- ✅ Tabla semanal de imputación (Lunes a Viernes)
- ✅ Actualización en tiempo real con WebSocket
- ✅ Gestión de proyectos (Crear/Borrar)
- ✅ Solo imputación L-V (Sábado y Domingo bloqueados)

---

## 🛠️ Stack Tecnológico

### Backend
- FastAPI
- SQLite
- SQLAlchemy
- JWT (PyJWT)
- WebSocket
- Bcrypt (Password hashing)

### Frontend
- HTML5 + CSS3 + JavaScript Vanilla
- WebSocket nativo
- Fetch API

---

## 📦 Instalación

### 1. Backend

```bash
# Navegar al directorio backend
cd C:\Proyectos\demo-gestion-horas\backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor
python main.py
```

El servidor estará disponible en: **http://localhost:8000**

### 2. Frontend

Simplemente abre el archivo en tu navegador:

```
C:\Proyectos\demo-gestion-horas\frontend\index.html
```

O usa un servidor local (recomendado):

```bash
# Con Python
cd C:\Proyectos\demo-gestion-horas\frontend
python -m http.server 3000
```

Luego abre: **http://localhost:3000**

---

## 🚀 Uso

### 1. Registro/Login
- Abre la aplicación en el navegador
- Crea una cuenta o inicia sesión
- **Usuario:** mínimo 3 caracteres
- **Contraseña:** mínimo 6 caracteres

### 2. Crear Proyectos
- Haz clic en **"CREAR PROYECTO"**
- Ingresa el nombre y elige un color
- Máximo 3 proyectos por usuario

### 3. Imputar Horas
#### Opción A: Manual
- Haz clic en cualquier celda de la tabla (L-V)
- Ingresa las horas (0-24)
- Presiona Enter o haz clic fuera para guardar

#### Opción B: Calendario
- Haz clic en un día del calendario
- Se cargará la semana correspondiente

### 4. Navegación
- **Calendario:** Usa ← → para cambiar de mes
- **Tabla:** Usa ← → para cambiar de semana

### 5. Límite de Interacciones
Cada usuario tiene **5 interacciones diarias**:
- Crear proyecto: 1 interacción
- Borrar proyecto: 1 interacción
- Editar horas: 1 interacción por celda

El contador se resetea automáticamente cada 24 horas.

---

## 📡 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual

### Proyectos
- `GET /api/projects` - Listar proyectos
- `POST /api/projects` - Crear proyecto
- `DELETE /api/projects/{id}` - Eliminar proyecto

### Imputaciones
- `GET /api/imputaciones/semana/{fecha}` - Obtener semana
- `POST /api/imputaciones` - Crear/actualizar imputación

### WebSocket
- `WS /ws/{token}` - Conexión WebSocket

**Documentación completa:** http://localhost:8000/docs

---

## 🗄️ Base de Datos

La base de datos SQLite se crea automáticamente en:
```
C:\Proyectos\demo-gestion-horas\backend\demo.db
```

### Tablas
- **users** - Usuarios del sistema
- **projects** - Proyectos (máx 3 por usuario)
- **imputaciones** - Horas imputadas
- **interactions** - Contador de interacciones diarias

---

## 🔐 Seguridad

- Contraseñas hasheadas con **bcrypt**
- Autenticación con **JWT**
- Token válido por 24 horas
- CORS habilitado (ajustar en producción)

---

## 🐛 Solución de Problemas

### Error: "No se puede conectar al servidor"
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Revisa la consola del servidor para ver logs

### Error: "WebSocket no conecta"
- El token JWT debe ser válido
- Verifica la URL del WebSocket en `js/websocket.js`

### Error: "No puedo crear proyectos"
- Verifica que no tengas ya 3 proyectos
- Revisa que te queden interacciones disponibles

### La base de datos no se crea
- Ejecuta manualmente: `python backend/database.py`

---

## 📝 Notas de Desarrollo

### Frontend
- Todos los archivos JS están en `frontend/js/`
- Los estilos están en `frontend/css/styles.css`
- Sin frameworks externos (Vanilla JS)

### Backend
- Estructura modular por rutas
- Todos los modelos en `database.py`
- WebSocket en `routes/websocket_routes.py`

---

## 🔄 Próximas Mejoras

- [ ] Integración con bot de IA
- [ ] Exportación a Excel/PDF
- [ ] Estadísticas mensuales
- [ ] Modo oscuro
- [ ] Notificaciones push
- [ ] Recordatorios automáticos

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs del servidor
2. Abre la consola del navegador (F12)
3. Verifica que todas las dependencias estén instaladas

---

## 📄 Licencia

Este es un proyecto demo sin licencia específica.

---

**🎉 ¡Disfruta gestionando tus horas!**
