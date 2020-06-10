class Server {
    private socket: WebSocket;

    constructor() {
        this.socket = new WebSocket("ws://localhost:8081");
        this.socket.addEventListener("open", () => this.onOpen());
        console.log(this.socket);
    }

    private onOpen(): void {
        this.socket.send("Test!");
    }
}

export default Server;