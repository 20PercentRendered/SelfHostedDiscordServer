import { Logger } from "./logger";
import { ServerData } from "./serverdata";

// Load everything
ServerData.getInstance();
var logger = new Logger("Init");
logger.info("Begin startup sequence.");
require("./loader").init();
