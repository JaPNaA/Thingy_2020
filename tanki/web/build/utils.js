import { Elm } from "./libs/elements.js";
export function wait(millis) {
    return new Promise(function (res) {
        setTimeout(function () { return res(); }, millis);
    });
}
export function promptUser(message, parent) {
    var promptContainer = new Elm().class("prompt").append(new Elm().append(message));
    var input = document.createElement("input");
    var promise = new Promise(function (res) {
        return input.addEventListener("change", function () {
            res(input.value);
            promptContainer.remove();
        });
    });
    promptContainer.append(input);
    //* abbr -> temp fix; this function is temporary anyway
    (parent || new Elm(document.body)).append(promptContainer);
    return promise;
}
export function getCurrMinuteFloored() {
    return Math.floor(Date.now() / 60e3);
}
export function arrayCopy(arr) {
    // @ts-ignore
    return arr.slice(0);
}
