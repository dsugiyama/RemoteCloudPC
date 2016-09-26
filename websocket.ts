'use strict';

import * as WebSocket from 'ws';
import * as http from 'http';
import { jsmpeg } from './jsmpg';

interface ConnectionPair {
    host: WebSocket;
    guest: WebSocket;
    guestDisp: WebSocket;
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
    'mouse-down': onMouseEvent,
    'mouse-up': onMouseEvent,
    'mouse-move': onMouseEvent,
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
        guestDisp: undefined,
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

function onMouseEvent(ws: WebSocket, message: any, rawData: Buffer) {
    connectionPairs[message.hostid].host.send(rawData);
}

function onKeyDown(ws: WebSocket, message: any, rawData: Buffer) {
    connectionPairs[message.hostid].host.send(rawData);
}

function onScreenCapture(ws: WebSocket, message: any, rawData: Buffer) {
    connectionPairs[message.hostid].guest.send(rawData);
}



//
// Display Stream Server
//
const STREAM_PORT: number = 8082;
const DISP_WEBSOCKET_PORT: number =  8084;
const STREAM_MAGIC_BYTES = 'jsmp'; // Must be 4 bytes

const DispWS = new WebSocket.Server({'port': DISP_WEBSOCKET_PORT});

DispWS.on('connection', (ws) => {
    ws.on('message', data => {
       let hostid = data;
       
       if(hostid in connectionPairs) {
           console.log('connected hostid:' + hostid);
           
           let pair = connectionPairs[hostid];
           pair.guestDisp = ws;
           
           // Send Header
           let streamHeader = new Buffer(8);
	       streamHeader.write(STREAM_MAGIC_BYTES);
	       streamHeader.writeUInt16BE(pair.screenWidth, 4);
	       streamHeader.writeUInt16BE(pair.screenHeight, 6);
           
	       ws.send(streamHeader, {binary:true});
       }
    });
    
	ws.on('close', function(code, message){
		console.log( 'Disconnected WebSocket' );
	});
});

function broadcast(data: any, hostid: string) {
    if( hostid in connectionPairs) {
        let pair = connectionPairs[hostid];
        if( pair.guestDisp && pair.guestDisp.readyState == 1 ) {
            pair.guestDisp.send(data, {binary: true});
        }
    }
};


// HTTP Server to accept incomming MPEG Stream
var streamServer = http.createServer( function(request, response) {
	var params = request.url.substr(1).split('/');
    
    let hostid = params[0];
	if( hostid in connectionPairs ) {
		
		console.log(
			'Stream Connected: ' + request.socket.remoteAddress + 
			':' + request.socket.remotePort);
            
		request.on('data', function(data:any){
			broadcast(data, hostid);
		});
	}
	else {
		console.log('hostid:'+hostid+' is not found');
        console.log(connectionPairs);
		response.end();
	}
}).listen(STREAM_PORT);

console.log('Listening for MPEG Stream on http://hostname:'+STREAM_PORT+'/<hostid>/');
console.log('Awaiting DispWebSocker connections on ws://hostname:'+DISP_WEBSOCKET_PORT+'/');
