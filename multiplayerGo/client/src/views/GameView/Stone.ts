import Board from "./Board";

class Stone {
    constructor(private board: Board, private X: CanvasRenderingContext2D) { }

    public draw(board: Board) {
        this.X.fillStyle = "#ff0000";
        this.X.fillRect(0, 0, board.cellSize, board.cellSize);
    }
}

export default Stone;