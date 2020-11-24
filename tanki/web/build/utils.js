export function wait(millis) {
    return new Promise(function (res) {
        setTimeout(function () { return res(); }, millis);
    });
}
export function promptUser(message) {
    var promptContainer = document.createElement("elm");
    promptContainer.classList.add("prompt");
    var messageElm = document.createElement("div");
    messageElm.innerHTML = message;
    promptContainer.appendChild(messageElm);
    var input = document.createElement("input");
    var promise = new Promise(function (res) {
        return input.addEventListener("change", function () {
            res(input.value);
            document.body.removeChild(promptContainer);
        });
    });
    promptContainer.append(input);
    document.body.appendChild(promptContainer);
    return promise;
}
export function getCurrMinuteFloored() {
    return Math.floor(Date.now() / 60e3);
}
export function arrayCopy(arr) {
    // @ts-ignore
    return arr.slice(0);
}
