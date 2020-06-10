import App from "./App";

class View {
    protected app!: App;

    protected onOpen() { }

    public _open(app: App) {
        this.app = app;
        this.onOpen();
    }
}

export default View;