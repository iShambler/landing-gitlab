/**
 * Aplicación principal integrada
 * Maneja autenticación, dashboard y estado de la aplicación
 */

class AppManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.isAuthenticated = false;
        
        // Elementos del DOM
        this.authButtons = document.getElementById('auth-buttons');
        this.userButtons = document.getElementById('user-buttons');
        
        // Botones de autenticación
        this.btnShowLogin = document.getElementById('btn-show-login');
        this.btnShowRegister = document.getElementById('btn-show-register');
        this.btnLogout = document.getElementById('btn-logout');
        this.demoLoginBtn = document.getElementById('demo-login-btn');
        this.demoRegisterBtn = document.getElementById('demo-register-btn');
        
        // Modales
        this.modalLogin = document.getElementById('modal-login');
        this.modalRegister = document.getElementById('modal-register');
        
        // Formularios
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        
        // Mensajes de error
        this.loginError = document.getElementById('login-error');
        this.registerError = document.getElementById('register-error');
        
        // Empty states
        this.emptyStateGuest = document.getElementById('empty-state-guest');
        this.emptyState = document.getElementById('empty-state');
        
        // Botones de proyecto
        this.projectButtons = document.getElementById('project-buttons');
        
        this.init();
    }
    
    /**
     * Inicializa la aplicación
     */
    async init() {
        console.log('🚀 Inicializando aplicación...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Verificar si hay token guardado
        if (this.token) {
            await this.verifyToken();
        } else {
            this.showGuestMode();
        }
        
        // Inicializar componentes base (calendario siempre visible)
        calendarManager.render();
        
        console.log('✅ Aplicación inicializada');
    }
    
    /**
     * Verifica si el token guardado es válido
     */
    async verifyToken() {
        try {
            const response = await fetch('https://aregest.arelance.com/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.userData = await response.json();
                await this.onLoginSuccess();
            } else {
                // Token inválido, limpiar
                localStorage.removeItem('token');
                this.token = null;
                this.showGuestMode();
            }
        } catch (error) {
            console.error('Error verificando token:', error);
            this.showGuestMode();
        }
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Mostrar modales
        this.btnShowLogin.addEventListener('click', () => this.showLoginModal());
        this.btnShowRegister.addEventListener('click', () => this.showRegisterModal());
        
        // Botones en el empty state de la demo
        if (this.demoLoginBtn) {
            this.demoLoginBtn.addEventListener('click', () => this.showLoginModal());
        }
        if (this.demoRegisterBtn) {
            this.demoRegisterBtn.addEventListener('click', () => this.showRegisterModal());
        }
        
        // Cerrar modales
        document.getElementById('modal-login-close').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('modal-login-cancel').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('modal-register-close').addEventListener('click', () => this.hideRegisterModal());
        document.getElementById('modal-register-cancel').addEventListener('click', () => this.hideRegisterModal());
        
        // Cerrar modal al hacer click fuera
        this.modalLogin.addEventListener('click', (e) => {
            if (e.target === this.modalLogin) this.hideLoginModal();
        });
        this.modalRegister.addEventListener('click', (e) => {
            if (e.target === this.modalRegister) this.hideRegisterModal();
        });
        
        // Formularios
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Logout
        this.btnLogout.addEventListener('click', () => this.logout());
    }
    
    /**
     * Muestra el modo invitado (no autenticado)
     */
    showGuestMode() {
        console.log('👤 Modo invitado');
        this.isAuthenticated = false;
        
        // Mostrar/ocultar elementos con validación
        if (this.authButtons) this.authButtons.style.display = 'flex';
        if (this.userButtons) this.userButtons.style.display = 'none';
        if (this.emptyStateGuest) this.emptyStateGuest.style.display = 'block';
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.projectButtons) this.projectButtons.style.display = 'none';
        
        // Ocultar guía rápida
        const quickGuide = document.getElementById('quick-guide');
        if (quickGuide) {
            quickGuide.style.display = 'none';
            this.removeTooltipListeners();
        }
        
        // Ocultar tabla
        const table = document.querySelector('.weekly-table');
        if (table) table.style.display = 'none';
    }
    
    /**
     * Muestra modal de login
     */
    showLoginModal() {
        this.modalLogin.style.display = 'flex';
        this.loginError.textContent = '';
        this.loginForm.reset();
    }
    
    /**
     * Oculta modal de login
     */
    hideLoginModal() {
        this.modalLogin.style.display = 'none';
        this.loginError.textContent = '';
    }
    
    /**
     * Muestra modal de registro
     */
    showRegisterModal() {
        this.modalRegister.style.display = 'flex';
        this.registerError.textContent = '';
        this.registerForm.reset();
    }
    
    /**
     * Oculta modal de registro
     */
    hideRegisterModal() {
        this.modalRegister.style.display = 'none';
        this.registerError.textContent = '';
    }
    
    /**
     * Maneja el login
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('https://aregest.arelance.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Guardar token
                this.token = data.token;
                this.userData = data.user;
                localStorage.setItem('token', this.token);
                
                // Ocultar modal
                this.hideLoginModal();
                
                // Inicializar dashboard
                await this.onLoginSuccess();
            } else {
                this.loginError.textContent = data.detail || 'Error al iniciar sesión';
            }
        } catch (error) {
            console.error('Error en login:', error);
            this.loginError.textContent = 'Error de conexión con el servidor';
        }
    }
    
    /**
     * Maneja el registro
     */
    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        try {
            const response = await fetch('https://aregest.arelance.com/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Guardar token
                this.token = data.token;
                this.userData = data.user;
                localStorage.setItem('token', this.token);
                
                // Ocultar modal
                this.hideRegisterModal();
                
                // Inicializar dashboard
                await this.onLoginSuccess();
            } else {
                this.registerError.textContent = data.detail || 'Error al registrarse';
            }
        } catch (error) {
            console.error('Error en registro:', error);
            this.registerError.textContent = 'Error de conexión con el servidor';
        }
    }
    
    /**
     * Ejecuta acciones después de un login exitoso
     */
    async onLoginSuccess() {
        console.log('✅ Login exitoso:', this.userData.email);
        this.isAuthenticated = true;
        
        // Actualizar UI con validación
        if (this.authButtons) this.authButtons.style.display = 'none';
        if (this.userButtons) this.userButtons.style.display = 'flex';
        if (this.emptyStateGuest) this.emptyStateGuest.style.display = 'none';
        if (this.projectButtons) this.projectButtons.style.display = 'flex';
        
        // Mostrar guía rápida
        const quickGuide = document.getElementById('quick-guide');
        if (quickGuide) {
            quickGuide.style.display = 'inline-flex';
            this.setupTooltipListeners();
        }
        
        // Mostrar tabla
        const table = document.querySelector('.weekly-table');
        if (table) table.style.display = 'table';
        
        // Conectar WebSocket
        wsManager.connect();
        
        // Registrar handler para mensajes del WebSocket
        wsManager.onMessage((message) => {
            this.handleWebSocketMessage(message);
        });
        
        // Cargar proyectos
        await projectManager.loadProjects();
        
        // Cargar semana actual
        await tableManager.loadWeek(new Date());
        
        // Actualizar chatbot con el token
        if (window.chatBot) {
            window.chatBot.updateToken(this.token);
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
     * Configura listeners para el tooltip (click en móviles)
     */
    setupTooltipListeners() {
        const quickGuide = document.getElementById('quick-guide');
        const tooltipIcon = quickGuide?.querySelector('.tooltip-icon');
        
        if (tooltipIcon) {
            // Toggle tooltip en click (para móviles)
            this.tooltipClickHandler = (e) => {
                e.stopPropagation();
                quickGuide.classList.toggle('active');
            };
            
            tooltipIcon.addEventListener('click', this.tooltipClickHandler);
            
            // Cerrar tooltip al hacer click fuera
            this.tooltipOutsideClickHandler = (e) => {
                if (!quickGuide.contains(e.target)) {
                    quickGuide.classList.remove('active');
                }
            };
            
            document.addEventListener('click', this.tooltipOutsideClickHandler);
        }
    }
    
    /**
     * Elimina listeners del tooltip
     */
    removeTooltipListeners() {
        const quickGuide = document.getElementById('quick-guide');
        const tooltipIcon = quickGuide?.querySelector('.tooltip-icon');
        
        if (tooltipIcon && this.tooltipClickHandler) {
            tooltipIcon.removeEventListener('click', this.tooltipClickHandler);
        }
        
        if (this.tooltipOutsideClickHandler) {
            document.removeEventListener('click', this.tooltipOutsideClickHandler);
        }
        
        quickGuide?.classList.remove('active');
    }
    
    /**
     * Cierra sesión
     */
    logout() {
        console.log('👋 Cerrando sesión');
        
        // Desconectar WebSocket
        wsManager.disconnect();
        
        // Limpiar datos
        localStorage.removeItem('token');
        this.token = null;
        this.userData = null;
        this.isAuthenticated = false;
        
        // Volver a modo invitado
        this.showGuestMode();
        
        // Limpiar tabla
        tableManager.clearTable();
        
        // Actualizar chatbot (ocultar)
        if (window.chatBot) {
            window.chatBot.updateToken(null);
        }
    }
}

// =============================================================================
// INICIALIZACIÓN GLOBAL
// =============================================================================

// Instancia global de la aplicación
window.appManager = new AppManager();

// Hacer disponibles los managers globalmente
window.calendarManager = calendarManager;
window.tableManager = tableManager;
window.projectManager = projectManager;
window.wsManager = wsManager;
