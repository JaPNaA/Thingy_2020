export function wait(millis: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), millis);
    });
}

export function promptUser(message: string): Promise<string> {
    const promptContainer = document.createElement("elm");
    promptContainer.classList.add("prompt");

    const messageElm = document.createElement("div");
    messageElm.innerHTML = message;
    promptContainer.appendChild(messageElm);

    const input = document.createElement("input");
    const promise: Promise<string> = new Promise(res =>
        input.addEventListener("change", function () {
            res(input.value);
            document.body.removeChild(promptContainer);
        })
    );
    promptContainer.append(input);
    document.body.appendChild(promptContainer);

    return promise;
}

export function getMinuteFloored(): number {
    return Math.floor(Date.now() / 60e3);
}

export function arrayCopy<T extends Array<any>>(arr: T): T {
    // @ts-ignore
    return arr.slice(0);
}
