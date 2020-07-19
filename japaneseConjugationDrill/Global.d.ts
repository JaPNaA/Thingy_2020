interface Transformation {
    from: string;
    to: string;
    phrase: unknown;
    from_tags: unknown;
    to_tags: unknown;
    tags: unknown[];
}


// library wanakana

interface Wanakana {
    bind(elm: HTMLElement): void;
    toHiragana(str: string): string;
}

var wanakana: Wanakana;
