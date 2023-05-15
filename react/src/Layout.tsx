import Icon from "@mdi/react";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { Plugin, Task, getDaemonIsRunning, getRunningPlugins, getTaskQueue, removeTask, startDaemon, stopDaemon } from "./FCRLib-Daemon";
import { mdiFileTree, mdiHome, mdiLanConnect, mdiLanDisconnect, mdiMenu, mdiNetwork, mdiPyramid, mdiPyramidOff, mdiRocket, mdiSpaceInvaders, mdiToyBrick } from "@mdi/js";
import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Button, Card, CardBody, ChakraProvider, Circle, Divider, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormLabel, Grid, HStack, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Spacer, Spinner, Stack, Switch, VStack, useDisclosure } from "@chakra-ui/react";
import { Socket, io } from "socket.io-client";
import { AppContext, WebSocketMessage, websocketClient } from "./App";
export interface Vehicle {
  ip: string;
  port: number;
  connected: boolean;
}

let socket: Socket | null = null;

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

  const [goState, setGoState] = useState(false);
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

            <GoNoGoModal onGoStateChanged={(goState) => setGoState(goState)} />

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

function GoNoGoModal({ onGoStateChanged }: { onGoStateChanged: (goState: boolean) => void }) {
  const SAMPLE_VEHICLE: Vehicle = {
    ip: "SIMULATION",
    port: 9999,
    connected: true,
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { socket, setSocket } = useContext(AppContext);

  const [goState, setGoState] = useState(false);
  const [vehicleConnected, setVehicleConnected] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [fcrConnected, setFcrConnected] = useState(false);
  
  const [vehicleIp, setVehicleIp] = useState('');
  const [vehiclePort, setVehiclePort] = useState(5000);
  const [scanDetectedVehicles, setScanDetectedVehicles] = useState<Vehicle[]>([SAMPLE_VEHICLE]);
  const [connectedVehicle, setConnectedVehicle] = useState<Vehicle | null>(null);
  
  const [backendIp, setBackendIp] = useState('127.0.0.1');
  const [backendPort, setBackendPort] = useState(3000);
  const [backendConnecting, setBackendConnecting] = useState(false);

  const [fcrConnectionBypass, setFcrConnectionBypass] = useState(false);

  async function connectToBackend() {
    setBackendConnecting(true);

    const ws = new WebSocket(`ws://${backendIp}:${backendPort}`);

    ws.onclose = () => {
      setBackendConnected(false);
      setBackendConnecting(false);
    }

    ws.onerror = (ev: Event) => {
      console.error(ev);
      setBackendConnected(false);
      setBackendConnecting(false);
    }

    ws.onmessage = (ev: MessageEvent<WebSocketMessage>) => {
      const message = JSON.parse(ev.data as any) as WebSocketMessage;

      console.log(message);

      if (message.payload === 'PONG') {
        setBackendConnected(true);
        setBackendConnecting(false);
      }

      // websocketClient(ev, );
    }

    ws.onopen = () => {
      const ping: WebSocketMessage = {
        senderType: 'FRONTEND',
        recipientType: 'BACKEND',
        messageType: 'PING',
        payload: 'PING'
      }

      ws.send(JSON.stringify(ping));
    }

    setSocket(ws);
  }

  function disconnectFromBackend() {
    if (socket) socket.close();
    setSocket(null);
    setBackendConnected(false);
  }

  useEffect(() => {
    onGoStateChanged(goState)
  }, [goState]);

  useEffect(() => {
    const connected = connectedVehicle !== null;
    setVehicleConnected(connected);
  }, [connectedVehicle])

  useEffect(() => {
    if (vehicleConnected && backendConnected && (fcrConnected || fcrConnectionBypass)) setGoState(true);
    else setGoState(false);
  }, [vehicleConnected, backendConnected, fcrConnected])

  useEffect(() => {
    // For now, just assume we can connect to fcr.com if the device is online
    // TODO: Make sure we can send data to fogcityrocketry.com
    window.addEventListener('online', () => setFcrConnected(true));
    window.addEventListener('offline', () => setFcrConnected(false));
    setFcrConnected(window.navigator.onLine);

    // Clear interval and remove event listeners on unmount
    return () => {
      window.removeEventListener('online', () => setBackendConnected(true));
      window.removeEventListener('offline', () => setBackendConnected(false));
    }
  }, []);

  return (
    <>
      <Button onClick={onOpen} variant="outline">
        {
          goState ?
          <>
            <Icon path={mdiPyramid} size={1} color="#22c55e" />
            <span className="text-green-500 ml-2 tracking-widest">GO</span>
          </>
          :
          <>
            <Icon path={mdiPyramidOff} size={1} color="#ef4444" />
            <span className="text-red-500 ml-2 tracking-widest">NO GO</span>
          </>
        }
      </Button>
      <Modal isOpen={isOpen} onClose={onClose} size="6xl">
        <ModalOverlay />
        <ModalContent>
          {/* Global go/no go */}
          <ModalHeader>Go/No Go Status</ModalHeader>
          <ModalCloseButton />

          <ModalBody>
            <span className="flex items-center text-2xl font-bold">
              The vehicle is currently&nbsp;<span className={goState ? "text-green-500" : "text-red-500"}>{goState ? "Go" : "No Go"}</span>&nbsp;for launch.
            </span>
            Nb. This only represents the state of the ground station, not the vehicle, launch site, or weather.
            
            <Divider className="mt-4 mb-4" />

            {/* Vehicle Connection */}
            <span className="text-lg font-semibold mb-2">
              Connection to vehicle:&nbsp;<span className={vehicleConnected ? "text-green-500" : "text-red-500"}>{vehicleConnected ? "GO" : "NO GO"}</span>
            </span>


            {/* Connected Vehicle */}

            <div className="text-lg font-semibold mb-2 flex items-center justify-center">
              Connected vehicle:&nbsp;
            </div>
            <HStack>
              <Spacer />
                {connectedVehicle ?
                  <Card w="lg" bg="#26547C">
                    <CardBody className='flex items-center justify-center'>
                      <Stack direction="row">
                        <Circle bg="#231161" p="1.5" size={20}>
                          <Icon path={mdiRocket} size={1} color="#C99700" />
                        </Circle>
                        <Divider orientation="vertical"/>
                        <VStack>
                          <span className="text-white text-md mb-2">
                            IP: {connectedVehicle.ip}:{connectedVehicle.port}
                          </span>
                          <Button colorScheme="red" onClick={() => setConnectedVehicle(null)}>Disconnect</Button>
                        </VStack>
                      </Stack>
                    </CardBody>
                  </Card>
                : <>Not Connected</>}
              <Spacer />
            </HStack>

            {/* List of detected vehicles */}
            <div className="flex flex-col items-center justify-center mb-5">
              <span className="text-xl font-bold mr-4">
                Detected vehicles:
              </span>
              <div className="flex items-center justify-center mb-5">
                Scanning...
                <Spinner className="ml-2" />
              </div>
              <VStack>
                {scanDetectedVehicles.map((vehicle, index) => {
                  return (
                    <Box key={index} w="xl" p="1.5" rounded="xl" bg="#26547C" className="flex items-center">
                      <Spacer />
                      <Circle bg="#231161" p="1.5">
                        <Icon path={mdiRocket} size={1} color="#C99700" />
                      </Circle>
                      <span className="text-white m-1.5">{vehicle.ip}:{vehicle.port}</span>
                      <Button colorScheme="blue" onClick={() => { setVehicleConnected(true); setConnectedVehicle(vehicle) }}>Connect</Button>
                      <Spacer />
                    </Box>
                  )
                })}
              </VStack>
            </div>

            <HStack>
              <Spacer />
              <Icon path={mdiRocket} size={1} />
              <Input w="md" placeholder="Vehicle IP Address" onChange={(e) => { setVehicleIp(e.target.value); e.preventDefault(); }}/>
              <Input 
                w="6xs" placeholder="Port" 
                type="number"
                onChange={(e) => { 
                  if (isNaN(parseInt(e.target.value))) return;
                  setVehiclePort(parseInt(e.target.value)); 
                  e.preventDefault(); 
                }} 
                value={vehiclePort} />
              <Button colorScheme="blue">Connect</Button>
              <Spacer />
            </HStack>

            <Divider className="mt-4 mb-4" />

            {/* Backend Connection */}
            <span className="text-lg font-semibold mb-2">
              Connection to backend:&nbsp;<span className={backendConnected ? "text-green-500" : "text-red-500"}>{backendConnected ? "GO" : "NO GO"}</span>
            </span>

            <div className="flex items-center justify-center mb-5">
              {backendConnected ? `Connected to backend at ${backendIp}:${backendPort}` : `Disconnected from backend. Make sure it is running and that the port is correct.`}
            </div>

            <HStack>
              <Spacer />
              <Icon path={mdiNetwork} size={1} />
              
              <Input 
                w="md"
                placeholder="Backend IP Address"
                disabled={backendConnected}
                value={backendIp}
                onChange={(e) => { setBackendIp(e.target.value); e.preventDefault(); }}
                />
              
              <Input 
                w="6xs" placeholder="Port" 
                type="number"
                disabled={backendConnected}
                value={backendPort}
                onChange={(e) => { 
                  if (isNaN(parseInt(e.target.value))) return;
                  setBackendPort(parseInt(e.target.value));
                  e.preventDefault(); 
                }} 
              />
              {backendConnected ? 
              <Button colorScheme="red" isLoading={backendConnecting} onClick={disconnectFromBackend}>Disconnect</Button>
              :
              <Button colorScheme="blue" isLoading={backendConnecting} onClick={connectToBackend}>Connect</Button>
              }
              <Spacer />
            </HStack>

            <Divider className="mt-4 mb-4" />

            {/* fogcityrocketry.com connection */}
            <span className="text-lg font-semibold mb-2">
              Connection to fogcityrocketry.com:&nbsp;
              <span className={fcrConnected ? "text-green-500" : fcrConnectionBypass ? "text-gray-500" : "text-red-500"}>
                {fcrConnected ? 
                  "GO" : fcrConnectionBypass ? "BYPASSED" : "NO GO"}
              </span>
            </span>
            <FormControl display='flex' alignItems='center'>
              <FormLabel htmlFor='fcrBypassSwitch' mb='0'>
                Bypass
              </FormLabel>
              <Switch id='fcrBypassSwitch' isChecked={fcrConnectionBypass} onChange={(e) => setFcrConnectionBypass(e.target.checked)} />
            </FormControl>

            <Divider className="mt-4 mb-4" />

            {/* Daemon Status */}
            <span className="text-lg font-semibold mb-2">
              Daemon Status:&nbsp;<span className={fcrConnected ? "text-green-500" : "text-red-500"}>{fcrConnected ? "GO" : "NO GO"}</span>
            </span>

            <Divider className="mt-4 mb-4" />

            {/* Weather */}
            <span className="text-lg font-semibold mb-2">
              Weather
            </span>

            <span className="flex items-center justify-center">
              Click on a location to view the weather forecast. 
            </span>

            {/* Windy.com wind/pressure map and weather forecast */}
            <HStack>
              <Spacer />
              <iframe width="650" height="450" src="https://embed.windy.com/embed2.html?lat=34.561&lon=-119.795&detailLat=37.751&detailLon=-97.822&width=650&height=450&zoom=5&level=surface&overlay=wind&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=true&type=map&location=coordinates&detail=true&metricWind=default&metricTemp=default&radarRange=-1"></iframe>
              <Spacer />
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

    // Sort tasks by priority
    localTasks.sort((a, b) => {
      if (a.priority > b.priority) return 1;
      if (a.priority < b.priority) return -1;
      return 0;
    });

    // Sort plugins alphabetically
    localPlugins.sort((a, b) => {
      if (a.name > b.name) return 1;
      if (a.name < b.name) return -1;
      return 0;
    })

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
        {plugins.map((plugin, index) => {
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
              <span className="flex items-center text-xl font-bold mr-4">
                Listening for tasks...
                <Spinner className="ml-2" />
              </span>
              <TaskList />
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
