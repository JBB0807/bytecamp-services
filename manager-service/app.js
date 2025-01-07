const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const { env } = require('process');

const DATABASE_SERVICE_URL = env.DATABASE_SERVICE_URL;
const FRONTEND_SERVICE_URL = env.FRONTEND_SERVICE_URL;
const UPLOADER_SERVICE_URL = env.UPLOADER_SERVICE_URL;



class Machine {
  constructor(username, address) {
    this.username = username;
    this.address = address;
    this.cache = null;
    this.lastPingTime = null;
  }

  async ping() {
    try {
      const response = await axios.get(`http://${this.address}:5000/`);
      this.cache = response.data;
      this.lastPingTime = Date.now();
    } catch (error) {
      console.error(`Failed to ping machine ${this.username}: ${error.message}`);
    }
  }

  getCachedResponse() {
    return this.cache;
  }
}

// Application setup
const app = express();
app.use(express.json());

const machines = new Map();

// Load machines from database on startup
(async () => {
  try {
    const { data } = await axios.get('http://database-service/machines'); // Replace with our database endpoint
    data.forEach(({ username, machineAddress }) => {
      const machine = new Machine(username, machineAddress);
      machines.set(username, machine);
      machine.ping(); // Initial ping to populate cache
    });
    console.log('Loaded machines from database.');
  } catch (error) {
    console.error('Failed to load machines from database:', error.message);
  }
})();

// Register a new user and their machine
app.post('/register', async (req, res) => {
  const { username, machineAddress } = req.body;

  if (!username || !machineAddress) {
    return res.status(400).json({ error: 'Username and machineAddress are required' });
  }

  const machine = new Machine(username, machineAddress);
  throw new Error('need to register machine in database');
  // register machine in db asap and await success
  machines.set(username, machine);
  await machine.ping();
  res.json({ message: `User ${username} registered with address ${machineAddress}` });
});

// HTTP proxy for dynamic routing
app.use('/:username/:path/*', async (req, res, next) => { //ensure this will work with all paths
  //update to use gateway signature or jwt
  const username = req.params.username;
  const machine = machines.get(username);

  if (!machine) {
    return res.status(404).json({ error: 'User not found' });
  }

  const targetPort = req.params.path === ('upload' || 'file' || 'reserved') ? 8080 : 5000; // 3 paths that hit sync agent, rest hit bsnake
  const proxy = createProxyMiddleware({
    target: `http://${machine.address}:${targetPort}`,
    changeOrigin: true,
    pathRewrite: { [`^/${username}`]: '' }, // remove username from path before forwarding
    ws: true,
    onProxyReq: () => {
      console.log(`Proxying request to ${machine.address}:${targetPort}`);
    },
  });

  proxy(req, res, next);
});

// External route proxying, update to use wildcards for mapping to other microservices
const externalRoutes = {
  'login': 'frontend_service_url',
  'signup': 'database_service_url',
  'signin': 'database_service_url',
  'upload': 'uploader_service_url',
};

Object.entries(externalRoutes).forEach(([route, target]) => {
  app.use(`/${route}`, createProxyMiddleware({
    target: target,
    changeOrigin: true,
    pathRewrite: { [`^/${route}`]: '' }, // see if path needs to be rewritten
  }));
});

// WebSocket server for forwarding connections
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
  const username = req.url.split('/')[1];
  const machine = machines.get(username);

  if (!machine) {
    ws.close();
    console.error(`WebSocket connection failed: User ${username} not found`);
    return;
  }

  const target = `ws://${machine.address}:8080`;
  const proxySocket = new WebSocket(target);

  proxySocket.on('open', () => {
    console.log(`Connected to WebSocket for user ${username}`);
  });

  proxySocket.on('message', (data) => {
    ws.send(data);
  });

  proxySocket.on('close', () => {
    ws.close();
  });

  proxySocket.on('error', (error) => {
    console.error(`WebSocket error: ${error}`);
    ws.close();
  });

  ws.on('message', (data) => {
    proxySocket.send(data);
  });

  ws.on('close', () => {
    proxySocket.close();
  });
});

// Integrate WebSocket server with the HTTP server
const server = app.listen(3000, () => {
  console.log('Reverse proxy server running on http://localhost:3000');
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});
