import { EventHandler } from "./utils.js";
var JishoWithHistory = /** @class */ (function () {
    function JishoWithHistory() {
        var _this = this;
        this.getData = new EventHandler();
        addEventListener("message", function (e) {
            var _a;
            if (e.data === "get:jishoWithHistoryRecieverName") {
                // @ts-ignore
                (_a = e.source) === null || _a === void 0 ? void 0 : _a.postMessage("tanki", "*");
            }
            var exportPrefix = "export:";
            if (typeof e.data === "string" && e.data.startsWith(exportPrefix)) {
                _this.getData.dispatch(e.data.slice(exportPrefix.length));
            }
        });
    }
    JishoWithHistory.prototype.openWindow = function () {
        window.open("jishoWithHistory/index.html", "", "width=612,height=706");
    };
    return JishoWithHistory;
}());
var jishoWithHistory = new JishoWithHistory();
export default jishoWithHistory;
