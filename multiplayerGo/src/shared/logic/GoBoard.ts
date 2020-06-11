import Stones from "./Stones";

class GoBoard {
    private static readonly WIDTH = 19;
    private static readonly HEIGHT = 19;
    private stones: Stones[][];

    constructor() {
        this.stones = this.initStones();
    }

    public getStones(): readonly Stones[][] {
        return this.stones;
    }

    public putStone(stone: Stones, x: number, y: number) {
        this.stones[y][x] = stone;
    }

    private initStones(): Stones[][] {
        const stonesArr = [];

        for (let y = 0; y < GoBoard.HEIGHT; y++) {
            const row = [];

            for (let x = 0; x < GoBoard.WIDTH; x++) {
                row.push(Stones.none);
            }

            stonesArr.push(row);
        }

        return stonesArr;
    }
}

export default GoBoard;