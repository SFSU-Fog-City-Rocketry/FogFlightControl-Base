import tcpPortUsed from 'tcp-port-used'
import process from 'process';
import chalk from 'chalk';
import fs from 'fs';
import * as WebSocket from 'ws';

// Check if PORT is already in use. If so, recursively check the next port until a free one is found.
async function checkPort(port: number): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    console.log(`Attempting to start server on port ${port}`);
    tcpPortUsed.check(port, '127.0.0.1')
    .then((inUse) => {
      if (inUse) {
        console.log(`Port ${port} is already in use. Checking next port...`);
        resolve(checkPort(port + 1));
      } else {
        resolve(port);
      }
    },
    (err) => {
      reject(err);
    })
    .catch((err) => {
      reject(err);
    });
  });
}

let portRequested = 3000;

process.argv.forEach((val, index) => {
  // If -p <port> is specified, use that port instead of 3000.
  if (val === "-p") {
    if (process.argv.length <= index + 1) {
      console.error(`${chalk.redBright('Error:')} No port specified after -p. Exiting...`);
      process.exit(1);
    }

    const portArg = process.argv[index + 1];
    if (isNaN(portArg as any) || !Number.isInteger(Number(portArg))) {
      console.error(`${chalk.redBright('Error:')} Invalid port specified after -p: ${portArg}. Exiting...`);
      process.exit(1);
    }
    
    portRequested = parseInt(portArg);
  }

  // If -h is specified, print help and exit.
  if (val === "-h") {
    console.log(`
    FOG FLIGHT CONTROL - BACKEND 🚀
    Built by Fog City Rocketry at ${(chalk.yellowBright('San Francisco State University'))}.

    Usage: npm run start -- [-p <port>] [-h]
    Example: npm run start -- -p 3000

    Yes, you do need to to include the two hyphens (--) before the arguments.

    -p <port>   Specify port to run server on. Default is 3000.
    -h          Print help and exit.
    `);
    process.exit(0);
  }
});

const PORT = await checkPort(portRequested);
const server = new WebSocket.WebSocketServer({ port: PORT });
const timestamp = () => chalk.bgBlueBright((new Date()).toLocaleString());

type SenderType = 'BACKEND' | 'FRONTEND' | 'PLUGIN' | 'VEHICLE';

interface WebSocketMessage {
  senderType: SenderType;
  recipientType: SenderType
  messageType: 'DO' | 'RENDER' | 'PING' | 'UPLOAD' | 'ACK';
  pluginRecipient?: string;
  category?: string; // For instance, a render message with a category "text" and a payload "Hello, world!"
  payload: any;
}

server.on('connection', (ws: WebSocket) => {

  ws.onmessage = async (message: MessageEvent<WebSocketMessage>) => {
    const data = JSON.parse(message.data as any) as WebSocketMessage;
    // const formattedInput = all of the message except payload
    const formattedInput = JSON.stringify({
      senderType: data.senderType,
      recipientType: data.recipientType,
      messageType: data.messageType,
      pluginRecipient: data.pluginRecipient,
      category: data.category,
      payload: typeof data.payload
    });

    console.log(`📥 ${timestamp()} received: ${chalk.green(formattedInput)}`);

    function ack() {
      // Respond with an ACK message
      const ackMsg: WebSocketMessage = {
        senderType: 'BACKEND',
        recipientType: 'FRONTEND',
        messageType: 'ACK',
        payload: 'ACK'
      };

      console.log(`📤 ${timestamp()} sending ACK message to ${chalk.green(data.senderType)}`);
      ws.send(JSON.stringify(ackMsg));
    }

    switch (data.messageType) {
      case 'DO':
        console.log(`📥 ${timestamp()} received DO message from ${chalk.green(data.senderType)}`);
        break;
      case 'RENDER':
        console.log(`📥 ${timestamp()} received RENDER message from ${chalk.green(data.senderType)}`);
        break;
      case 'PING':
        console.log(`📤 ${timestamp()} received PING message from ${chalk.green(data.senderType)}`);
        // Respond with a PONG message
        const pong: WebSocketMessage = {
          senderType: 'BACKEND',
          recipientType: 'FRONTEND',
          messageType: 'PING',
          payload: 'PONG'
        };

        console.log(`📤 ${timestamp()} sending PONG message to ${chalk.green(data.senderType)}`);
        ws.send(JSON.stringify(pong));

        break;
      case 'UPLOAD':
        console.log(`📥 ${timestamp()} received UPLOAD message from ${chalk.green(data.senderType)}`);
        const buf = new Uint8Array(data.payload).buffer;
        const dv = new DataView(buf);

        // If the payload is an arraybuffer, save it to a file
        
        const base64Data = data.payload.toString('base64');
        
        try {
        await fs.promises.writeFile('./plugins-dir/Plugin.zip', base64Data, 'base64');
          console.log(`📁 ${chalk.greenBright('File saved:')}`, './plugins-dir/Plugin.zip');
        } catch (err) {
          console.error(`⛔️ ${chalk.redBright('Error saving file:')}`, err);
        }
        
        ack();
          
        break;
      default:
        console.error(`⛔️ ${timestamp()} received invalid message type from ${chalk.red(data.senderType)}`);
        break;
    }

    console.log(); // newline
  }

  ws.onerror = (error: Event) => {
    console.error(`⛔️ ${timestamp()} WebSocket error: ${error}\n`);
  };

  ws.onclose = (event: CloseEvent) => {
    console.log(`😴 ${timestamp()} WebSocket closed: ${event.code} ${event.reason}\n`);
  }
});

// Create ./plugins-dir if it doesn't exist
if (!fs.existsSync('./plugins-dir')) {
  fs.mkdirSync('./plugins-dir');
}

console.log(`${chalk.greenBright(`\n\n🚀 ${timestamp()} FogFlightControl Backend listening at ws://localhost:${PORT}`)}\n\n\n`)
