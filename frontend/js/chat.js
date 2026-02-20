/**
 * Gestor del Asistente de imputación
 * Permite comunicación con el asistente de gestión de horas
 */

class ChatBot {
    constructor() {
        this.isOpen = false;
        this.token = null;
        this.botApiUrl = 'https://aregest.arelance.com/chat';
        this.backendApiUrl = 'https://aregest.arelance.com/api/chat';
        this.isLoadingHistory = false;
        
        // Elementos del DOM
        this.chatWrapper = null;
        this.chatButton = null;
        this.chatContainer = null;
        this.chatMessages = null;
        this.chatInput = null;
        this.chatSendButton = null;
        this.chatCloseBtn = null;
        this.chatStatus = null;
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    /**
     * Inicializa el asistente
     */
    init() {
        this.chatWrapper = document.getElementById('chat-wrapper');
        this.chatButton = document.getElementById('chat-button');
        this.chatContainer = document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send-button');
        this.chatCloseBtn = document.getElementById('chat-close-btn');
        this.chatStatus = document.getElementById('chat-status');
        
        if (!this.chatWrapper || !this.chatButton || !this.chatContainer) return;
        
        this.setupEventListeners();
        this.checkSession();
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        this.chatButton.addEventListener('click', () => this.toggleChat());
        
        if (this.chatCloseBtn) {
            this.chatCloseBtn.addEventListener('click', () => this.toggleChat());
        }
        
        this.chatSendButton.addEventListener('click', () => this.sendMessage());
        
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    /**
     * Verifica si hay sesión activa y muestra/oculta el chat
     */
    checkSession() {
        this.token = localStorage.getItem('token');
        
        if (this.token) {
            this.chatWrapper.style.display = 'flex';
            this.updateStatus(true);
            this.loadChatHistory();
        } else {
            this.chatWrapper.style.display = 'none';
            this.isOpen = false;
            this.chatContainer.classList.remove('open');
        }
    }
    
    /**
     * Actualiza el token cuando cambia la sesión
     */
    updateToken(token) {
        this.token = token;
        this.checkSession();
    }
    
    /**
     * Carga el historial de mensajes desde la BD
     */
    async loadChatHistory() {
        if (this.isLoadingHistory || !this.token) return;
        
        this.isLoadingHistory = true;
        
        try {
            const response = await fetch(`${this.backendApiUrl}/messages?limit=500`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) return;
            
            let messages = await response.json();
            
            const welcomeMsg = this.chatMessages.querySelector('.chat-welcome');
            this.chatMessages.innerHTML = '';
            
            if (messages.length === 0) {
                if (welcomeMsg) {
                    this.chatMessages.appendChild(welcomeMsg);
                }
                return;
            }
            
            // Quedarnos solo con los últimos 50 mensajes (los más recientes)
            const MAX_DISPLAY = 50;
            if (messages.length > MAX_DISPLAY) {
                messages = messages.slice(-MAX_DISPLAY);
            }
            
            // Cargar mensajes sin hacer scroll individual
            messages.forEach(msg => {
                if (msg.role === 'user') {
                    this.addUserMessage(msg.message, false, true);
                } else if (msg.role === 'bot') {
                    this.addBotMessage(msg.message, false, true);
                }
            });
            
            // Scroll al final una sola vez después de cargar todo
            this.scrollToBottom();
            
        } catch (error) {
            // Silenciar error de carga de historial
        } finally {
            this.isLoadingHistory = false;
        }
    }
    
    /**
     * Guarda un mensaje en la BD
     */
    async saveChatMessage(role, message) {
        if (!this.token) return;
        
        try {
            await fetch(`${this.backendApiUrl}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role, message })
            });
        } catch (error) {
            // Silenciar error de guardado
        }
    }
    
    /**
     * Abre/cierra el chat
     */
    toggleChat() {
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            this.chatContainer.classList.add('open');
            this.chatButton.classList.add('active');
            this.chatInput.focus();
            
            // Scroll al final al abrir (por si el historial ya estaba cargado)
            this.scrollToBottom();
            
            // Si es la primera vez que abre el chat, mostrar mensaje de bienvenida
            if (this.chatMessages.children.length === 1) {
                this.addBotMessage('Bienvenido al asistente de gestión de horas. Puedes realizar operaciones como:\n\n• "¿Qué horas tengo esta semana?"\n• "Pon 8h en Desarrollo hoy"\n• "3h en Reuniones y 5h en Desarrollo"');
            }
        } else {
            this.chatContainer.classList.remove('open');
            this.chatButton.classList.remove('active');
        }
    }
    
    /**
     * Actualiza el estado (online/offline)
     */
    updateStatus(online) {
        if (this.chatStatus) {
            if (online) {
                this.chatStatus.textContent = 'En línea';
                this.chatStatus.classList.add('online');
            } else {
                this.chatStatus.textContent = 'Sin conexión';
                this.chatStatus.classList.remove('online');
            }
        }
    }
    
    /**
     * Envía un mensaje al asistente
     */
    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) return;
        
        this.chatInput.value = '';
        this.addUserMessage(message);
        this.showTyping();
        
        try {
            const response = await fetch(this.botApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: this.token,
                    message: message
                })
            });
            
            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.status}`);
            }
            
            const data = await response.json();
            
            this.hideTyping();
            this.addBotMessage(data.response || data.message || 'Se produjo un error. Por favor, inténtalo de nuevo.');
            
            // Si el comando fue exitoso, refrescar la tabla
            if (data.success && this.isCommandoAccion(data.response)) {
                if (window.tableManager) {
                    setTimeout(() => {
                        window.tableManager.loadWeek(new Date());
                    }, 500);
                }
            }
            
        } catch (error) {
            this.hideTyping();
            this.addBotMessage('⚠️ No se pudo establecer conexión con el servidor. Verifica que el servicio esté activo.');
            this.updateStatus(false);
        }
    }
    
    /**
     * Añade un mensaje del usuario
     * @param {boolean} skipScroll - Si true, no hace scroll (para carga masiva de historial)
     */
    addUserMessage(text, save = true, skipScroll = false) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message user';
        
        const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        messageEl.innerHTML = `
            <div class="chat-bubble">
                <p class="chat-bubble-text">${this.escapeHtml(text)}</p>
                <div class="chat-bubble-time">${time}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageEl);
        
        if (!skipScroll) this.scrollToBottom();
        if (save) this.saveChatMessage('user', text);
    }
    
    /**
     * Añade un mensaje del asistente
     * @param {boolean} skipScroll - Si true, no hace scroll (para carga masiva de historial)
     */
    addBotMessage(text, save = true, skipScroll = false) {
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message bot';
        
        const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        messageEl.innerHTML = `
            <div class="chat-bubble">
                <p class="chat-bubble-text">${this.escapeHtml(text)}</p>
                <div class="chat-bubble-time">${time}</div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageEl);
        
