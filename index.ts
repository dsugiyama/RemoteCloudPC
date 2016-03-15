'use strict';

let ws: WebSocket;
let hostid: string;
let hostConnected: boolean = false;
const hostidInput = <HTMLInputElement>document.getElementById('hostid');
const connectButton = <HTMLButtonElement>document.getElementById('connect');
const disconnectButton = <HTMLButtonElement>document.getElementById('disconnect');
const screenCanvas = <HTMLCanvasElement>document.getElementById('screen');
const serverAddress = "localhost";

const keymap: { [src: string]: string } = {
    ' ': 'SPACE',
    '+': 'ADD',
    '-': 'SUBTRACT',
    '*': 'MULTIPLY',
    '/': 'DIVIDE'
};

disconnectButton.disabled = true;

connectButton.addEventListener('click', () => {
    hostid = hostidInput.value;
    if (hostid == '') return;
    connectButton.disabled = true;

    ws = new WebSocket(`ws://${serverAddress}:8080`);

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'connect-guest',
            hostid: hostid
        }));
    };

    ws.onmessage = onMessage;
});

disconnectButton.addEventListener('click', closeSocket);
window.addEventListener('beforeunload', closeSocket);

function onMessage(event: MessageEvent) {
    const message = JSON.parse(event.data);
    switch (message.type) {
        case 'host-found':
            hostConnected = true;
            disconnectButton.disabled = false;
            screenCanvas.width = message.screenWidth;
            screenCanvas.height = message.screenHeight;
            screenCanvas.addEventListener('contextmenu', onContextMenu);
            screenCanvas.addEventListener('mousedown', onMouseDown);
            screenCanvas.addEventListener('mouseup', onMouseUp);
            screenCanvas.addEventListener('mousemove', onMouseMove);
            document.addEventListener('keydown', onKeyDown);
            let dispWs = new WebSocket( `ws://${serverAddress}:8084/` );
            let player = new jsmpeg(dispWs, {canvas: screenCanvas, hostid: hostid});
            break;
        case 'error':
            closeSocket();
            alert('error: ' + message.description);
            break;
    }
}

function closeSocket() {
    if (hostConnected) {
        screenCanvas.removeEventListener('contextmenu', onContextMenu);
        screenCanvas.removeEventListener('mousedown', onMouseDown);
        screenCanvas.removeEventListener('mouseup', onMouseUp);
        screenCanvas.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('keydown', onKeyDown);
        ws.send(JSON.stringify({
            type: 'disconnect-guest',
            hostid: hostid
        }));
        hostConnected = false;
        disconnectButton.disabled = true;
    }
    if (ws != null) {
        ws.close();
        ws = null;
        connectButton.disabled = false;
    }
}

function onMouseDown(event: MouseEvent) {
    const clientRect = screenCanvas.getBoundingClientRect();
    ws.send(JSON.stringify({
        type: 'mouse-down',
        hostid: hostid,
        button: event.button == 0 ? 'left' : 'right',
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
}

function onMouseUp(event: MouseEvent) {
    const clientRect = screenCanvas.getBoundingClientRect();
    ws.send(JSON.stringify({
        type: 'mouse-up',
        hostid: hostid,
        button: event.button == 0 ? 'left' : 'right',
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
}

function onMouseMove(event: MouseEvent) {
    const clientRect = screenCanvas.getBoundingClientRect();
    ws.send(JSON.stringify({
        type: 'mouse-move',
        hostid: hostid,
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
}

function onContextMenu(event: MouseEvent) {
    event.preventDefault();
}

function onKeyDown(event: KeyboardEvent) {
    ws.send(JSON.stringify({
        type: 'key-down',
        hostid: hostid,
        key: (event.key in keymap) ? keymap[event.key] : event.key.toUpperCase(),
        shift: event.shiftKey,
        alt: event.altKey,
        ctrl: event.ctrlKey
    }));
}
