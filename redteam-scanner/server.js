const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// WebSocket connection for real-time updates
wss.on('connection', (ws) => {
    console.log('Client connected');
    
    ws.on('message', (message) => {
        console.log('Received:', message.toString());
        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
    
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// API endpoints
app.post('/api/scan', (req, res) => {
    const { url, options } = req.body;
    console.log(`Scan requested for: ${url}`);
    res.json({ status: 'scan_initiated', url, timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`RedTeam Security Scanner server running on http://0.0.0.0:${PORT}`);
    console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
});
