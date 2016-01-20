'use strict';

import * as WebSocket from 'ws';
import * as msgpack from 'msgpack-lite';

interface ConnectionPair {
    host: WebSocket;
    guest: WebSocket;
    screenWidth: number;
    screenHeight: number;
}

interface MessageHandler {
    (ws: WebSocket, message: any, rawData: Buffer): void;
}

const wss = new WebSocket.Server({ 'port': 8080 });
const connectionPairs: { [hostid: string]: ConnectionPair } = {};
const messageHandlers: { [messageType: string]: MessageHandler } = {
    'connect-host': onConnectHost,
    'connect-guest': onConnectGuest,
    'disconnect-host': onDisconnectHost,
    'disconnect-guest': onDisconnectGuest,
    'mouse-click': onMouseClick,
    'screen-capture': onScreenCapture
};

wss.on('connection', ws => {
    ws.on('message', data => {
        const message = msgpack.decode(data);
        messageHandlers[message.type](ws, message, data);
    });

    ws.on('close', () => {
        console.log('Connection closed.');
    });
});

function onConnectHost(ws: WebSocket, message: any) {
    const hostid = String(Math.floor(10000000 * Math.random()));
    connectionPairs[hostid] = {
        host: ws,
        guest: null,
        screenWidth: message.screenWidth,
        screenHeight: message.screenHeight
    };
    ws.send(msgpack.encode({
        type: 'create-hostid',
        hostid: hostid
    }), { binary: true });
}

function onConnectGuest(ws: WebSocket, message: any, rawData: Buffer) {
    const hostid = message.hostid;
    if (hostid in connectionPairs) {
        const pair = connectionPairs[hostid];
        pair.guest = ws;
        pair.host.send(rawData);
        ws.send(msgpack.encode({
            type: 'host-found',
            screenWidth: pair.screenWidth,
            screenHeight: pair.screenHeight
        }), { binary: true });
    } else {
        ws.send(msgpack.encode({
            type: 'error',
            description: 'Host not found.'
        }), { binary: true });
    }
}

function onDisconnectHost(ws: WebSocket, message: any) {
    const hostid = message.hostid;
    if (connectionPairs[hostid].guest != null) {
        connectionPairs[hostid].guest.send(msgpack.encode({
            type: 'error',
            description: 'Connection closed by host.'
        }), { binary: true });
    }
    delete connectionPairs[hostid];
}

function onDisconnectGuest(ws: WebSocket, message: any, rawData: Buffer) {
    const hostid = message.hostid;
    if (hostid in connectionPairs) {
        connectionPairs[hostid].host.send(rawData);
        connectionPairs[hostid].guest = null;
    }
}

function onMouseClick(ws: WebSocket, message: any, rawData: Buffer) {
    connectionPairs[message.hostid].host.send(rawData);
}

function onScreenCapture(ws: WebSocket, message: any, rawData: Buffer) {
    connectionPairs[message.hostid].guest.send(rawData);
}
