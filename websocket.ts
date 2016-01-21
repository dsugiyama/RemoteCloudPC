'use strict';

import * as WebSocket from 'ws';

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
    'key-down': onKeyDown,
    'screen-capture': onScreenCapture
};

wss.on('connection', ws => {
    ws.on('message', data => {
        const message = JSON.parse(data);
        console.log(message);
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
    ws.send(JSON.stringify({
        type: 'create-hostid',
        hostid: hostid
    }));
}

function onConnectGuest(ws: WebSocket, message: any, rawData: Buffer) {
    const hostid = message.hostid;
    if (hostid in connectionPairs) {
        const pair = connectionPairs[hostid];
        pair.guest = ws;
        pair.host.send(rawData);
        ws.send(JSON.stringify({
            type: 'host-found',
            screenWidth: pair.screenWidth,
            screenHeight: pair.screenHeight
        }));
    } else {
        ws.send(JSON.stringify({
            type: 'error',
            description: 'Host not found.'
        }));
    }
}

function onDisconnectHost(ws: WebSocket, message: any) {
    const hostid = message.hostid;
    if (connectionPairs[hostid].guest != null) {
        connectionPairs[hostid].guest.send(JSON.stringify({
            type: 'error',
            description: 'Connection closed by host.'
        }));
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

function onKeyDown(ws: WebSocket, message: any, rawData: Buffer) {
    connectionPairs[message.hostid].host.send(rawData);
}

function onScreenCapture(ws: WebSocket, message: any, rawData: Buffer) {
    connectionPairs[message.hostid].guest.send(rawData);
}