        if (!skipScroll) this.scrollToBottom();
        if (save) this.saveChatMessage('bot', text);
    }
    
    /**
     * Muestra el indicador de "escribiendo..."
     */
    showTyping() {
        this.hideTyping();
        
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-message bot';
        typingEl.id = 'typing-indicator';
        
        typingEl.innerHTML = `
            <div class="chat-typing active">
                <span class="chat-typing-text">Aregest está procesando</span>
                <div class="chat-typing-dots">
                    <div class="chat-typing-dot"></div>
                    <div class="chat-typing-dot"></div>
                    <div class="chat-typing-dot"></div>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(typingEl);
        this.scrollToBottom();
    }
    
    /**
     * Oculta el indicador de "escribiendo..."
     */
    hideTyping() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    /**
     * Hace scroll hasta el final de los mensajes
     */
    scrollToBottom() {
        requestAnimationFrame(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        });
    }
    
    /**
     * Detecta si la respuesta es de un comando de acción (que modifica datos)
     */
    isCommandoAccion(respuesta) {
        const indicadoresAccion = ['✅', 'imputad', 'registrad', 'guardad', 'actualizado'];
        const respuestaLower = respuesta.toLowerCase();
        return indicadoresAccion.some(indicador => 
            respuestaLower.includes(indicador.toLowerCase())
        );
    }
    
    /**
     * Escapa HTML para prevenir XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Limpia el historial de mensajes
     */
    clearMessages() {
        const welcomeMsg = this.chatMessages.querySelector('.chat-welcome');
        this.chatMessages.innerHTML = '';
        if (welcomeMsg) {
            this.chatMessages.appendChild(welcomeMsg);
        }
    }
}

// Instancia global
const chatBot = new ChatBot();

if (typeof window !== 'undefined') {
    window.chatBot = chatBot;
}
