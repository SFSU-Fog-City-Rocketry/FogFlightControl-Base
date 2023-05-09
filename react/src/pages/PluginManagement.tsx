import Icon from "@mdi/react";
import { useContext, useEffect, useRef, useState } from "react";
import { Plugin } from "../FCRLib-Daemon";
import { mdiBattery, mdiDownload, mdiRocketLaunch } from "@mdi/js";
import { Button, Divider, FormControl, FormHelperText, FormLabel, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Spinner, useDisclosure } from "@chakra-ui/react";
import { AppContext, WebSocketMessage, sendMessage } from "../App";



export default function PluginManagement() {
  const SAMPLE_PLUGINS: Plugin[] = [
    {
      name: 'Sample Plugin',
      id: 'sample-plugin',
      description: 'This is a sample plugin',
      version: '1.0.0',
      icon: mdiBattery,
      iconIsMdi: true,
    },
    {
      name: 'Sample Plugin 2',
      id: 'sample-plugin-2',
      description: 'This is a sample plugin',
      version: '1.0.0',
      icon: mdiRocketLaunch,
      iconIsMdi: true,
    }
  ]
  
  const [plugins, setPlugins] = useState<Plugin[]>(SAMPLE_PLUGINS);

  return (
    <div className="w-screen h-screen items-center justify-center ml-4 mt-4">
      <Heading>Installed plugins:</Heading>
      <ul>
        {plugins.map((plugin) => (
          <li key={plugin.name} className="mt-4 mb-4">
            <PluginModal plugin={plugin} />
          </li>
        ))}
      </ul>

      <Divider className="mt-4 mb-4" />

      <DownloadPluginModal />
    </div>

  )

}

function DownloadPluginModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const context = useContext(AppContext);

  const [pluginZip, setPluginZip] = useState<File | null>(null);
  const [pluginUploading, setPluginUploading] = useState(false);
  const [pluginUploadStatus, setPluginUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [pluginUploadMsg, setPluginUploadMsg] = useState('');
  // const uploadStatusRef = useRef<'idle' | 'uploading' | 'success' | 'error'>('idle');
  // const uploadMsg = useRef('');

  function handlePluginZipChange(event: React.ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      setPluginZip(event.target.files[0]);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      setPluginZip(null);
      setPluginUploadStatus('idle');
      setPluginUploadMsg('');
    };
  }, [isOpen]);

  async function readFile(): Promise<string> {
    if (!pluginZip) return '';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (reader.result) {
          const base64string = btoa(reader.result as string);
          resolve(base64string);
        }
      }

      reader.readAsBinaryString(pluginZip);
    });
  }

  /**
   * This function is somewhat of a misnomer - we are not actually downloading the plugin, but rather uploading it to the server.
   * Call this to initiate the upload process.
   */  
  async function handleDownload() {
    if (!pluginZip) return;

    setPluginUploadStatus('uploading');
    // setPluginUploading(true);
    // setPluginUploadSuccess(false);
    // setPluginUploadError(false);

    function fail(error: any) {
      console.error(error);
      setPluginUploadStatus('error');
      setPluginUploadMsg('Failed to read file');
      setTimeout(() => { 
        setPluginUploadStatus('idle');
        setPluginUploadMsg('');
      }, 5000);
    }

    const base64string = await readFile()
    .catch(fail);

    // const base64 = btoa(
    //   new Uint8Array(arrayBuffer).reduce(
    //     (data, byte) => data + String.fromCharCode(byte),
    //     '',
    //   ),
    // )

    // const view = new DataView(arrayBuffer);
    // const blob = new Blob([view], { type: 'application/zip' });
    // const base64 = await blob.text()

    const message: WebSocketMessage = {
      senderType: 'FRONTEND',
      recipientType: 'BACKEND',
      messageType: 'UPLOAD',
      category: 'upload-plugin',
      payload: base64string,
    }

    const success = await sendMessage(message, context, true)
    .catch(fail); 

    setPluginUploadStatus(success as boolean ? 'success' : 'error');
    setPluginUploadMsg(success as boolean ? 'Upload successful!' : 'Upload failed!');
    setTimeout(() => {
      setPluginUploadStatus('idle');
      setPluginUploadMsg('');
    }, 5000);
  }

  function UploadState() {
    if (pluginUploadStatus === 'idle') return null;

    switch (pluginUploadStatus) {
      case 'uploading':
        return (
          <div className="ml-2">
            <p>Uploading...</p>
            <Spinner />
          </div>
        )
      case 'success':
        return (
          <p className="text-green-500 ml-2">{pluginUploadMsg}</p>
        )
      case 'error':
        return (
          <p className="text-red-500 ml-2">{pluginUploadMsg}</p>
        )
    }
  }

  return (
    <>
      <Button onClick={onOpen} colorScheme="blue">
        <Icon path={mdiDownload} size={1} />
        Download Plugin
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Download Plugin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Plugin ZIP File</FormLabel>
              {/* <Input type="text" valute="https://plugins.fogcityrocketry.com" /> */}
              <Input type="file" accept=".zip" onChange={handlePluginZipChange}/>
              {/* <FormHelperText>This should usually be left as the default value.</FormHelperText> */}
            </FormControl>

            {/* <FormControl>
              <FormLabel>Plugin Name</FormLabel>
              <Input type="text" placeholder="RocketControl" />
            </FormControl> */}
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>Cancel</Button>
            {
              pluginZip &&
              <Button colorScheme="blue" onClick={handleDownload}>Download</Button>
            }

            <UploadState />

            {/* {
              pluginUploading &&
              <>
                <p>Uploading...</p>
                <Spinner />
              </>
            }

            {
              pluginUploadSuccess &&
              <p className="text-green-500">Upload successful!</p>
            }

            {
              pluginUploadError &&
              <p className="text-red-500">Upload failed!</p>
            } */}



          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

function PluginModal({ plugin }: { plugin: Plugin }) {
  const { isOpen, onOpen, onClose } = useDisclosure();

  function PluginLogo() {
    if (plugin.iconIsMdi) {
      return (
        <Icon path={plugin.icon} size={1} />
      )
    }

    return (
      <img src={plugin.icon} alt={plugin.name} className="w-14" />
    )
  }
  return (
    <>
      <Button onClick={onOpen} variant="outline">
        <PluginLogo />
        {plugin.name}
      </Button> 
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <div className="flex items-center">
              <PluginLogo />
              {plugin.name}
            </div>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <p>ID: {plugin.id}</p>
            <p>Version: {plugin.version}</p>
            <p>Description: {plugin.description}</p>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme="red" mr={3} onClick={onClose}>
              Delete
            </Button>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

    </>
  )
}
