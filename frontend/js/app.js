/**
 * Aplicación principal integrada
 * Maneja autenticación, dashboard y estado de la aplicación
 */

class AppManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userData = null;
        this.isAuthenticated = false;
        
        this.userButtons = document.getElementById('user-buttons');
        this.btnLogout = document.getElementById('btn-logout');
        this.demoLoginBtn = document.getElementById('demo-login-btn');
        this.demoRegisterBtn = document.getElementById('demo-register-btn');
        this.modalLogin = document.getElementById('modal-login');
        this.modalRegister = document.getElementById('modal-register');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.loginError = document.getElementById('login-error');
        this.registerError = document.getElementById('register-error');
        this.emptyStateGuest = document.getElementById('empty-state-guest');
        this.emptyState = document.getElementById('empty-state');
        this.projectButtons = document.getElementById('project-buttons');
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        
        if (this.token) {
            await this.verifyToken();
        } else {
            this.showGuestMode();
        }
        
        calendarManager.render();
    }
    
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
                localStorage.removeItem('token');
                this.token = null;
                this.showGuestMode();
            }
        } catch (error) {
            this.showGuestMode();
        }
    }
    
    setupEventListeners() {
        if (this.demoLoginBtn) {
            this.demoLoginBtn.addEventListener('click', () => this.showLoginModal());
        }
        if (this.demoRegisterBtn) {
            this.demoRegisterBtn.addEventListener('click', () => this.showRegisterModal());
        }
        
        document.getElementById('modal-login-close').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('modal-login-cancel').addEventListener('click', () => this.hideLoginModal());
        document.getElementById('modal-register-close').addEventListener('click', () => this.hideRegisterModal());
        document.getElementById('modal-register-cancel').addEventListener('click', () => this.hideRegisterModal());
        
        this.modalLogin.addEventListener('click', (e) => {
            if (e.target === this.modalLogin) this.hideLoginModal();
        });
        this.modalRegister.addEventListener('click', (e) => {
            if (e.target === this.modalRegister) this.hideRegisterModal();
        });
        
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        this.btnLogout.addEventListener('click', () => this.logout());
    }
    
    showGuestMode() {
        this.isAuthenticated = false;
        
        if (this.userButtons) this.userButtons.style.display = 'none';
        if (this.emptyStateGuest) this.emptyStateGuest.style.display = 'block';
        if (this.emptyState) this.emptyState.style.display = 'none';
        if (this.projectButtons) this.projectButtons.style.display = 'none';
        
        const quickGuide = document.getElementById('quick-guide');
        if (quickGuide) {
            quickGuide.style.display = 'none';
            this.removeTooltipListeners();
        }
        
        const table = document.querySelector('.weekly-table');
        if (table) table.style.display = 'none';
        
        const chatWrapper = document.getElementById('chat-wrapper');
        if (chatWrapper) chatWrapper.style.display = 'none';
        
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) chatContainer.classList.remove('open');
    }
    
    showLoginModal() {
        this.modalLogin.style.display = 'flex';
        this.loginError.textContent = '';
        this.loginForm.reset();
    }
    
    hideLoginModal() {
        this.modalLogin.style.display = 'none';
        this.loginError.textContent = '';
    }
    
    showRegisterModal() {
        this.modalRegister.style.display = 'flex';
        this.registerError.textContent = '';
        this.registerForm.reset();
    }
    
    hideRegisterModal() {
        this.modalRegister.style.display = 'none';
        this.registerError.textContent = '';
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        this.loginError.textContent = '';
        this.loginError.classList.remove('show');
        
        try {
            const response = await fetch('https://aregest.arelance.com/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                data = { detail: 'Error del servidor' };
            }
            
            if (response.ok) {
                this.token = data.token;
                this.userData = data.user;
                localStorage.setItem('token', this.token);
                this.hideLoginModal();
                await this.onLoginSuccess();
            } else {
                let errorMessage = 'Error al iniciar sesión';
                if (data.detail) errorMessage = data.detail;
                else if (data.message) errorMessage = data.message;
                else if (data.error) errorMessage = data.error;
                else if (response.status === 400) errorMessage = 'Credenciales inválidas';
                else if (response.status === 401) errorMessage = 'Email o contraseña incorrectos';
                
                this.loginError.textContent = errorMessage;
                this.loginError.classList.add('show');
            }
        } catch (error) {
            this.loginError.textContent = 'Error de conexión con el servidor';
            this.loginError.classList.add('show');
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        
        this.registerError.textContent = '';
        this.registerError.classList.remove('show');
        
        try {
            const response = await fetch('https://aregest.arelance.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                data = { detail: 'Error del servidor' };
            }
            
            if (response.ok) {
                this.token = data.token;
                this.userData = data.user;
                localStorage.setItem('token', this.token);
                this.hideRegisterModal();
                await this.onLoginSuccess();
            } else {
                let errorMessage = 'Error al registrarse';
                if (data.detail) errorMessage = data.detail;
                else if (data.message) errorMessage = data.message;
                else if (data.error) errorMessage = data.error;
                else if (response.status === 400) errorMessage = 'Datos inválidos. Verifica tu email y contraseña';
                
                this.registerError.textContent = errorMessage;
                this.registerError.classList.add('show');
            }
        } catch (error) {
            this.registerError.textContent = 'Error de conexión con el servidor';
            this.registerError.classList.add('show');
        }
    }
    
    async onLoginSuccess() {
        this.isAuthenticated = true;
        
        if (this.userButtons) this.userButtons.style.display = 'flex';
        if (this.emptyStateGuest) this.emptyStateGuest.style.display = 'none';
        if (this.projectButtons) this.projectButtons.style.display = 'flex';
        
        const quickGuide = document.getElementById('quick-guide');
        if (quickGuide) {
            quickGuide.style.display = 'inline-flex';
            this.setupTooltipListeners();
        }
        
        const table = document.querySelector('.weekly-table');
        if (table) table.style.display = 'table';
        
        wsManager.token = this.token;
        wsManager.connect();
        
        wsManager.onMessage((message) => {
            this.handleWebSocketMessage(message);
        });
        
        await projectManager.loadProjects();
        await tableManager.loadWeek(new Date());
        
        if (window.chatBot) {
            window.chatBot.updateToken(this.token);
        }
    }
    
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'imputacion_updated':
                if (tableManager) {
                    tableManager.updateCell(message.project_id, message.fecha, message.horas);
                }
                break;
            case 'error':
                alert(message.message || 'Ha ocurrido un error');
                break;
        }
    }
    
    setupTooltipListeners() {
        const quickGuide = document.getElementById('quick-guide');
        const tooltipIcon = quickGuide?.querySelector('.tooltip-icon');
        
        if (tooltipIcon) {
            this.tooltipClickHandler = (e) => {
                e.stopPropagation();
                quickGuide.classList.toggle('active');
            };
            tooltipIcon.addEventListener('click', this.tooltipClickHandler);
            
            this.tooltipOutsideClickHandler = (e) => {
                if (!quickGuide.contains(e.target)) {
                    quickGuide.classList.remove('active');
                }
            };
            document.addEventListener('click', this.tooltipOutsideClickHandler);
        }
    }
    
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
    
    logout() {
        wsManager.disconnect();
        localStorage.removeItem('token');
        this.token = null;
        this.userData = null;
        this.isAuthenticated = false;
        this.showGuestMode();
        tableManager.clearTable();
        
        if (window.chatBot) {
            window.chatBot.updateToken(null);
        }
    }
}

window.appManager = new AppManager();
window.calendarManager = calendarManager;
window.tableManager = tableManager;
window.projectManager = projectManager;
window.wsManager = wsManager;
