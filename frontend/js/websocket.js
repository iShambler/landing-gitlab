/**
 * Gestión de WebSocket para actualizaciones en tiempo real
 */

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.token = localStorage.getItem('token');
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
        this.messageHandlers = [];
    }
    
    /**
     * Conecta al WebSocket
     */
    connect() {
        if (!this.token) {
            console.error('❌ No hay token disponible');
            return;
        }
        
        const wsUrl = `wss://aregest.arelance.com/ws/${this.token}`;
        console.log('🔌 Conectando a WebSocket...');
        
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            console.log('✅ WebSocket conectado');
            this.reconnectAttempts = 0;
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('📨 Mensaje recibido:', data);
                
                // Notificar a todos los handlers registrados
                this.messageHandlers.forEach(handler => handler(data));
            } catch (error) {
                console.error('❌ Error procesando mensaje:', error);
            }
        };
        
        this.ws.onerror = (error) => {
            console.error('❌ Error en WebSocket:', error);
        };
        
        this.ws.onclose = () => {
            console.log('🔌 WebSocket desconectado');
            this.attemptReconnect();
        };
    }
    
    /**
     * Intenta reconectar automáticamente
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.error('❌ Máximo de intentos de reconexión alcanzado');
        }
    }
    
    /**
     * Envía un mensaje al servidor
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            console.log('📤 Mensaje enviado:', data);
        } else {
            console.error('❌ WebSocket no está conectado');
        }
    }
    
    /**
     * Registra un handler para mensajes entrantes
     */
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    
    /**
     * Imputa horas vía WebSocket
     */
    imputarHoras(projectId, fecha, horas) {
        this.send({
            action: 'imputar',
            project_id: projectId,
            fecha: fecha,
            horas: horas
        });
    }
    
    /**
     * Desconecta el WebSocket
     */
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

// Instancia global
const wsManager = new WebSocketManager();
