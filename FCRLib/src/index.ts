import * as WebSocket from 'ws';

export interface Plugin {
  name: string;
  id: string;
  description: string;
  version: string; // Semantic versioning
  icon: string;
  iconIsMdi: boolean;
}

export interface BackendServer {
  port: number;
  wss: WebSocket.WebSocketServer;
}

type SenderType = 'BACKEND' | 'FRONTEND' | 'PLUGIN' | 'VEHICLE';

export interface WebSocketMessage {
  senderType: SenderType;
  recipientType: SenderType
  messageType: 'DO' | 'RENDER' | 'PING' | 'UPLOAD' | 'ACK';
  pluginRecipient?: string;
  category?: string; // For instance, a render message with a category "text" and a payload "Hello, world!"
  payload: any;
}
