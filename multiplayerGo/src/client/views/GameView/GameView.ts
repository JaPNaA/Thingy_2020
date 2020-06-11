import View from "../../View";
import Board from "./Board";
import GoServer from "./websocket/GoServer";

class GameView extends View {
    private board: Board = new Board();
    private server: GoServer = new GoServer();

    constructor() {
        super();
    }

    protected onOpen() {
        this.board.appendTo(this.app.elm);
    }

}

export default GameView;