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
/**
 * Helper class for constructing element trees
 */
var Elm = /** @class */ (function () {
    function Elm(tagNameOrElement) {
        if (typeof tagNameOrElement === "undefined") {
            // @ts-ignore
            this.elm = document.createElement("div");
        }
        else if (typeof tagNameOrElement === "string") {
            this.elm = document.createElement(tagNameOrElement);
        }
        else {
            this.elm = tagNameOrElement;
        }
    }
    Elm.prototype.withSelf = function (func) {
        func(this);
        return this;
    };
    Elm.prototype.class = function () {
        var _a;
        var classNames = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            classNames[_i] = arguments[_i];
        }
        (_a = this.elm.classList).add.apply(_a, classNames);
        return this;
    };
    Elm.prototype.removeClass = function (className) {
        this.elm.classList.remove(className);
    };
    Elm.prototype.append = function () {
        var elms = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elms[_i] = arguments[_i];
        }
        for (var _a = 0, elms_1 = elms; _a < elms_1.length; _a++) {
            var elm = elms_1[_a];
            this.elm.appendChild(this._anyToNode(elm));
        }
        return this;
    };
    Elm.prototype.appendAsFirst = function (elm) {
        this.elm.insertBefore(this._anyToNode(elm), this.elm.firstChild);
    };
    Elm.prototype.appendTo = function (parent) {
        if (parent instanceof Elm) {
            parent.append(this.elm);
        }
        else {
            parent.appendChild(this.elm);
        }
        return this;
    };
    Elm.prototype.clear = function () {
        while (this.elm.firstChild) {
            this.elm.removeChild(this.elm.firstChild);
        }
    };
    Elm.prototype.replaceContents = function () {
        var elms = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            elms[_i] = arguments[_i];
        }
        this.clear();
        this.append.apply(this, elms);
    };
    Elm.prototype.remove = function () {
        var parent = this.elm.parentElement;
        if (parent) {
            parent.removeChild(this.elm);
        }
    };
    Elm.prototype.on = function (event, handler) {
        // @ts-ignore
        this.elm.addEventListener(event, handler);
        return this;
    };
    /**
     * By click or keyboard
     */
    Elm.prototype.onActivate = function (handler) {
        var _this = this;
        this.on("click", handler);
        this.on("keydown", function (e) {
            if (e.target !== _this.elm) {
                return;
            }
            if (e.keyCode === 13 || e.keyCode === 32) { // enter or space
                handler.call(_this.elm, e);
                e.preventDefault();
            }
        });
        return this;
    };
    Elm.prototype.attribute = function (key, value) {
        this.elm.setAttribute(key, value || "true");
        return this;
    };
    Elm.prototype.getHTMLElement = function () {
        return this.elm;
    };
    Elm.prototype._anyToNode = function (any) {
        if (any instanceof Elm) {
            return any.elm;
        }
        else if (typeof any === "string") {
            return document.createTextNode(any);
        }
        else if (any instanceof Node) {
            return any;
        }
        else if (any !== undefined && any !== null) {
            return document.createTextNode(any.toString());
        }
        else {
            return document.createTextNode("");
        }
    };
    return Elm;
}());
var Component = /** @class */ (function (_super) {
    __extends(Component, _super);
    function Component(name) {
        var _this = _super.call(this) || this;
        _this.name = name;
        _this.class(name);
        return _this;
    }
    return Component;
}(Elm));
export { Component, Elm };
