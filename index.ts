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

    ws = new WebSocket('ws://localhost:8080');
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
        ws.send(msgpack.encode({
            type: 'connect-guest',
            hostid: hostid
        }));
    };

    ws.onmessage = onMessage;
});

disconnectButton.addEventListener('click', closeSocket);
window.addEventListener('beforeunload', closeSocket);

function onMessage(event: MessageEvent) {
    const message = msgpack.decode(new Uint8Array(event.data));
    switch (message.type) {
        case 'host-found':
            hostConnected = true;
            disconnectButton.disabled = false;
            captureImage.width = message.screenWidth;
            captureImage.height = message.screenHeight;
            captureImage.addEventListener('click', onClick);
            break;
        case 'screen-capture':
            const imageBlob = new Blob([message.data], { type: 'image/jpeg' });
            const imageBlobUrl = window.URL.createObjectURL(imageBlob);
            captureImage.onload = () => {
                window.URL.revokeObjectURL(imageBlobUrl);
            };
            captureImage.src = imageBlobUrl;
            break;
        case 'error':
            closeSocket();
            alert('error: ' + message.description);
            break;
    }
}

function closeSocket() {
    if (hostConnected) {
        captureImage.removeEventListener('click', onClick);
        ws.send(msgpack.encode({
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
    ws.send(msgpack.encode({
        type: 'mouse-click',
        hostid: hostid,
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
}
