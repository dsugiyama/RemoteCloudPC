import { Server as WebSocketServer } from 'ws';

const wss = new WebSocketServer({ 'port': 8080 });

wss.on('connection', ws => {
    ws.on('message', data => {
        const message = JSON.parse(data);
        switch (message.type) {
            case 'connect-guest':
                ws.send(JSON.stringify({
                    type: 'screen-size',
                    width: 800,
                    height: 600
                }));
                break;
            case 'mouse-click':
                console.log(`click: x = ${message.x}, y = ${message.y}`);
                break;
        }
    });

    ws.on('close', () => {
        console.log('Connection closed.');
    });
});
