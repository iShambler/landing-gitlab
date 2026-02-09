/**
 * Orquestador principal del dashboard
 */

class DashboardManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        
        this.usernameDisplay = document.getElementById('username-display');
        this.btnLogout = document.getElementById('btn-logout');
        
        this.init();
    }
    
    /**
     * Inicializa el dashboard
     */
    async init() {
        // Verificar autenticación
        if (!this.token) {
            this.redirectToLogin();
            return;
        }
        
        // Cargar información del usuario
        await this.updateUserInfo();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Inicializar componentes
        this.initializeComponents();
        
        console.log('✅ Dashboard inicializado');
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Logout
        this.btnLogout.addEventListener('click', () => {
            this.logout();
        });
    }
    
    /**
     * Inicializa los componentes
     */
    async initializeComponents() {
        // Conectar WebSocket
        wsManager.connect();
        
        // Registrar handler para mensajes del WebSocket
        wsManager.onMessage((message) => {
            this.handleWebSocketMessage(message);
        });
        
        // Renderizar calendario
        calendarManager.render();
        
        // Cargar proyectos
        await projectManager.loadProjects();
        
        // Cargar semana actual
        await tableManager.loadWeek(new Date());
    }
    
    /**
     * Actualiza la información del usuario
     */
    async updateUserInfo() {
        try {
            const response = await fetch('http://localhost:8003/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.userData = await response.json();
                
                // Actualizar UI
                this.usernameDisplay.textContent = this.userData.username;
            } else {
                console.error('Error al obtener información del usuario');
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('Error:', error);
            this.redirectToLogin();
        }
    }
    
    /**
     * Maneja mensajes entrantes del WebSocket
     */
    handleWebSocketMessage(message) {
        console.log('📨 Procesando mensaje:', message);
        
        switch (message.type) {
            case 'imputacion_updated':
                // Actualizar celda de la tabla
                if (tableManager) {
                    tableManager.updateCell(
                        message.project_id,
                        message.fecha,
                        message.horas
                    );
                }
                break;
                
            case 'error':
                alert(message.message || 'Ha ocurrido un error');
                break;
                
            default:
                console.log('Tipo de mensaje desconocido:', message.type);
        }
    }
    
    /**
     * Carga una semana específica
     */
    async loadWeek(date) {
        await tableManager.loadWeek(date);
    }
    
    /**
     * Cierra sesión
     */
    logout() {
        // Desconectar WebSocket
        wsManager.disconnect();
        
        // Limpiar localStorage
        localStorage.removeItem('token');
        
        // Redirigir
        this.redirectToLogin();
    }
    
    /**
     * Redirige al login
     */
    redirectToLogin() {
        window.location.href = 'index.html';
    }
}

// =============================================================================
// INICIALIZACIÓN GLOBAL
// =============================================================================

// Verificar token antes de cargar el dashboard
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
} else {
    // Instancia global del dashboard
    window.dashboardManager = new DashboardManager();
    
    // Hacer disponibles los managers globalmente
    window.calendarManager = calendarManager;
    window.tableManager = tableManager;
    window.projectManager = projectManager;
    window.wsManager = wsManager;
}
