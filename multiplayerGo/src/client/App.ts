import View from "./View";

class App {
    private activeViews: View[] = [];

    public elm: HTMLDivElement;

    constructor() {
        this.elm = document.createElement("div");
        this.elm.classList.add("app");

        document.body.appendChild(this.elm);
    }

    public openView(view: View) {
        view._open(this);
        this.activeViews.push(view);
    }
}

export default App;