const childProcess = require("child_process");

/**
 * @argument {String} cmd
 */
module.exports = function runCommand(cmd) {
    const childProc = childProcess.exec(cmd);
    childProc.stdout.pipe(process.stdout);
    childProc.stderr.pipe(process.stderr);
    return childProc;
};