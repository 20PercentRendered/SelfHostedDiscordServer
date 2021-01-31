import { Settings } from "./classes/Settings";
import { Logger } from "@main/logger";
import { ModuleArray } from "./loader";
import { Command, CommandArray } from "./classes/Command";

class ServerData {
    static Instance: ServerData;
    public modules: ModuleArray;
    public settings: Settings;
    public commands: CommandArray;
    constructor() {
        
    }
    init() {
        if (!ServerData.Instance) {
            var logger = new Logger("Init")
            this.settings = new Settings();
            this.settings.port = "8877";

            ServerData.Instance = this;
            logger.info("Begin startup sequence.");
            require('./loader').init();
            ServerData.Instance = this;
        } else {
            return ServerData.Instance;
        }
    }
}
export {ServerData};