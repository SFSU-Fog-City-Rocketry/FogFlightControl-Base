# FogFlightControl-Base

This repo represents the base of the code that will run on the user's machine (ie a laptop) when running the flight control system. For the onboard code, see [FogFlightControl-Arduino](https://github.com/SFSU-Fog-City-Rocketry/FogFlightControl-Arduino). This repo will include the following:

- A frontend and backend for the flight control system.
- An API for plugins that will allow them to:
  - Read telemetry from the rocket.
  - Send commands to the rocket.
  - Render output to frontend.

## Installation

To run the frontend, follow these steps:

1. Clone the repository in your desired directory.
```bash
cd path/to/dir
git clone https://github.com/SFSU-Fog-City-Rocketry/FogFlightControl-Base.git
```

2. Navigate into the `react` folder where the frontend is located:

``cd FogFlightControl-Base/react``

3. Install dependencies:

``npm install``

4. Start the frontend:

``npm run dev``

5. Point your web browser to `localhost:5173` to view the frontend.

6. *In a separate shell*, navigate to the backend:
  
  ``cd FogFlightControl-Base/Backend``

7. Start the backend:

``npm run start``


## Setup

<!-- TODO: Add more pictures and maybe more steps -->

1. Follow the installation instructions
2. In the frontend, open the go/no go screen and connect to the vehicle or use the provided simulation.
3. In the same screen, type in the port and click the connect button to connect to the backend.
4. Go to the plugin management screen and upload your plugin zip files.

## FCRLib docs

todo

## Contributing

Contributions to this project are welcome. If you encounter any bugs or issues, please submit them using the issue tracker on GitHub. 

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

