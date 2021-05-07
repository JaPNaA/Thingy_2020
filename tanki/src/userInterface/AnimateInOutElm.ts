import { Component } from "../libs/elements.js";
import { wait } from "../utils.js";

export default abstract class AnimateInOutElm extends Component {
    protected abstract animationOutTime: number;

    constructor(name: string) {
        super(name);

        this.elm.class("animatedInOutElm");
        this.show();
    }

    public async remove() {
        await this.hide();
        this.elm.remove();
    }

    protected async show() {
        await wait(1);
        this.elm.class("showing");
    }

    protected async hide() {
        this.elm.removeClass("showing");
        await wait(this.animationOutTime);
    }
}
