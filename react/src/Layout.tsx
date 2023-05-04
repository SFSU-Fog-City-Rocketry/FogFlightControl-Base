import Icon from "@mdi/react";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, ChakraProvider, Divider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, Grid, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Spacer, Spinner, VStack, useDisclosure } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { mdiFileTree, mdiHome, mdiLanConnect, mdiLanDisconnect, mdiMenu, mdiNetwork, mdiSpaceInvaders, mdiToyBrick } from "@mdi/js";
import { Plugin, Task, getDaemonIsRunning, getRunningPlugins, getTaskQueue, removeTask, startDaemon, stopDaemon } from "./FCRLib-Daemon";

const customChakraTheme = {
  // TODO: implement maybe. Worst case you can just reference these in the color prop of a component.
  colors: {
    Button: {
      variants: {
        sfsu_white: {
          bg: "#231161",
          color: "white",
        },
        sfsu_gold: {
          bg: "#231161",
          color: "#C99700",
        }
      }
    }
  }
}

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

            <TaskManagerModal />

            <FlightControlModal />

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

function FlightControlModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      <Button onClick={onOpen} color="#C99700" variant="outline">
        <Icon path={mdiSpaceInvaders} size={1} />
        <span className="ml-2 max-sm:hidden">Flight Control</span>
      </Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Flight Control</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {/* Arrange 4*2 buttons, flex wrap */}
            <Grid templateColumns="repeat(4, 1fr)" gap={6}>
            {/* <div className="grid grid-cols-4"> */}
              <Button colorScheme="red">Master Alarm</Button>
              <Button colorScheme="red">Engine Alarm</Button>
              <Button colorScheme="red">Battery Alarm</Button>
              <Button colorScheme="red">Fuel Alarm</Button>

              <Button colorScheme="blue">Arm</Button>
              <Button colorScheme="blue">Disarm</Button>
              <Button colorScheme="blue">Launch</Button>
              <Button colorScheme="blue">Abort</Button>
              <Button colorScheme="blue">Deploy</Button>
              <Button colorScheme="blue">Retract</Button>
              <Button colorScheme="blue">Ignite</Button>
              <Button colorScheme="blue">Shutdown</Button>
            </Grid>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

function arrayEquals(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, index) => val === b[index]);
}

function TaskManagerModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [daemonRunning, setDaemonRunning] = useState(false);
  const [searchInterval, setSearchInterval] = useState<number | null>(null);

  // These references are used to compare the previous state to the current state for the rerenders function
  const prevTasksRef = useRef<Task[]>([]);
  const prevPluginsRef = useRef<Plugin[]>([]);
  const prevDaemonRunningRef = useRef<boolean>(false);

  function rerenders() {
    // Local as in local to this interval
    const localTasks = getTaskQueue();
    const localPlugins = getRunningPlugins();
    const localDaemonRunning = getDaemonIsRunning();

    const tasksChanged = !arrayEquals(localTasks, prevTasksRef.current);
    const pluginsChanged = !arrayEquals(localPlugins, prevPluginsRef.current);
    const daemonRunningChanged = localDaemonRunning != prevDaemonRunningRef.current;

    prevTasksRef.current = localTasks;
    prevPluginsRef.current = localPlugins;
    prevDaemonRunningRef.current = localDaemonRunning;

    // Call setState functions only if state has changed
    if (tasksChanged) setTasks(localTasks);
    if (pluginsChanged) setPlugins(localPlugins);
    if (daemonRunningChanged) setDaemonRunning(localDaemonRunning);
  }

  useEffect(() => {
    if (!isOpen) {
      if (searchInterval) clearInterval(searchInterval);
      setTasks([]);
      setPlugins([]);
      return;
    }


    const interval = setInterval(rerenders, 1000);

    setSearchInterval(interval);
  }, [isOpen]);

  function DaemonRunning() {
    if (daemonRunning) return (
      <div className="flex items-center justify-center mb-5">
        <span className="text-xl font-bold mr-4">
          The daemon is currently&nbsp;<span className="text-green-500">running</span>.
        </span>
        <Button colorScheme="red" onClick={() => stopDaemon()} >Stop</Button>
      </div>
    )

    return (
      <div className="flex items-center justify-center mb-5">
        <span className="text-xl font-bold mr-4">
          The daemon is currently&nbsp;<span className="text-red-500">not running</span>.
        </span>
        <Button colorScheme="green" onClick={() => startDaemon()}>Start</Button>
      </div>
    )
  }

  function TaskList() {
    if (tasks.length === 0) return (
      <span className="text-xl font-bold mr-4">
        There are currently no tasks.
      </span>
    )

    return (
      <VStack>
        {plugins.map((plugin, index, array) => {
          return (
            <Accordion key={plugin.id}>
              <AccordionItem>
                <h2>
                  <AccordionButton>
                    <Box as="span" flex="1" textAlign="left">
                      {plugin.iconIsMdi ?
                        <Icon path={plugin.icon} size={1} className="mr-2" />
                        :
                        <img src={plugin.icon} alt={plugin.name} className="w-6 mr-2" />
                      }
                      {plugin.name}
                    </Box>
                  </AccordionButton>
                </h2>

                <AccordionPanel pb={4}>
                  {/* List all tasks that correspond to this plugin */}
                  {tasks.map((task) => {
                    if (task.plugin.id === plugin.id) {
                      return (
                        <>
                          <div key={task.id} className="flex items-center justify-between">
                            <span>{task.name}</span>
                            <span>{task.status}</span>
                            <span>Priority: {task.priority}</span>
                            <Button colorScheme="red" onClick={() => removeTask(task.id)}>Cancel</Button>
                          </div>
                          <Divider />
                        </>
                      )
                    }
                  })}
                </AccordionPanel>
                <AccordionIcon />
              </AccordionItem>
            </Accordion>
          )
        })}
      </VStack>
    )
  }

  return (
    <>
      <Button onClick={onOpen} color="#C99700" variant="outline">
        <Icon path={mdiFileTree} size={1} />
        <span className="ml-2 max-sm:hidden">Task Manager</span>
      </Button>
      <Modal isOpen={isOpen} size='full' onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader className="flex items-center"><Icon path={mdiFileTree} size={1} className="mr-2" /> Task Manager</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div className="flex flex-col items-center justify-center mb-5">
              <DaemonRunning />
              <TaskList />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
