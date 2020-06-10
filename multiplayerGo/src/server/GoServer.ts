import http from "http";
import websocket from "websocket";

class GoServer {
    private httpServer: http.Server;
    private websocketServer: websocket.server;

    constructor() {
        this.httpServer = http.createServer(function (req, res) {
            res.end(req.url);
        });

        this.websocketServer = new websocket.server({
            httpServer: this.httpServer
        });

        this.setup();
    }

    private setup(): void {
        this.websocketServer.addListener("request", function (req) {
            const connection = req.accept();

            connection.addListener("message", function (data) {
                console.log(data.utf8Data);
            });
        });

        this.httpServer.listen(8081);
    }
}

export default GoServer;
