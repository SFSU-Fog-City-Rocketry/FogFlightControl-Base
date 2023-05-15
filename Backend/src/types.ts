export type SenderType = 'BACKEND' | 'FRONTEND' | 'PLUGIN' | 'VEHICLE';

export interface WebSocketMessage {
  senderType: SenderType;
  recipientType: SenderType
  messageType: 'DO' | 'RENDER' | 'PING' | 'UPLOAD' | 'ACK';
  pluginRecipient?: string;
  category?: string; // For instance, a render message with a category "text" and a payload "Hello, world!"
  payload: any;
}

export interface ManifestMetadata {
  name: string;
  id: string;
  version: string;
  description: string;
  authors: string[];
}

export interface ManifestMain {
  entrypoint: string;
  dependencies?: string[];
  pages?: string[];
}

export interface ManifestFile {
  metadata: ManifestMetadata;
  main: ManifestMain;
}


export interface FrontendPage {
  name: string; 
}