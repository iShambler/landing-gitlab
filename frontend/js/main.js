/**
 * Script principal para el index.html
 * Maneja los modales de login y registro
 */

const API_URL = 'https://aregest.arelance.com';

// =============================================================================
// CARGAR MODALES AL INICIO
// =============================================================================

async function loadModals() {
    try {
        const response = await fetch('utils/modals.html');
        const html = await response.text();
        
        // Crear un contenedor para los modales
        const modalsContainer = document.createElement('div');
        modalsContainer.innerHTML = html;
        document.body.appendChild(modalsContainer);
        
        // Inicializar eventos después de cargar los modales
        initializeModalEvents();
        initializeAuthForms();
    } catch (error) {
        console.error('❌ Error al cargar modales:', error);
    }
}

// =============================================================================
// EVENTOS DE MODALES
// =============================================================================

function initializeModalEvents() {
    // Botones para abrir modales
    const btnShowLogin = document.getElementById('btn-show-login');
    const btnShowRegister = document.getElementById('btn-show-register');
    
    // Botones para cerrar modales
    const modalLoginClose = document.getElementById('modal-login-close');
    const modalLoginCancel = document.getElementById('modal-login-cancel');
    const modalRegisterClose = document.getElementById('modal-register-close');
    const modalRegisterCancel = document.getElementById('modal-register-cancel');
    
    // Modales
    const modalLogin = document.getElementById('modal-login');
    const modalRegister = document.getElementById('modal-register');
    
    // Abrir modal de login
    if (btnShowLogin) {
        btnShowLogin.addEventListener('click', () => {
            modalLogin.classList.add('show');
        });
    }
    
    // Abrir modal de registro
    if (btnShowRegister) {
        btnShowRegister.addEventListener('click', () => {
            modalRegister.classList.add('show');
        });
    }
    
    // Cerrar modal de login
    if (modalLoginClose) {
        modalLoginClose.addEventListener('click', () => {
            modalLogin.classList.remove('show');
        });
    }
    
    if (modalLoginCancel) {
        modalLoginCancel.addEventListener('click', () => {
            modalLogin.classList.remove('show');
        });
    }
    
    // Cerrar modal de registro
    if (modalRegisterClose) {
        modalRegisterClose.addEventListener('click', () => {
            modalRegister.classList.remove('show');
        });
    }
    
    if (modalRegisterCancel) {
        modalRegisterCancel.addEventListener('click', () => {
            modalRegister.classList.remove('show');
        });
    }
    
    // Cerrar modal al hacer clic fuera
    modalLogin.addEventListener('click', (e) => {
        if (e.target === modalLogin) {
            modalLogin.classList.remove('show');
        }
    });
    
    modalRegister.addEventListener('click', (e) => {
        if (e.target === modalRegister) {
            modalRegister.classList.remove('show');
        }
    });
}

// =============================================================================
// AUTENTICACIÓN
// =============================================================================

function initializeAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginError = document.getElementById('login-error');
    const registerError = document.getElementById('register-error');
    
    // LOGIN
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(loginError);
        
        const formData = new FormData(loginForm);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Login exitoso');
                saveToken(result.token);
                redirectToDashboard();
            } else {
                showError(loginError, result.detail || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            showError(loginError, 'Error de conexión con el servidor');
        }
    });
    
    // REGISTRO
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError(registerError);
        
        const formData = new FormData(registerForm);
        const data = {
            username: formData.get('username'),
            password: formData.get('password')
        };
        
        // Validaciones del lado del cliente
        if (data.username.length < 3) {
            showError(registerError, 'El usuario debe tener al menos 3 caracteres');
            return;
        }
        
        if (data.password.length < 6) {
            showError(registerError, 'La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                console.log('✅ Registro exitoso');
                saveToken(result.token);
                redirectToDashboard();
            } else {
                showError(registerError, result.detail || 'Error al crear cuenta');
            }
        } catch (error) {
            console.error('❌ Error:', error);
            showError(registerError, 'Error de conexión con el servidor');
        }
    });
}

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function hideError(element) {
    element.textContent = '';
    element.classList.remove('show');
}

function saveToken(token) {
    localStorage.setItem('token', token);
}

function redirectToDashboard() {
    window.location.href = 'index.html';
}

// =============================================================================
// CHECK DE SESIÓN ACTIVA
// =============================================================================

function checkExistingSession() {
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
        // Verificar si el token es válido
        fetch(`${API_URL}/api/auth/me`, {
            headers: {
                'Authorization': `Bearer ${existingToken}`
            }
        })
        .then(response => {
            if (response.ok) {
                // Mostrar botones de usuario logueado
                document.getElementById('auth-buttons').style.display = 'none';
                document.getElementById('user-buttons').style.display = 'flex';
                
                // Agregar evento al botón de logout
                const btnLogout = document.getElementById('btn-logout');
                btnLogout.addEventListener('click', () => {
                    localStorage.removeItem('token');
                    window.location.reload();
                });
            }
        })
        .catch(error => {
            console.log('Token inválido');
        });
    }
}

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadModals();
    checkExistingSession();
});
