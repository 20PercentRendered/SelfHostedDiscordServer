import FSStorage from "@lokidb/fs-storage";
import Loki from "@lokidb/loki";
import { Logger } from "@main/logger";
import fs from "fs";
import { ServerData } from "@main/serverdata";
import { BaseModule } from "@main/classes/modules/BaseModule";
import CoreModule from "@main/modules/core/main";

export default class StorageModule implements BaseModule {
	public readonly name: string = "Storage Module";
	public readonly intName: string = "storage";
	public readonly version: number = 1;
	readonly dependencies = new Array<string>("core");
	private instances = [];
	private logger: Logger;
	init(next: () => void) {
		ServerData.getInstance()
			.modules.getModule<CoreModule>("core")
			.registerCommand("savedbs", this.saveDatabases);
		this.logger = new Logger("Storage");
		this.logger.info("Storage Initialized.");
		next();
	}
	getDB(name) {
		for (var i in this.instances) {
			if (this.instances[i].name == name) {
				return this.instances[i];
			}
		}
		this.logger.info("Creating new database '" + name + "'");
		var db = new Database(name);
		this.instances.push(db);
		return db;
	}
	saveDatabases() {
		for (var i in this.instances) {
			this.instances[i].save();
		}
	}
	stop(next: () => void) {
		this.saveDatabases();
		next();
	}
}
export class Database {
	name: string;
	databaseFile: string;
	database: Loki;
	logger: Logger;
	constructor(name) {
		this.name = name;
		this.databaseFile = process.cwd() + "/data/" + this.name + ".db";
		this.database = new Loki(this.databaseFile, {
			serializationMethod: "pretty",
		});
		this.logger = new Logger('name+"DB"');
		this.init();
	}
	async init() {
		await this.database.initializePersistence({
			autoload: fs.existsSync(this.databaseFile), // autoload only if file exists
			adapter: new FSStorage(),
			autosave: true,
			autosaveInterval: 5,
		});
		this.save();
	}
	async save() {
		await this.database.saveDatabase();
		this.logger.info("Persisted database");
	}
}
