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

    ws = new WebSocket('ws://localhost:8080');

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
        case 'screen-size':
            hostConnected = true;
            disconnectButton.disabled = false;
            screenCanvas.width = message.width;
            screenCanvas.height = message.height;
            const context = screenCanvas.getContext('2d');
            context.strokeRect(0, 0, message.width, message.height);
            screenCanvas.addEventListener('click', onClick);
            break;
        case 'error':
            closeSocket();
            alert('error: ' + message.description);
            break;
    }
}

function closeSocket() {
    if (hostConnected) {
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
        x: Math.floor(event.clientX - clientRect.left),
        y: Math.floor(event.clientY - clientRect.top)
    }));
}
