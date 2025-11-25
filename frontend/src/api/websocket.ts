import { type MessageResponse } from '../types/dialog';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: ((data: any) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private connectionPromise: Promise<void> | null = null;
  private chatUpdateHandlers: ((message: any) => void)[] = [];

   async connect(token: string): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:8000/api/v1/websocket/ws?token=${encodeURIComponent(token)}`;
        console.log(`🔗 Connecting to: ${wsUrl}`);
        
        this.socket = new WebSocket(wsUrl);
        
        this.socket.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.socket.onmessage = (event) => {
          console.log('WebSocket message received:', event.data);
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.connectionPromise = null;
          this.handleReconnection(token);
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.connectionPromise = null;
          reject(error);
        };

      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private handleReconnection(token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect(token).catch(console.error);
      }, 3000 * this.reconnectAttempts);
    }
  }

  sendMessage(message: WebSocketMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: (data: any) => void) {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  private handleMessage(data: any) {
    this.messageHandlers.forEach(handler => handler(data));
  }

  // private handleMessage(data: any) {
  //   this.messageHandlers.forEach(handler => handler(data));
  // }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.messageHandlers = [];
  }

  sendTextMessage(dialogId: number, content: string) {
    this.sendMessage({
      type: 'send_message',
      dialog_id: dialogId,
      content: content
    });
  }

  sendTyping(dialogId: number, isTyping: boolean) {
    this.sendMessage({
      type: 'typing',
      dialog_id: dialogId,
      is_typing: isTyping
    });
  }

  markAsRead(dialogId: number) {
    this.sendMessage({
      type: 'read_messages',
      dialog_id: dialogId
    });
  }

  onChatUpdate(handler: (message: any) => void) {
    this.chatUpdateHandlers.push(handler);
  }

  private handleChatUpdate(message: any) {
    this.chatUpdateHandlers.forEach(handler => handler(message));
  }

  // private handleMessage(data: any) {
  //   this.messageHandlers.forEach(handler => handler(data));

  //   if (data.type === 'new_message') {
  //     this.handleChatUpdate(data.message);
  //   }
  // }
}

export const websocketService = new WebSocketService();