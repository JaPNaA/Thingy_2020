import Stone from "./Stone";
import create2dArray from "../utils/create2dArray";

const SAMPLE_GAME = [[2, 0, 2, 0, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2], [0, 1, 0, 0, 1, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 1, 2, 1, 2], [1, 1, 0, 0, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 2, 1, 1, 2], [2, 1, 0, 1, 2, 2, 2, 1, 0, 1, 0, 1, 1, 0, 1, 1, 2, 2, 1], [2, 1, 1, 1, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1], [1, 0, 2, 1, 1, 1, 1, 1, 0, 2, 0, 1, 0, 1, 1, 1, 1, 0, 1], [2, 1, 1, 1, 0, 0, 1, 0, 2, 0, 0, 1, 1, 1, 0, 1, 0, 0, 0], [1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 2, 2], [2, 0, 2, 2, 2, 0, 2, 2, 0, 1, 1, 0, 0, 0, 2, 1, 1, 0, 0], [0, 0, 2, 0, 0, 2, 2, 0, 1, 2, 1, 1, 0, 2, 0, 1, 0, 2, 2], [0, 2, 0, 0, 2, 2, 0, 1, 1, 0, 1, 2, 1, 0, 1, 1, 0, 2, 0], [0, 0, 1, 1, 0, 2, 2, 0, 1, 2, 1, 2, 1, 1, 2, 1, 1, 0, 2], [1, 1, 1, 0, 0, 2, 2, 0, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0], [0, 1, 1, 0, 0, 0, 2, 2, 0, 0, 1, 2, 2, 1, 2, 1, 0, 0, 2], [0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0], [0, 0, 1, 1, 1, 1, 1, 0, 2, 0, 1, 2, 2, 1, 2, 1, 2, 1, 1], [2, 0, 1, 2, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 2, 1, 2, 1, 2], [0, 0, 1, 2, 0, 1, 1, 1, 0, 2, 0, 1, 2, 1, 2, 1, 1, 1, 2], [2, 0, 1, 1, 0, 0, 2, 1, 0, 2, 0, 1, 2, 1, 2, 2, 2, 2, 1]];
const SAMPLE_GAME_2 = [[1, 2, 1, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 2], [2, 1, 2, 2, 1, 2, 2, 1, 2, 2, 2, 2, 1, 2, 2, 1, 2, 1, 2], [1, 1, 2, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1, 1, 2, 2, 1, 1, 2], [2, 1, 2, 1, 2, 2, 2, 1, 0, 1, 0, 1, 1, 0, 1, 1, 2, 2, 1], [2, 1, 1, 1, 1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 1], [1, 2, 1, 1, 1, 1, 1, 1, 0, 2, 0, 1, 0, 1, 1, 1, 1, 0, 1], [1, 1, 1, 1, 0, 0, 1, 0, 2, 0, 0, 1, 1, 1, 2, 1, 0, 0, 0], [1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 1, 0, 2, 2], [0, 0, 2, 2, 2, 0, 2, 2, 0, 1, 1, 2, 2, 2, 1, 1, 1, 0, 0], [0, 0, 2, 0, 0, 0, 2, 0, 1, 1, 1, 1, 2, 1, 2, 1, 0, 2, 2], [0, 2, 0, 0, 2, 0, 0, 1, 1, 2, 1, 2, 1, 2, 1, 1, 0, 2, 0], [0, 0, 1, 1, 0, 2, 2, 0, 1, 2, 1, 2, 1, 1, 2, 1, 1, 0, 2], [1, 1, 1, 0, 0, 2, 2, 0, 1, 1, 1, 1, 2, 2, 1, 1, 0, 0, 0], [0, 1, 1, 0, 0, 0, 2, 2, 0, 0, 1, 2, 1, 1, 2, 1, 0, 0, 0], [0, 1, 1, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2, 1, 1, 0], [0, 0, 1, 1, 1, 1, 1, 0, 2, 0, 1, 2, 2, 1, 2, 1, 2, 1, 1], [2, 0, 1, 1, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 2, 1, 2, 1, 2], [0, 0, 1, 2, 2, 1, 1, 1, 0, 2, 0, 1, 2, 1, 2, 1, 1, 1, 2], [2, 0, 1, 1, 2, 2, 1, 1, 0, 0, 0, 1, 2, 1, 2, 2, 2, 2, 1]];

