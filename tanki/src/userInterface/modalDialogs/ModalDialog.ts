import { Elm } from "../../libs/elements.js";
import AnimateInOutElm from "../AnimateInOutElm.js";

export abstract class ModalDialog extends AnimateInOutElm {
    protected foregroundElm: Elm;
    protected animationOutTime = 500;

    constructor(name: string) {
        super(name);
        this.class("modalDialog");

        this.append(
            new Elm().class("modalBackground")
                .on("click", () => this.remove()),
            this.foregroundElm = new Elm().class("modalForeground").appendTo(this.elm)
        );
    }

    public setPositionFixed() {
        this.class("positionFixed");
        return this;
    }
}
