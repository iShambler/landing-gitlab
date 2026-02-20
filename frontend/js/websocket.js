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
    
    connect() {
        if (!this.token) return;
        
        const wsUrl = `wss://aregest.arelance.com/ws/${this.token}`;
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
            this.reconnectAttempts = 0;
        };
        
        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.messageHandlers.forEach(handler => handler(data));
            } catch (error) {
                // Silenciar error de parseo
            }
        };
        
        this.ws.onerror = () => {};
        
        this.ws.onclose = () => {
            this.attemptReconnect();
        };
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }
    
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    
    onMessage(handler) {
        this.messageHandlers.push(handler);
    }
    
    imputarHoras(projectId, fecha, horas) {
        this.send({
            action: 'imputar',
            project_id: projectId,
            fecha: fecha,
            horas: horas
        });
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}

const wsManager = new WebSocketManager();
