/**
 * Lógica de autenticación: Login y Registro
 */

const API_URL = 'http://localhost:8003';

// =============================================================================
// ELEMENTOS DEL DOM
// =============================================================================

const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginError = document.getElementById('login-error');
const registerError = document.getElementById('register-error');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

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
    window.location.href = 'dashboard.html';
}

// =============================================================================
// TABS
// =============================================================================

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // Actualizar botones
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Actualizar contenido
        tabContents.forEach(content => {
            if (content.id === `${targetTab}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // Limpiar errores
        hideError(loginError);
        hideError(registerError);
    });
});

// =============================================================================
// LOGIN
// =============================================================================

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

// =============================================================================
// REGISTRO
// =============================================================================

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

// =============================================================================
// INICIALIZACIÓN
// =============================================================================

// Redirigir si ya tiene token válido
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
            redirectToDashboard();
        }
    })
    .catch(error => {
        console.log('Token inválido, mostrando login');
    });
}
