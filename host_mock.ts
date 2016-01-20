'use strict';

import * as WebSocket from 'ws';
import * as msgpack from 'msgpack-lite';

const ws = new WebSocket('ws://localhost:8080');
let hostid: string;

ws.on('open', () => {
    ws.send(msgpack.encode({
        type: 'connect-host',
        screenWidth: 800,
        screenHeight: 600
    }), { binary: true });
});

ws.on('message', data => {
    const message = msgpack.decode(data);
    switch (message.type) {
        case 'create-hostid':
            hostid = message.hostid;
            console.log('Host ID: ' + hostid);
            console.log('Press return key to exit.');
            process.stdin.addListener('data', exitProcess);
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

function exitProcess() {
    ws.send(msgpack.encode({
        type: 'disconnect-host',
        hostid: hostid
    }), { binary: true }, () => {
        ws.close();
        process.exit();
    });
}
