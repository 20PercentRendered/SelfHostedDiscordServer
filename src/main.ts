import { Logger } from "./logger";
import { ServerData } from "./serverdata";
// app sometimes exits without an exit code, this is a "bodge" to temp fix things
process.on('uncaughtException', function (err) {
    console.error(err);
    process.exit(1);
})
// Load everything
ServerData.getInstance();
process.on('unhandledRejection', function(reason, promise){
    console.error(reason)
    if (ServerData.getInstance().settings.exitOnPromiseReject) {
        process.exit(1);
    }
});
var logger = new Logger("Init");
logger.info("Begin startup sequence.");
require("./loader").init();