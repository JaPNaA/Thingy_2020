import Stone from "./Stone";
import create2dArray from "../utils/create2dArray";

class GoBoard {
    private static readonly WIDTH = 19;
    private static readonly HEIGHT = 19;
    private stones: Stone[][];

    constructor() {
        this.stones = create2dArray<Stone>(GoBoard.WIDTH, GoBoard.HEIGHT, Stone.none);
    }

    public getStones(): readonly Stone[][] {
        return this.stones;
    }

    public putStone(stone: Stone, x: number, y: number) {
        if (!this.isValidPosition(x, y)) { return; }
        if (this.stones[y][x] !== Stone.none) { return; }

        this.stones[y][x] = stone;

        this.checkAir(x, y);
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
                console.log(this.checkGroupAir(x, y));
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
                console.log(this.checkGroupAir(x, y));
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

    private ownerOfSquare(x: number, y: number): Stone {
        const range = 3;
        const range2 = range * 2;

        const startX = Math.min(Math.max(x - range, 0), GoBoard.WIDTH - range2);
        const startY = Math.min(Math.max(x - range, 0), GoBoard.HEIGHT - range2);

        let blackScore = 0;
        let whiteScore = 0;

        for (let relY = 0; relY < range2; relY++) {
            for (let relX = 0; relX < range2; relX++) {
                const stone = this.stones[startY + relY][startX + relX];
                if (stone === Stone.white) {
                    whiteScore++;
                } else if (stone === Stone.black) {
                    blackScore++;
                }
            }
        }

        return blackScore > whiteScore ? Stone.black : Stone.white;
    }
}

export default GoBoard;