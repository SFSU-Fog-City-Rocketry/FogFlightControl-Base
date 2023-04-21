import { Button, Heading, VStack } from "@chakra-ui/react";

export default function Home() {
  return  (
    <div className="w-screen h-screen flex items-center justify-center">  
      <VStack>
        <Heading as="h1" size="3xl">FogFlightControl</Heading>
        <Heading>v0.0.1</Heading>
        
        <span>A modular and extendable flight control system for drones, rockets, and other vehicles.</span>
        <Button>Launch</Button>
      </VStack>
    </div>
  )
}