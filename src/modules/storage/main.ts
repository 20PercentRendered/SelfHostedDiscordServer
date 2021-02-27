import { FSStorage } from "@lokidb/fs-storage";
import Loki, { Collection } from "@lokidb/loki";
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
		FSStorage.register();
		ServerData.getInstance()
			.modules.getModule<CoreModule>("core")
			.registerCommand("savedbs", this.saveDatabases);
		this.logger = new Logger("Storage");
		if (!fs.existsSync("data")){
			fs.mkdirSync("data");
		}
		this.logger.info("Storage Initialized.");
		try {
			this.getDB("test");
		} catch (e) {
			this.logger.error(e);
		}
		setInterval(()=>{
			this.logger.info("Saving databases.")
			this.saveDatabases();
		}, ServerData.getInstance().settings.autosaveDelay*60000)
		next();
	}
	getDB(name) {
		for (var i in this.instances) {
			if (this.instances[i].name == name) {
				return this.instances[i];
			}
		}
		this.logger.info(`Loading database '${name}'.`);
		var db = new Database(name);
		this.instances.push(db);
		return db;
	}
	saveDatabases(): Promise<void> { return new Promise((resolve,reject)=>{
		var pending = []
		for (var i in this.instances) {
			pending.push(this.instances[i].save());
		}
		Promise.all(pending).then(()=>{
			this.logger.info("Saved databases to disk successfully.")
			resolve();
		}).catch((e)=>{
			this.logger.info("Some databases failed to save. Error: ")
			this.logger.error(e);
			resolve();
		});
	})}
	stop(next: () => void) {
		this.saveDatabases();
		next();
	}
}
export class Database {
	public name: string;
	public items: Collection<object, object, object>;
	private databaseFile: string;
	private database: Loki;
	private logger: Logger;
	constructor(name) {
		this.name = name;
		this.databaseFile = process.cwd() + "/data/" + this.name + ".db";
		this.database = new Loki(this.databaseFile, {
			serializationMethod: "pretty",
		});
		this.items = this.database.addCollection("main");
		this.logger = new Logger(`${this.name}_DB`);
		this.init();
	}
	async init() {
		await this.database.initializePersistence({
			autoload: fs.existsSync(this.databaseFile), // autoload only if file exists
			adapter: new FSStorage(),
			autosave: false // we do autosaving ourselves
		});
	}
	toString() {
		return this.name;
	}
	save(): Promise<void> {
		return new Promise((resolve, reject)=>{
			this.database.saveDatabase().then(()=>{
				this.logger.info(`Saved ${this.name}`);
				resolve();
			}).catch((e)=>{
				reject(e);
			});
		})
	}
}
