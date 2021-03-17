import { Component, Elm } from "../../libs/elements.js";
import { wait } from "../../utils.js";

export abstract class ModalDialog extends Component {
    protected foregroundElm: Elm;

    constructor(name: string) {
        super(name);
        this.class("modalDialog");

        this.append(
            new Elm().class("modalBackground")
                .on("click", () => this.remove()),
            this.foregroundElm = new Elm().class("modalForeground").appendTo(this.elm)
        );

        this.show();
    }

    public setPositionFixed() {
        this.class("positionFixed");
        return this;
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
        await wait(500);
    }
}
