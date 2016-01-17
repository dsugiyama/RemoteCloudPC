import * as WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'connect-host'
    }));
});

ws.on('message', data => {
    const message = JSON.parse(data);
    switch (message.type) {
        case 'create-hostid':
            console.log('Host ID: ' + message.hostid);
            break;
        case 'connect-guest':
            console.log('Guest connected.');
            break;
        case 'disconnect-guest':
            console.log('Guest disconnected.');
            break;
        case 'mouse-click':
            console.log(`click: x = ${message.x}, y = ${message.y}`);
            break;
    }
});
