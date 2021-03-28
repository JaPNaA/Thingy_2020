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
        resultStr = minsAbs + " minute" + (minsAbs === 1 ? "" : "s");
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
