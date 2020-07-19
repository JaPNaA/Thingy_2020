interface WanaKana {
    bind(elm: HTMLElement): void;
    toHiragana(str: string): string;
}

var wanakana: WanaKana;