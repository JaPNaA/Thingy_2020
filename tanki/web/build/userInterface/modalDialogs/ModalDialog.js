var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Elm } from "../../libs/elements.js";
import AnimateInOutElm from "../AnimateInOutElm.js";
var ModalDialog = /** @class */ (function (_super) {
    __extends(ModalDialog, _super);
    function ModalDialog(name) {
        var _this = _super.call(this, name) || this;
        _this.animationOutTime = 500;
        _this.elm.class("modalDialog");
        _this.elm.append(new Elm().class("modalBackground")
            .on("click", function () { return _this.remove(); }), _this.foregroundElm = new Elm().class("modalForeground").appendTo(_this.elm));
        return _this;
    }
    ModalDialog.prototype.setPositionFixed = function () {
        this.elm.class("positionFixed");
        return this;
    };
    return ModalDialog;
}(AnimateInOutElm));
export { ModalDialog };
