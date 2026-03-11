const http = require('http');
const { WebSocketServer } = require('ws');

const players = {};
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('ok');
});
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    const id = Math.random().toString(36).slice(2);
    players[id] = {};
    ws.send(JSON.stringify({ type: 'init', id }));
    Object.entries(players).forEach(([pid, pdata]) => {
        if (pid !== id && pdata.pos) {
            ws.send(JSON.stringify({ type: 'join', id: pid }));
        }
    });

    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        if (msg.type === 'move') {
            players[id] = { pos: msg.pos, quat: msg.quat };
            wss.clients.forEach((client) => {
                if (client !== ws && client.readyState === 1) {
                    client.send(JSON.stringify({ ...msg, id }));
                }
            });
        }
    });

    ws.on('close', () => {
        delete players[id];
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(JSON.stringify({ type: 'leave', id }));
            }
        });
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log('Server on port', PORT));
