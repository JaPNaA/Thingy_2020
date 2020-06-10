const runCommand = require("./runCommand");

runCommand("tsc -b configs/tsconfig.client.json configs/tsconfig.server.json configs/tsconfig.shared.json -w");
runCommand("webpack --config configs/webpack.dev.config.js");
