export default function create2dArray<T>(width: number, height: number, fill: T) {
    const arr = [];

    for (let y = 0; y < height; y++) {
        const row = [];

        for (let x = 0; x < width; x++) {
            row.push(fill);
        }

        arr.push(row);
    }

    return arr;
}