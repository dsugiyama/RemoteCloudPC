'use strict';

import * as fs from 'fs';
import * as WebSocket from 'ws';

const ws = new WebSocket('ws://40.74.115.93:8080');
let hostid: string;
const images = [0, 1, 2, 3].map(i => fs.readFileSync(`resource/${i}.jpg`));
let stopSendImage: boolean;

ws.on('open', () => {
    ws.send(JSON.stringify({
        type: 'connect-host',
        screenWidth: 800,
        screenHeight: 600
    }));
});

ws.on('message', data => {
    const message = JSON.parse(data);
    switch (message.type) {
        case 'create-hostid':
            hostid = message.hostid;
            console.log('Host ID: ' + hostid);
            console.log('Press return key to exit.');
            process.stdin.addListener('data', exitProcess);
            break;
        case 'connect-guest':
            console.log('Guest connected.');
            stopSendImage = false;
            // sendImage(0);
            break;
        case 'disconnect-guest':
            console.log('Guest disconnected.');
            stopSendImage = true;
            break;
        case 'mouse-click':
            console.log(`click: x = ${message.x}, y = ${message.y}`);
            break;
        case 'key-down':
            console.log(`keydown: ${message.key}`);
            break;
    }
});

function exitProcess() {
    ws.send(JSON.stringify({
        type: 'disconnect-host',
        hostid: hostid
    }), () => {
        ws.close();
        process.exit();
    });
}

function sendImage(index: number) {
    if (stopSendImage) return;
    ws.send(JSON.stringify({
        type: 'screen-capture',
        hostid: hostid,
        data: images[index]
    }));
    setTimeout(sendImage, 1000, (index + 1) % 4);
}
