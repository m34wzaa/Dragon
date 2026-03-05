const { WebSocketServer } = require('ws');
const wss = new WebSocketServer({ port: 8080 });

const players = {};

wss.on('connection', (ws) => {
    const id = Math.random().toString(36).slice(2);
    players[id] = {};

    ws.send(JSON.stringify({ type: 'init', id }));

    // send existing players to the new connection
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
                    client.send(JSON.stringify({
                        type: 'move', id,
                        pos: msg.pos,
                        quat: msg.quat
                    }));
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
console.log('Server running on ws://localhost:8080');
