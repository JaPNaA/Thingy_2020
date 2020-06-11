import GoBoard from "../../../shared/logic/GoBoard";
import Stone from "../../../shared/logic/Stone";

class Board {
    public cellSize: number = Board.CELL_SIZE;

    private static readonly WIDTH = 19;
    private static readonly HEIGHT = 19;
    private static readonly CELL_SIZE = 24;
    private static readonly PADDING = 0.2;

    private canvas: HTMLCanvasElement;
    private X: CanvasRenderingContext2D;

    private goBoardLogic: GoBoard = new GoBoard();

    private turn: boolean = false;

    constructor() {
        this.canvas = this.createCanvas();
        this.X = this.getCanvasContext();

        this.setup();
        this.draw();
    }

    public appendTo(elm: HTMLElement): void {
        elm.appendChild(this.canvas);
    }

    private createCanvas(): HTMLCanvasElement {
        const canvas = document.createElement("canvas");
        canvas.width = (Board.WIDTH + Board.PADDING * 2) * this.cellSize;
        canvas.height = (Board.HEIGHT + Board.PADDING * 2) * this.cellSize;
        return canvas;
    }

    private getCanvasContext(): CanvasRenderingContext2D {
        const X = this.canvas.getContext("2d");
        if (!X) { throw new Error("Canvas is not supported"); }
        return X;
    }

    private setup(): void {
        this.canvas.addEventListener("click", e => {
            this.goBoardLogic.putStone(
                (this.turn = !this.turn) ?
                    Stone.white : Stone.black,
                Math.floor(e.offsetX / this.cellSize - Board.PADDING),
                Math.floor(e.offsetY / this.cellSize - Board.PADDING)
            );

            this.draw();
        });
    }

    private draw(): void {
        this.X.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGrid();
        this._debugDrawOwner();
        this.drawStones();
    }

    private _debugDrawOwner() {
        // 
    }

    private drawGrid(): void {
        this.X.strokeStyle = "#555555";

        this.X.save();
        this.X.translate(this.cellSize * Board.PADDING, this.cellSize * Board.PADDING);

        // <= instead of =, adds final line to close the shape

        for (let x = 0; x <= Board.WIDTH; x++) {
            this.X.beginPath();
            this.X.moveTo(x * this.cellSize, 0);
            this.X.lineTo(x * this.cellSize, Board.HEIGHT * this.cellSize);
            this.X.stroke();
        }

        for (let y = 0; y <= Board.HEIGHT; y++) {
            this.X.beginPath();
            this.X.moveTo(0, y * this.cellSize);
            this.X.lineTo(Board.WIDTH * this.cellSize, y * this.cellSize);
            this.X.stroke();
        }

        this.X.restore();
    }

    private drawStones(): void {
        this.X.save();

        const stones = this.goBoardLogic.getStones();

        for (let y = 0; y < Board.HEIGHT; y++) {
            for (let x = 0; x < Board.WIDTH; x++) {
                const stone = stones[y][x];
                if (stone === Stone.none) { continue; }

                if (stone === Stone.black) {
                    this.X.fillStyle = "#2e2e2e";
                } else if (stone === Stone.white) {
                    this.X.fillStyle = "#adadad";
                }

                this.X.fillRect(
                    (x + Board.PADDING) * this.cellSize,
                    (y + Board.PADDING) * this.cellSize,
                    this.cellSize, this.cellSize
                );
            }
        }
    }
}

export default Board;