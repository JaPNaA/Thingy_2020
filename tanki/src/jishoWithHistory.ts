import { EventHandler } from "./utils.js";

class JishoWithHistory {
    public getData = new EventHandler<string>();

    constructor() {
        addEventListener("message", e => {
            if (e.data === "get:jishoWithHistoryRecieverName") {
                // @ts-ignore
                e.source?.postMessage("tanki", "*");
            }

            const exportPrefix = "export:";
            if (typeof e.data === "string" && e.data.startsWith(exportPrefix)) {
                this.getData.dispatch(e.data.slice(exportPrefix.length));
            }
        });
    }

    public openWindow() {
        window.open(
            "jishoWithHistory/index.html", "",
            "width=612,height=706"
        );
    }
}

const jishoWithHistory = new JishoWithHistory();

export default jishoWithHistory;
