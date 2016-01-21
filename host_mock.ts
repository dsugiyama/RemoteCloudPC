'use strict';

import * as fs from 'fs';
import * as WebSocket from 'ws';
import * as msgpack from 'msgpack-lite';

const ws = new WebSocket('ws://40.74.115.93:8080');
let hostid: string;
const images = [0, 1, 2, 3].map(i => fs.readFileSync(`resource/${i}.jpg`));
let stopSendImage: boolean;

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
            stopSendImage = false;
            sendImage(0);
            break;
        case 'disconnect-guest':
            console.log('Guest disconnected.');
            stopSendImage = true;
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

function sendImage(index: number) {
    if (stopSendImage) return;
    ws.send(msgpack.encode({
        type: 'screen-capture',
        hostid: hostid,
        data: images[index]
    }), { binary: true });
    setTimeout(sendImage, 1000, (index + 1) % 4);
}
