import App from "./App";
import GameView from "./views/GameView/GameView";

const app = new App();
app.openView(new GameView());

console.log(app);