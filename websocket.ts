import { Server as WebSocketServer } from 'ws';

const wss = new WebSocketServer({ 'port': 8080 });

wss.on('connection', ws => {
    ws.on('message', data => {
        console.log(JSON.parse(data));
    });

    ws.on('close', () => {
        console.log('Connection closed.');
    });

    ws.send(JSON.stringify({
        'message': 'hello'
    }));
});
