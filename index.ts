let ws: WebSocket;
const hostidInput = <HTMLInputElement>document.getElementById('hostid');
const connectButton = <HTMLButtonElement>document.getElementById('connect');
const disconnectButton = <HTMLButtonElement>document.getElementById('disconnect');

disconnectButton.disabled = true;

connectButton.addEventListener('click', () => {
    const hostid = hostidInput.value;
    if (hostid == '') return;
    connectButton.disabled = true;

    ws = new WebSocket('ws://localhost:8080');

    ws.onopen = () => {
        ws.send(JSON.stringify({
            type: 'connect-guest',
            hostid: hostid
        }));
        disconnectButton.disabled = false;
    };

    ws.onmessage = event => {
        alert(JSON.parse(event.data)['message']);
    };
});

disconnectButton.addEventListener('click', () => {
    disconnectButton.disabled = true;
    ws.close();
    ws = null;
    connectButton.disabled = false;
});
