import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import ip from 'ip';
import localtunnel from 'localtunnel';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;

const app = express();
app.use(cors());
app.use(express.json());
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../dist')));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for dev/local network
    methods: ["GET", "POST"]
  }
});

// State
let state = {
  progress: 0,
  isComplete: false,
  logs: [],
  serverIp: null, // Will be updated
  publicUrl: null
};

// ... existing config ...
const DURATION_SECONDS = 300; // 5 minutes
const TARGET_PROGRESS = 99.99;
const UPDATE_INTERVAL_MS = 100;
const INCREMENT_PER_TICK = (TARGET_PROGRESS / (DURATION_SECONDS * 1000 / UPDATE_INTERVAL_MS));

// Auto-growth timer
const timer = setInterval(() => {
  if (state.isComplete) return;

  if (state.progress < TARGET_PROGRESS) {
    state.progress = Math.min(TARGET_PROGRESS, Math.max(state.progress, state.progress + INCREMENT_PER_TICK));
    io.emit('progress_update', state.progress);
  }
}, UPDATE_INTERVAL_MS);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial state with BOTH IP and Public URL
  socket.emit('init', { ...state, serverIp: localIP, port: PORT });

  socket.on('user_submit', (data) => {
    // ... existing logic ...
    const { name } = data;
    console.log('User submitted:', name);

    if (name === 'START_DEMO_NOW' || name === '张三' || name === 'Admin' || name.toLowerCase() === 'demo') {
      state.progress = 100;
      state.isComplete = true;
      io.emit('progress_update', 100);
      io.emit('completion', { name });
      
      const log = {
        timestamp: new Date().toLocaleTimeString(),
        message: `${name} 注入关键能量，充能完成！`,
        type: 'success'
      };
      state.logs.unshift(log);
      if (state.logs.length > 50) state.logs.pop();
      io.emit('new_log', log);
      
    } else {
      if (!state.isComplete) {
         state.progress = Math.min(TARGET_PROGRESS, state.progress + 1.0);
         io.emit('progress_update', state.progress);
      }

      const log = {
        timestamp: new Date().toLocaleTimeString(),
        message: `${name} 已成功注入能量！`,
        type: 'info'
      };
      state.logs.unshift(log);
      if (state.logs.length > 50) state.logs.pop();
      
      io.emit('new_log', log);
      io.emit('spawn_particle', { name });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.post('/reset', (req, res) => {
  state = { ...state, progress: 0, isComplete: false, logs: [] };
  io.emit('init', state);
  res.send('Reset');
});

// Catch-all to serve React app for client-side routing
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});


const pickLocalIp = () => {
  const nets = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net && net.family === 'IPv4' && !net.internal) {
        candidates.push({ name, address: net.address });
      }
    }
  }

  const isPrivate =
    (addr) =>
      addr.startsWith('10.') ||
      addr.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(addr);

  const isLinkLocal = (addr) => addr.startsWith('169.254.');

  const scoreCandidate = ({ name, address }) => {
    const nameLower = (name || '').toLowerCase();
    let score = 0;

    if (isLinkLocal(address)) score -= 1000;
    if (isPrivate(address)) score += 50;

    if (nameLower.includes('wi-fi') || nameLower.includes('wlan')) score += 200;
    if (nameLower.includes('ethernet')) score += 150;

    if (
      nameLower.includes('virtualbox') ||
      nameLower.includes('vmware') ||
      nameLower.includes('vEthernet'.toLowerCase()) ||
      nameLower.includes('hyper-v') ||
      nameLower.includes('loopback') ||
      nameLower.includes('nat')
    ) {
      score -= 200;
    }

    return score;
  };

  const best = candidates
    .slice()
    .sort((a, b) => scoreCandidate(b) - scoreCandidate(a))[0];

  return best?.address || ip.address();
};

const localIP = pickLocalIp();

// Start Tunnel
const startTunnel = async () => {
  const configuredPublicUrl = (process.env.PUBLIC_URL || '').trim().replace(/\/$/, '');

  if (configuredPublicUrl) {
    state.publicUrl = configuredPublicUrl;
    io.emit('init', { ...state, serverIp: localIP, port: PORT });
    console.log(`Using PUBLIC_URL: ${state.publicUrl}`);
    return;
  }

  state.publicUrl = null;
  io.emit('init', { ...state, serverIp: localIP, port: PORT });
  console.log(`Using local IP: http://${localIP}:${PORT}/join`);
};

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://${localIP}:${PORT}`);
  startTunnel();
});
