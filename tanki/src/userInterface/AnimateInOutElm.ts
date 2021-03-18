import { Component } from "../libs/elements.js";
import { wait } from "../utils.js";

export default abstract class AnimateInOutElm extends Component {
    protected abstract animationOutTime: number;

    constructor(name: string) {
        super(name);

        this.class("animatedInOutElm");
        this.show();
    }

    public async remove() {
        await this.hide();
        super.remove();
    }

    protected async show() {
        await wait(1);
        this.class("showing");
    }

    protected async hide() {
        this.removeClass("showing");
        await wait(this.animationOutTime);
    }
}
