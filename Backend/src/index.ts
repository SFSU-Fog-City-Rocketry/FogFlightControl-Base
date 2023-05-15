import fs from 'fs';
import toml from 'toml';
import chalk from 'chalk';
import process from 'process';
import unzipper from 'unzipper';
import exec from 'child_process';
import tcpPortUsed from 'tcp-port-used'
import * as WebSocket from 'ws';
import { generateUUUID } from './FCRLib-Daemon.js';
import { ManifestFile, WebSocketMessage } from './types.js';

// Utility functions ---------------------------------------------

const timestamp = () => chalk.bgBlueBright((new Date()).toLocaleString());

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

function isBase64Zip(base64String: string): boolean {
  const bytecharacters = Buffer.from(base64String, 'base64');
  const byteNumbers = new Array(bytecharacters.length);
  for (let i = 0; i < bytecharacters.length; i++) {
    byteNumbers[i] = bytecharacters[i];
  }

  const byteArray = new Uint8Array(byteNumbers);

  // Check if the first two bytes are PK (the magic number for ZIP files)
  if (byteArray[0] === 80 && byteArray[1] === 75) {
    return true;
  }

  return false;
}

async function handlePluginUpload(base64Data: string) {

  async function validatePlugin(path: string): Promise<ManifestFile | undefined> {
    // path points to the path of the extracted plugin
    const tomlPath = `${path}/manifest.toml`;
  
    const data = toml.parse(await fs.promises.readFile(tomlPath, 'utf-8'));
  
    // Check to see if you can parse as ManifestFile
    if (!data) {
      console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} manifest.toml is not valid TOML. Can't load.`);
      return;
    }
  
    // Check for required fields
    if (!data.metadata || !data.main) {
      console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} manifest.toml is missing required fields. Can't load.`);
      return;
    }
  
    // Check for required fields in metadata
    if (!data.metadata.name || !data.metadata.id || !data.metadata.version || !data.metadata.description || !data.metadata.authors) {
      console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} manifest.toml is missing required fields in metadata. Can't load.`);
      return;
    }
  
    // Check for required fields in main
    if (!data.main.entrypoint) {
      console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} manifest.toml is missing required fields in main. Can't load.`);
      return;
    }
  
    // Check for valid entrypoint
    if (!fs.existsSync(`${path}/${data.main.entrypoint}`)) {
      console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} manifest.toml contains invalid entrypoint. Can't load.`);
      return;
    }
  
    // TODO: Check for valid dependencies
  
    const manifestFile: ManifestFile = {
      metadata: {
        name: data.metadata.name,
        id: data.metadata.id,
        version: data.metadata.version,
        description: data.metadata.description,
        authors: data.metadata.authors
      },
      main: {
        entrypoint: data.main.entrypoint,
        dependencies: data.main.dependencies,
        pages: data.main.pages
      }
    }
  
    return manifestFile;
  }


  try {
    const pluginUUID = generateUUUID();
    const zipFilename = `./plugins-dir/${pluginUUID}.zip`;

    await fs.promises.writeFile(zipFilename, base64Data, 'base64');

    console.log(`📁 ${chalk.greenBright('File saved:')}`, zipFilename);

    const extensionPath = `./plugins-dir/${pluginUUID}`;
    
    if (!fs.existsSync(extensionPath)) {
      fs.mkdirSync(extensionPath);
    }
  
    // Extract the ZIP file and start the plugin
    fs.createReadStream(zipFilename)
      .pipe(unzipper.Extract({ path: extensionPath }))
      .on('close', async () => {
        const manifestFile = await validatePlugin(`./plugins-dir/${pluginUUID}`);

        if (!manifestFile) {
          console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} Plugin failed validation. Deleting...`);
          fs.rmSync(zipFilename, { recursive: true });
          fs.rmdirSync(`./plugins-dir/${pluginUUID}`, { recursive: true });
          return;
        }
        
        if (debugLogging) {
          console.log(`🧩 ${chalk.greenBright('Plugin validated:')}`, `./plugins-dir/${pluginUUID}`);
          console.log(`🧩 ${chalk.greenBright('Plugin metadata:')}`, manifestFile.metadata);
        }
        
        // Start the plugin
        const child = exec.spawn('node', [`${manifestFile.main.entrypoint}`], {
          cwd: `./plugins-dir/${pluginUUID}`,
          detached: true,
          stdio: pluginStdio
        });

        childProcesses.push(child);

        console.log(`🧩 ${chalk.greenBright('Plugin started:')} ${chalk.blueBright(manifestFile.metadata.name)} at ./plugins-dir/${pluginUUID}`);

        child.on('error', (err) => {
          console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} Plugin failed to start:`, err);
        });

        child.on('exit', (code, signal) => {
          console.log(`🧩 ${chalk.greenBright('Plugin exited:')}`, `./plugins-dir/${pluginUUID}`);
          if (debugLogging) {
            console.log(`🧩 ${chalk.greenBright('Plugin exit code:')}`, code);
            console.log(`🧩 ${chalk.greenBright('Plugin exit signal:')}`, signal);
          }

          if (code !== 0) {
            console.error(`⛔️ ${timestamp()} ${chalk.redBright('Error:')} Plugin exited with non-zero exit code: ${code}`);
          }
        });
      });
      
  } catch (err) {
    console.error(`⛔️ ${chalk.redBright('Error:')}`, err);
  }
}

