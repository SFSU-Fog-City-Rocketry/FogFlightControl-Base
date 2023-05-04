import Icon from "@mdi/react";
import { useState } from "react";
import { Plugin } from "../FCRLib-Daemon";
import { mdiBattery, mdiDownload, mdiRocketLaunch } from "@mdi/js";
import { Button, Divider, FormControl, FormHelperText, FormLabel, Heading, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, useDisclosure } from "@chakra-ui/react";



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
              <FormLabel>Plugin Repository</FormLabel>
              <Input type="text" value="https://plugins.fogcityrocketry.com" />
              <FormHelperText>This should usually be left as the default value.</FormHelperText>
            </FormControl>

            <FormControl>
              <FormLabel>Plugin Name</FormLabel>
              <Input type="text" placeholder="RocketControl" />
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="outline" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="blue">Download</Button>

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
