import Icon from "@mdi/react";
import { Box, Button, ChakraProvider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Spacer, Spinner, useDisclosure } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { mdiHome, mdiLanConnect, mdiLanDisconnect, mdiMenu, mdiNetwork, mdiToyBrick } from "@mdi/js";

export default function Layout() {
  interface DrawerItems {
    name: string
    path: string
    icon: string
  };

  const DRAWERITEMS: DrawerItems[] = [
    { name: 'Home', path: '/', icon: mdiHome },
    { name: 'Plugin Management', path: '/plugin-management', icon: mdiToyBrick }
  ];

  const [windowSize, setWindowSize] = useState({
    width: Number.MAX_SAFE_INTEGER,
    height: Number.MAX_SAFE_INTEGER,
  });
  function handleResize() {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  const [connectionState, setConnectionState] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="layout">
      <ChakraProvider>
        <Box bg="#231161" w="100%" p={4} color="white">
          <HStack spacing={4}>
            <Button ref={btnRef} color="#C99700" variant="ghost" onClick={onOpen} >
              <Icon path={mdiMenu} size={1} />
            </Button>
            <Link to="/">
              <img src="/SFStateShield.png" alt="SF State Seal" className="w-14" />
            </Link>
            <Link to="/">
              FogFlightControl
            </Link>

            <Spacer />
            <ConnectionModal isConnected={connectionState}/>
          </HStack>
        </Box>

        <Drawer
          isOpen={isOpen}
          placement="left"
          onClose={onClose}
          finalFocusRef={btnRef}
        >
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton/>
            <DrawerHeader>
              Menu
            </DrawerHeader>

            <DrawerBody>
              {DRAWERITEMS.map((item, index) => {
                return (
                  <Link to={item.path} key={index}>
                    <Button variant="ghost" w="100%" justifyContent="flex-start" onClick={onClose}>
                      <Icon path={item.icon} size={1} />
                      <span className="ml-2">{item.name}</span>
                    </Button>
                  </Link>
                )
              })}
            </DrawerBody>

            <DrawerFooter>
              <Button variant="outline" mr={3} onClick={onClose}>
                Cancel
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Outlet />
        <Box bg="#231161" w="100%" p={4} color="white">
          <HStack spacing={4}>
            <span className="font-light">© 2023 Fog City Rocketry</span>
            <Spacer />
            <span className="font-light">Version 0.0.1</span>
          </HStack>
        </Box>
      </ChakraProvider>
    </div>
  )
}

function ConnectionModal({ isConnected }: { isConnected: boolean }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button onClick={onOpen} variant="outline">
        {
          isConnected ?
          <>
            <Icon path={mdiLanConnect} size={1} color="#22c55e" />
            <span className="text-green-500 ml-2">Connected</span>
          </>
          :
          <>
            <Icon path={mdiLanDisconnect} size={1} color="#ef4444" />
            <span className="text-red-500 ml-2">Disconnected</span>
          </>
        }
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Connect</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <div className="flex items-center justify-center mb-5">
              Searching...
              <Spinner className="ml-2" />
            </div>

            <HStack>
              <Icon path={mdiNetwork} size={1} />
              <Input placeholder="IP Address" />
              <Button colorScheme="blue">Connect</Button>
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