class GoBoard {
    private static readonly WIDTH = 19;
    private static readonly HEIGHT = 19;
    private stones: Stone[][];

    constructor() {
        this.stones = create2dArray<Stone>(GoBoard.WIDTH, GoBoard.HEIGHT, Stone.none);
        // this.stones = SAMPLE_GAME_2;
    }

    public getStones(): readonly Stone[][] {
        return this.stones;
    }

    public putStone(stone: Stone, x: number, y: number): undefined | true {
        if (!this.isValidPosition(x, y)) { return; }
        if (this.stones[y][x] !== Stone.none) { return; }

        this.stones[y][x] = stone;

        this.checkAir(x, y);

        return true;
    }

    private checkAir(originX: number, originY: number) {
        const originStone = this.stones[originY][originX];

        for (const [x, y] of [
            [originX - 1, originY],
            [originX, originY - 1],
            [originX + 1, originY],
            [originX, originY + 1]
        ]) {
            if (
                this.isValidPosition(x, y) &&
                this.stones[y][x] !== originStone
            ) {
                this.checkGroupAir(x, y);
            }
        }

        for (const [x, y] of [
            [originX - 1, originY],
            [originX, originY - 1],
            [originX + 1, originY],
            [originX, originY + 1],
            [originX, originY]
        ]) {
            if (
                this.isValidPosition(x, y) &&
                this.stones[y][x] === originStone
            ) {
                this.checkGroupAir(x, y);
            }
        }
    }

    private checkGroupAir(x: number, y: number): boolean {
        const stoneType = this.stones[y][x];

        if (stoneType === Stone.none) {
            return true;
        }

        const checkGroupQue: [number, number][] = [[x, y]];
        const inGroup: [number, number][] = [];
        const checkedBoard: boolean[][] = create2dArray<boolean>(GoBoard.WIDTH, GoBoard.HEIGHT, false);

        while (checkGroupQue.length > 0) {
            const [x, y] = checkGroupQue.pop()!;

            if (!this.isValidPosition(x, y)) { continue; }
            if (checkedBoard[y][x]) { continue; }

            const stone = this.stones[y][x];
            if (stone === Stone.none) { return true; }

            if (stone === stoneType) {
                checkedBoard[y][x] = true;
                inGroup.push([x, y]);
                checkGroupQue.push(
                    [x - 1, y],
                    [x, y - 1],
                    [x + 1, y],
                    [x, y + 1]
                );
            }
        }

        for (const [x, y] of inGroup) {
            this.stones[y][x] = Stone.none;
        }

        return false;
    }

    private isValidPosition(x: number, y: number) {
        return x >= 0 && x < GoBoard.WIDTH && y >= 0 && y < GoBoard.HEIGHT;
    }

    public ownerOfSquare(originX: number, originY: number): Stone {
        const range = 3;

        if (this.stones[originY][originX] !== Stone.none) {
            return this.stones[originY][originX];
        }

        let blackScore = 0;
        let whiteScore = 0;

        for (let y = -range; y <= range; y++) {
            for (let x = -range; x <= range; x++) {
                const currX = x + originX;
                const currY = y + originY;
                if (!this.isValidPosition(currX, currY)) { continue; }

                const stone = this.stones[currY][currX];
                const thisScore = 1 / 2 ** (Math.abs(x) + Math.abs(y));
                if (stone === Stone.white) {
                    whiteScore += thisScore;
                } else if (stone === Stone.black) {
                    blackScore += thisScore;
                }
            }
        }

        if (blackScore === whiteScore) { return Stone.none; }
        if (blackScore > whiteScore) { return Stone.black; }
        else { return Stone.white; }
    }
}

export default GoBoard;