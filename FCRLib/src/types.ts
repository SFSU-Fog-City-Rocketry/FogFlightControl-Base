import * as WebSocket from 'ws';

/**
 * A plugin is a piece of software that interfaces with the vehicle.
 * It is responsible for executing tasks and rendering the UI.
 * 
 * The plugin most contain a manifest.toml file at the root of the plugin directory.
 * The entry point specified must point to a js file to execute on startup.
 * 
 * name: The name of the plugin.
 * id: The UUID of the plugin.
 * description: A description of the plugin.
 * version: The semantic (Major.Minor.Path) version of the plugin.
 * icon: The icon of the plugin. Can be a URL or an MDI icon (see @mdi/js).
 * iconIsMdi: Whether or not the icon is an MDI icon.
 */
export interface Plugin {
  name: string;
  id: string;
  description: string;
  version: string; // Semantic versioning
  icon: string;
  iconIsMdi: boolean;
}

/**
 * BackendServer is a representation of the backend server.
 * 
 * port: The port the backend server is running on.
 * wss: The WebSocketServer instance.
 */
export interface BackendServer {
  port: number;
  wss: WebSocket.WebSocketServer;
}

type SenderType = 'BACKEND' | 'FRONTEND' | 'PLUGIN' | 'VEHICLE';

/**
 * A message sent over the WebSocket.
 * 
 * senderType: The type of the sender.
 * recipientType: The type of the recipient.
 * messageType: The type of the message.
 *  DO: A message that tells the recipient to do something.
 * RENDER: A message that tells the recipient (should be the frontend) to render something.
 * PING: A message that tells the recipient to send a PONG message back.
 *  nb: A client that receives a PING message should immediately send a PONG message back.
 * pluginRecipient: The ID of the plugin to send the message to. Only used if recipientType is PLUGIN.  
 * category: The category of the message. For instance, a RENDER message with a category "text" and a payload "Hello, world!"
 * payload: The payload of the message.
 * 
 */
export interface WebSocketMessage {
  senderType: SenderType;
  recipientType: SenderType
  messageType: 'DO' | 'RENDER' | 'PING' | 'UPLOAD' | 'ACK';
  pluginRecipient?: string;
  category?: string;
  payload: any;
}

export interface UIComponent {
  id: string;
  name?: string;
  icon?: string;
  iconIsMdi?: boolean;
  type: 'PANEL' | 'TEXT' | 'BUTTON' | 'INPUT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'MAP' | 'TABLE' | 'GRAPH' | 'OTHER';
}

export interface UIPanel extends UIComponent {
  type: 'PANEL';
  children: UIComponent[]; // Ordered list of children
}

export type FontWeight = 'normal' | 'bold' | 'bolder' | 'lighter' | 'initial' | 'inherit';
export interface UIText extends UIComponent {
  type: 'TEXT';
  text: string;
  fontSize?: number;
  color?: string;
  fontWeight?: FontWeight;
}

export interface UIButton extends UIComponent {
  type: 'BUTTON';
  text: string;
  onClick: () => void;
}

export interface UIInput extends UIComponent {
  type: 'INPUT';
  placeholder?: string;
  onChange: (value: string) => void;
}
