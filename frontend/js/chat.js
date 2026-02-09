/**
 * Gestor del Chatbot estilo WhatsApp
 * Permite comunicación con el bot de imputación de horas
 */

class ChatBot {
    constructor() {
        this.isOpen = false;
        this.token = null;
        this.botApiUrl = 'https://aregest.arelance.com/chat';
        this.backendApiUrl = 'https://aregest.arelance.com/api/chat';  // Backend para historial
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
     * Inicializa el chatbot
     */
    init() {
        console.log('🤖 Inicializando ChatBot...');
        
        // Obtener elementos del DOM
        this.chatWrapper = document.getElementById('chat-wrapper');
        this.chatButton = document.getElementById('chat-button');
        this.chatContainer = document.getElementById('chat-container');
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.chatSendButton = document.getElementById('chat-send-button');
        this.chatCloseBtn = document.getElementById('chat-close-btn');
        this.chatStatus = document.getElementById('chat-status');
        
        if (!this.chatWrapper || !this.chatButton || !this.chatContainer) {
            console.warn('⚠️ Elementos del chat no encontrados');
            return;
        }
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Verificar si hay sesión activa
        this.checkSession();
        
        console.log('✅ ChatBot inicializado');
    }
    
    /**
     * Configura los event listeners
     */
    setupEventListeners() {
        // Toggle chat al hacer clic en el botón
        this.chatButton.addEventListener('click', () => this.toggleChat());
        
        // Cerrar chat con el botón de minimizar
        if (this.chatCloseBtn) {
            this.chatCloseBtn.addEventListener('click', () => this.toggleChat());
        }
        
        // Enviar mensaje al hacer clic en el botón
        this.chatSendButton.addEventListener('click', () => this.sendMessage());
        
        // Enviar mensaje con Enter
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
            // Hay sesión activa, mostrar wrapper del chat
            this.chatWrapper.style.display = 'flex';
            this.updateStatus(true);
            // Cargar historial de mensajes
            this.loadChatHistory();
        } else {
            // No hay sesión, ocultar wrapper
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
            const response = await fetch(`${this.backendApiUrl}/messages?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (!response.ok) {
                console.warn('⚠️ No se pudo cargar el historial');
                return;
            }
            
            const messages = await response.json();
            
            // Limpiar mensajes previos (excepto el mensaje de bienvenida)
            const welcomeMsg = this.chatMessages.querySelector('.chat-welcome');
            this.chatMessages.innerHTML = '';
            
            // Si no hay mensajes, mostrar bienvenida
            if (messages.length === 0) {
                if (welcomeMsg) {
                    this.chatMessages.appendChild(welcomeMsg);
                }
                return;
            }
            
            // Cargar mensajes del historial
            messages.forEach(msg => {
                if (msg.role === 'user') {
                    this.addUserMessage(msg.message, false);  // false = no guardar de nuevo
                } else if (msg.role === 'bot') {
                    this.addBotMessage(msg.message, false);
                }
            });
            
            console.log(`📝 Cargados ${messages.length} mensajes del historial`);
            
        } catch (error) {
            console.error('❌ Error cargando historial:', error);
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
            console.error('❌ Error guardando mensaje:', error);
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
            
            // Si es la primera vez que abre el chat, mostrar mensaje de bienvenida
            if (this.chatMessages.children.length === 1) { // Solo tiene el mensaje de bienvenida
                this.addBotMessage('¡Hola! 👋 Soy tu asistente para gestionar horas. Puedes decirme cosas como:\n\n• "¿Qué horas tengo esta semana?"\n• "Pon 8h en Desarrollo hoy"\n• "3h en Reuniones y 5h en Desarrollo"');
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
     * Envía un mensaje al bot
     */
    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) return;
        
        // Limpiar input
        this.chatInput.value = '';
        
        // Mostrar mensaje del usuario
        this.addUserMessage(message);
        
        // Mostrar indicador de "escribiendo..."
        this.showTyping();
        
        try {
            // Enviar al backend del bot
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
            
            // Ocultar indicador
            this.hideTyping();
            
            // Mostrar respuesta del bot
            this.addBotMessage(data.response || data.message || 'Algo salió mal. Inténtalo de nuevo.');
            
            // Si el comando fue exitoso, refrescar la tabla
            if (data.success && this.isCommandoAccion(data.response)) {
                console.log('🔄 Refrescando tabla después del comando...');
                if (window.tableManager) {
                    // Pequeño delay para que el backend termine de procesar
                    setTimeout(() => {
                        window.tableManager.loadWeek(new Date());
                    }, 500);
                }
            }
            
        } catch (error) {
            console.error('❌ Error al enviar mensaje:', error);
            this.hideTyping();
            this.addBotMessage('⚠️ No pude conectar con el servidor. Asegúrate de que el bot esté ejecutándose en http://localhost:8001');
            this.updateStatus(false);
        }
    }
    
    /**
     * Añade un mensaje del usuario
     */
    addUserMessage(text, save = true) {
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
        this.scrollToBottom();
        
        // Guardar en BD si es un mensaje nuevo
        if (save) {
            this.saveChatMessage('user', text);
        }
    }
    
    /**
     * Añade un mensaje del bot
     */
    addBotMessage(text, save = true) {
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
        this.scrollToBottom();
        
        // Guardar en BD si es un mensaje nuevo
        if (save) {
            this.saveChatMessage('bot', text);
        }
    }
    
    /**
     * Muestra el indicador de "escribiendo..."
     */
    showTyping() {
        // Eliminar indicador previo si existe
        this.hideTyping();
        
        // Crear el indicador como un mensaje
        const typingEl = document.createElement('div');
        typingEl.className = 'chat-message bot';
        typingEl.id = 'typing-indicator';
        
        typingEl.innerHTML = `
            <div class="chat-typing active">
                <span class="chat-typing-text">Arebot está escribiendo</span>
                <div class="chat-typing-dots">
                    <div class="chat-typing-dot"></div>
                    <div class="chat-typing-dot"></div>
                    <div class="chat-typing-dot"></div>
                </div>
            </div>
        `;
        
        // Añadir después del último mensaje
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
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }
    
    /**
     * Detecta si la respuesta es de un comando de acción (que modifica datos)
     */
    isCommandoAccion(respuesta) {
        // Si la respuesta contiene emojis de éxito o indica imputación
        const indicadoresAccion = [
            '✅',  // Checkmark (imputación exitosa)
            'imputad',
            'registrad',
            'guardad',
            'actualizado'
        ];
        
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
        // Mantener solo el mensaje de bienvenida
        const welcomeMsg = this.chatMessages.querySelector('.chat-welcome');
        this.chatMessages.innerHTML = '';
        if (welcomeMsg) {
            this.chatMessages.appendChild(welcomeMsg);
        }
    }
}

// Crear instancia global del chatbot
const chatBot = new ChatBot();

// Exportar para uso en otros módulos
if (typeof window !== 'undefined') {
    window.chatBot = chatBot;
}
