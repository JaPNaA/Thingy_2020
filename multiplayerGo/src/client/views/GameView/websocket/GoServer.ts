import Server from "./Server";

class GoServer extends Server {
    constructor() {
        super();

        this.send("Test!");
    }
}

export default GoServer;