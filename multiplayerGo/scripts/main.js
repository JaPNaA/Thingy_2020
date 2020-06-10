const runCommand = require("./runCommand");

runCommand("http-server public");
require("../build/server/index");
