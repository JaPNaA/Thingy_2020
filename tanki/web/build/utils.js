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
import { Elm } from "./libs/elements.js";
export function wait(millis) {
    return new Promise(function (res) {
        setTimeout(function () { return res(); }, millis);
    });
}
export function getCurrMinuteFloored() {
    return Math.floor(Date.now() / 60e3);
}
export function minutesToHumanString(minutes) {
    var minsAbs = Math.abs(minutes);
    var resultStr;
    if (minsAbs < 60) {
        resultStr = Math.round(minsAbs) + " minute" + (minsAbs === 1 ? "" : "s");
    }
    else if (minsAbs < 24 * 60) {
        var hours = Math.round(minsAbs / 60);
        resultStr = hours + " hour" + (hours === 1 ? "" : "s");
    }
    else if (minsAbs < 24 * 60 * 7) {
        var days = Math.round(minsAbs / 60 / 24);
        resultStr = days + " day" + (days === 1 ? "" : "s");
    }
    else {
        var weeks = Math.round(minsAbs / 60 / 24 / 7);
        resultStr = weeks + " week" + (weeks === 1 ? "" : "s");
    }
    if (minutes < 0) {
        resultStr += " ago";
    }
    return resultStr;
}
export var setImmediatePolyfill = window.setImmediate || (function (f) { return setTimeout(f, 1); });
/**
 * Returns the boundary at which isPastCheck first fails
 */
export function binaryBoundarySearch(array, isPastCheck) {
    var bottom = 0;
    var top = array.length;
    // while(true) loop with protection
    for (var i = 0, max = Math.log2(array.length) + 2; i < max; i++) {
        var middle = Math.floor((bottom + top) / 2);
        if (middle === bottom) {
            if (isPastCheck(array[middle])) {
                return top - 1;
            }
            else {
                return top;
            }
        }
        if (isPastCheck(array[middle])) {
            top = middle;
        }
        else {
            bottom = middle;
        }
    }
    throw new Error("Looped too many times. Is array sorted (smallest first)?");
}
export function arrayRemoveTrailingUndefinedOrNull(arr) {
    var i;
    for (i = arr.length - 1; i >= 0; i--) {
        if (arr[i] !== undefined && arr[i] !== null) {
            break;
        }
    }
    // @ts-ignore
    return arr.slice(0, i + 1);
}
var EventHandler = /** @class */ (function () {
    function EventHandler() {
        this.handlers = [];
    }
    EventHandler.prototype.addHandler = function (handler) {
        this.handlers.push(handler);
    };
    EventHandler.prototype.removeHandler = function (handler) {
        var index = this.handlers.indexOf(handler);
        if (index < 0) {
            throw new Error("Can't remove handler that doesn't exist");
        }
        this.handlers.splice(index, 1);
    };
    EventHandler.prototype.dispatch = function (data) {
        for (var _i = 0, _a = this.handlers; _i < _a.length; _i++) {
            var handler = _a[_i];
            handler(data);
        }
    };
    return EventHandler;
}());
export { EventHandler };
export function boundBetween(min, x, max) {
    return Math.min(Math.max(x, min), max);
}
var Watchable = /** @class */ (function () {
    function Watchable(value) {
        this.value = value;
        this.change = new EventHandler();
    }
    Watchable.prototype.get = function () {
        return this.value;
    };
    Watchable.prototype.set = function (v) {
        this.value = v;
        this.change.dispatch(v);
    };
    return Watchable;
}());
export { Watchable };
/**
 * Not to be confused with ReactComponent from React. An element that
 * updates when a watchable updates.
 */
var ReactElm = /** @class */ (function (_super) {
    __extends(ReactElm, _super);
    function ReactElm(type) {
        var _this = _super.call(this, type) || this;
        _this.type = type;
        _this.watchChangeHandler = function () { return _this.update(); };
        _this.watchables = [];
        return _this;
    }
    ReactElm.prototype.update = function () {
        if (this.updateHandler) {
            this.updateHandler(this);
        }
    };
    ReactElm.prototype.setUpdateHandler = function (handler) {
        this.updateHandler = handler;
        return this;
    };
    ReactElm.prototype.addWatchable = function () {
        var watchables = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            watchables[_i] = arguments[_i];
        }
        for (var _a = 0, watchables_1 = watchables; _a < watchables_1.length; _a++) {
            var watchable = watchables_1[_a];
            watchable.change.addHandler(this.watchChangeHandler);
            this.watchables.push(watchable);
        }
        return this;
    };
    ReactElm.prototype.dispose = function () {
        for (var _i = 0, _a = this.watchables; _i < _a.length; _i++) {
            var watchable = _a[_i];
            watchable.change.removeHandler(this.watchChangeHandler);
        }
    };
    return ReactElm;
}(Elm));
export { ReactElm };
