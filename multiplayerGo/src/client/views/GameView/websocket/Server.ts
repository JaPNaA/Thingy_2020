type WebSocketData = string | ArrayBuffer | SharedArrayBuffer | Blob | ArrayBufferView;

class Server {
    private socket: WebSocket;
    private opened: boolean = false;

    private quedMessagesBeforeOpen: WebSocketData[];

    constructor() {
        this.socket = new WebSocket("ws://localhost:8081");
        this.socket.addEventListener("open", () => this.onOpen());

        this.quedMessagesBeforeOpen = [];
    }

    public send(message: WebSocketData) {
        if (!this.opened) {
            this.quedMessagesBeforeOpen.push(message);
        }
    }

    protected onOpen(): void {
        for (const message of this.quedMessagesBeforeOpen) {
            this.socket.send(message);
        }

        this.quedMessagesBeforeOpen.length = 0;
        this.opened = true;
    }
}

export default Server;