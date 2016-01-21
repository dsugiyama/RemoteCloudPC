'use strict';

let ws: WebSocket;
let hostid: string;
let hostConnected: boolean = false;
const hostidInput = <HTMLInputElement>document.getElementById('hostid');
const connectButton = <HTMLButtonElement>document.getElementById('connect');
const disconnectButton = <HTMLButtonElement>document.getElementById('disconnect');
const captureImage = <HTMLImageElement>document.getElementById('capture');

disconnectButton.disabled = true;

connectButton.addEventListener('click', () => {
    hostid = hostidInput.value;
    if (hostid == '') return;
    connectButton.disabled = true;

    ws = new WebSocket('ws://40.74.115.93:8080');

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
            captureImage.width = message.screenWidth;
            captureImage.height = message.screenHeight;
            captureImage.addEventListener('click', onClick);
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
        captureImage.removeEventListener('click', onClick);
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
    const clientRect = captureImage.getBoundingClientRect();
    ws.send(JSON.stringify({
        type: 'mouse-click',
        hostid: hostid,
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
}