function handleRenderRequest(category: string, payload: any) {
  switch (category) {
    case 'text':
      console.log(`📤 ${timestamp()} sending RENDER message to ${chalk.green('FRONTEND')}`);
      break;
    case 'image':
      console.log(`📤 ${timestamp()} sending RENDER message to ${chalk.green('FRONTEND')}`);
      break;
    case 'video':
      console.log(`📤 ${timestamp()} sending RENDER message to ${chalk.green('FRONTEND')}`);
      break;
    case 'audio':
      console.log(`📤 ${timestamp()} sending RENDER message to ${chalk.green('FRONTEND')}`);
      break;
    default:
      console.error(`⛔️ ${timestamp()} received RENDER message with invalid category: ${chalk.red(category)}`);
      break;
  }
}

// Startup -------------------------------------------------------

let portRequested = 3000;
let cleanPluginsDir = false;
let childProcesses: exec.ChildProcess[] = [];
let debugLogging = false;
let pluginSilence = false;

process.argv.forEach((val, index) => {
  switch (val) {
    case '-p':
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
      break;
    case '-c':
      cleanPluginsDir = true;

      // Clear plugins directory
      if (fs.existsSync('./plugins-dir')) {
        fs.rmdirSync('./plugins-dir', { recursive: true });
      }
      break;
    case '-d':
      debugLogging = true;
      break;
    case '-s':
      pluginSilence = true;
      break;
    case '-h':
      console.log(`
      FOG FLIGHT CONTROL - BACKEND 🚀
      Built by Fog City Rocketry at ${(chalk.yellowBright('San Francisco State University'))}.
    
      Usage: npm run start -- [-p <port>] [-h]
      Example: npm run start -- -p 3000
    
      Yes, you do need to to include the two hyphens (--) before the arguments.
    
      -p <port>   Specify port to run server on. Default is 3000.
      -c          Clean plugins directory on startup and shutdown.
      -d          Enable additional debug logging.
      -s          Silence plugin output
      -h          Print help and exit.
      `);
      process.exit(0);
  }
});

const PORT = await checkPort(portRequested);
const server = new WebSocket.WebSocketServer({ port: PORT });
const pluginStdio: exec.StdioOptions = pluginSilence ? 'ignore' : 'inherit';

type SenderType = 'BACKEND' | 'FRONTEND' | 'PLUGIN' | 'VEHICLE';

// Server --------------------------------------------------------

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

    function ack(payload = 'ACK') {
      // Respond with an ACK message
      const ackMsg: WebSocketMessage = {
        senderType: 'BACKEND',
        recipientType: data.senderType,
        messageType: 'ACK',
        payload: payload
      };

      console.log(`📤 ${timestamp()} sending ACK message to ${chalk.green(data.senderType)}`);
      ws.send(JSON.stringify(ackMsg));
    }

    switch (data.messageType) {
      case 'DO':
        console.log(`📥 ${timestamp()} received DO message from ${chalk.green(data.senderType)}`);
        break;
      case 'RENDER':
        if (!data.category) {
          console.error(`⛔️ ${timestamp()} received RENDER message with no category from ${chalk.red(data.senderType)}`);
          break;
        }

        handleRenderRequest(data.category, data.payload);
        
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
        if (data.category !== 'upload-plugin') {
          console.error(`⛔️ ${timestamp()} received UPLOAD message with invalid category: ${chalk.red(data.category)}`);
          break;
        }
        
        const base64Data = data.payload.toString('base64');

        if (!isBase64Zip(base64Data)) {
          console.error(`⛔️ ${timestamp()} received UPLOAD message with invalid payload: ${chalk.red('not a ZIP file')}`);
          break;
        }
        
        await handlePluginUpload(base64Data);
        
        ack();
          
        break;
      case 'ACK':
        console.log(`📥 ${timestamp()} received ACK message from ${chalk.green(data.senderType)}`);
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

// Startup and shutdown -------------------------------------------

// Create ./plugins-dir if it doesn't exist
if (!fs.existsSync('./plugins-dir')) {
  fs.mkdirSync('./plugins-dir');
}

console.log(`${chalk.greenBright(`\n\n🚀 ${timestamp()} FogFlightControl Backend listening at ws://localhost:${PORT}`)}\n\n\n`)

// Graceful shutdown
let sigintTried = false;

process.on('SIGINT', () => {
  if (sigintTried) {
    process.exit(1);
  }

  sigintTried = true;

  console.log(`\n\n${chalk.yellowBright(`🛑 ${timestamp()} FogFlightControl Backend shutting down...`)}`)
  console.log('Press Ctrl+C again to force quit.');
  console.log(`${chalk.yellowBright(`🛑 ${timestamp()} Closing WebSocket server...`)}`);
  server.close();
  console.log(`${chalk.yellowBright(`🛑 ${timestamp()} WebSocket server closed.`)}`);

  // Exit all child processes
  console.log(`${chalk.yellowBright(`🛑 ${timestamp()} Killing plugins...`)}`);
  childProcesses.forEach((child) => {
    child.kill();
  });

  if (cleanPluginsDir) {
    console.log(`${chalk.yellowBright(`🛑 ${timestamp()} `)} Deleting plugins directory`);
    fs.rmdirSync('./plugins-dir', { recursive: true });
    console.log(`${chalk.yellowBright(`🛑 ${timestamp()} `)} Plugins directory deleted.`);
  }
  process.exit(0);
});
