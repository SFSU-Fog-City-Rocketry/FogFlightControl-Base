import './Tailwind.css';
import Home from './pages/Home';
import { Context, createContext, useContext, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './Layout';
import PluginManagement from './pages/PluginManagement';

interface AppContext {
  socket: WebSocket | null;
  setSocket: (socket: WebSocket | null) => void;
}

export const AppContext = createContext<AppContext>({
  socket: null,
  setSocket: () => {},
  
});

type SenderType = 'BACKEND' | 'FRONTEND' | 'PLUGIN' | 'VEHICLE';

export interface WebSocketMessage {
  senderType: SenderType;
  recipientType: SenderType
  messageType: 'DO' | 'RENDER' | 'PING' | 'UPLOAD' | 'ACK';
  pluginRecipient?: string;
  category?: string; // For instance, a render message with a category "text" and a payload "Hello, world!"
  payload: any;
}

/**
 * Sends a message to the backend.
 * @param message Message to be sent. Make sure to mark the senderType as FRONTEND.
 * @param expectAck Whether or not to expect an ACK message in response. Defaults to false.
 * @param ackTimeoutMs How long to wait for an ACK message before rejecting the promise. Defaults to 5000ms.
 * @returns 
 */
export async function sendMessage(message: WebSocketMessage, context: AppContext, expectAck = false, ackTimeoutMs = 5000): Promise<boolean | null> {
  const { socket } = context;

  if (!socket) {
    console.error('No connection to backend!');
    return null;
  }

  if (socket) {
    socket.send(JSON.stringify(message));
  }

  if (!expectAck) return null;

  // Add an event listener and resolve on ack, reject on timeout. Then remove the event listener.
  return new Promise((resolve, reject) => {
    const ackListener = (event: MessageEvent) => {
      const ack: WebSocketMessage = JSON.parse(event.data);
      if (ack.messageType === 'ACK') {
        resolve(true);
      }
    }

    socket.addEventListener('message', ackListener);

    setTimeout(() => {
      socket.removeEventListener('message', ackListener);
      reject(false);
    }, ackTimeoutMs);
  })
}

export async function websocketClient(message: MessageEvent<WebSocketMessage>, context: AppContext) {
  const { data } = message;
  console.log(data);
}

function App() {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  const appContext = {
    socket,
    setSocket,
  }

  return (
    <AppContext.Provider value={appContext}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="plugin-management" element={<PluginManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}

export default App
