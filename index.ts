'use strict';

let ws: WebSocket;
let hostid: string;
let hostConnected: boolean = false;
const hostidInput = <HTMLInputElement>document.getElementById('hostid');
const connectButton = <HTMLButtonElement>document.getElementById('connect');
const disconnectButton = <HTMLButtonElement>document.getElementById('disconnect');
const screenCanvas = <HTMLCanvasElement>document.getElementById('screen');

disconnectButton.disabled = true;

connectButton.addEventListener('click', () => {
    hostid = hostidInput.value;
    if (hostid == '') return;
    connectButton.disabled = true;

    ws = new WebSocket('ws://rcpc00.japanwest.cloudapp.azure.com:8080');

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
            //const context = screenCanvas.getContext('2d');
            //context.strokeRect(0, 0, screenCanvas.width, screenCanvas.height);
            //screenCanvas.addEventListener('click', onClick);
            document.addEventListener('keydown', onKeyDown);
            let dispWs = new WebSocket( 'ws://localhost:8084/' );
            let player = new jsmpeg(dispWs, {canvas: screenCanvas, hostid: hostid});
            break;
        // case 'screen-capture':
        //     const imageBlob = new Blob([message.data], { type: 'image/jpeg' });
        //     const imageBlobUrl = window.URL.createObjectURL(imageBlob);
        //     captureImage.onload = () => {
        //         window.URL.revokeObjectURL(imageBlobUrl);
        //     };
        //     captureImage.src = imageBlobUrl;
        //     break;
        case 'error':
            closeSocket();
            alert('error: ' + message.description);
            break;
    }
}

function closeSocket() {
    if (hostConnected) {
        screenCanvas.removeEventListener('click', onClick);
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

function onClick(event: MouseEvent) {
    const clientRect = screenCanvas.getBoundingClientRect();
    ws.send(JSON.stringify({
        type: 'mouse-click',
        hostid: hostid,
        button: 'left',
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
}

function onContextMenu(event: MouseEvent) {
    const clientRect = screenCanvas.getBoundingClientRect();
    ws.send(JSON.stringify({
        type: 'mouse-click',
        hostid: hostid,
        button: 'right',
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
    event.preventDefault();
}

function onKeyDown(event: KeyboardEvent) {
    ws.send(JSON.stringify({
        type: 'key-down',
        hostid: hostid,
        key: event.key.toUpperCase()
    }));
}
