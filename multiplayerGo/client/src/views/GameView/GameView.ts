import View from "../../View";
import Board from "./Board";
import Server from "./websocket/Server";

class GameView extends View {
    private board: Board = new Board();
    private server: Server = new Server();

    constructor() {
        super();

        console.log("a");
    }

    protected onOpen() {
        this.board.appendTo(this.app.elm);
    }

}

export default GameView;