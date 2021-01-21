import { Loki } from "@lokidb/loki";

import lokidb from "@lokidb/loki";
import { FSStorage } from "@lokidb/fs-storage";
import fs from "fs";
import { Logger } from "@main/logger";
FSStorage.register();
class Database {
    name: string;
    databaseFile: string;
    database: Loki;
    logger: any;
    constructor(name) {
        this.name = name;
        this.databaseFile = process.cwd()+"/data/"+this.name+".db"
        this.database = new lokidb(this.databaseFile,{
            serializationMethod: "pretty"
        });
        this.logger = new Logger('name+"DB"')
        this.init();
    }
    async init() {
        await this.database.initializePersistence({
            autoload: fs.existsSync(this.databaseFile), // autoload only if file exists
            adapter: new FSStorage(),
            autosave: true,
            autosaveInterval: 5
        });
        this.save();
    }
    async save() {
        await this.database.saveDatabase();
        this.logger.info("Persisted database")
    }
}
module.exports = Database;