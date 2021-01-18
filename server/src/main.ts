import { BaseModule } from "./classes/modules/BaseModule";
import { Logger } from "@main/logger";

class Server {
    private static _instance: Server;
    public modules: Array<BaseModule>;
    constructor() {
        if (!Server._instance) {
            var logger = new Logger("init")
            logger.info("Begin startup sequence.");
            require('./modules/core/commands');
            logger.info("Commands initialized.");
            this.modules = require('./loader').init();
            Server._instance = this;
        }
    }
    public static get Instance()
    {
        return this._instance;
    }
  
}
// Load everything
new Server(); 
export {Server};