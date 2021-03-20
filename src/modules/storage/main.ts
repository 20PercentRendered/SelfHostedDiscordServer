import { FSStorage } from "@lokidb/fs-storage";
import Loki, { Collection } from "@lokidb/loki";
import { Logger } from "@main/logger";
import fs from "fs";
import { ServerData } from "@main/serverdata";
import { BaseModule } from "@main/classes/modules/BaseModule";
import CoreModule from "@main/modules/core/main";
import { User } from "@main/classes/User";
import { Guild } from "@main/classes/Guild";

export default class StorageModule implements BaseModule {
	public readonly name: string = "Storage Module";
	public readonly intName: string = "storage";
	public readonly version: number = 1;
	public userDatabase: Database<User>;
	public guildDatabase: Database<Guild>;
	readonly dependencies = new Array<string>("core");
	private instances = [];
	private logger: Logger;
	init(next: () => void) {
		FSStorage.register();
		ServerData.getInstance()
			.modules.getModule<CoreModule>("core")
			.registerCommand("savedbs", ()=>{
				this.saveDatabases();
			});
		this.logger = new Logger("Storage");
		if (!fs.existsSync("data")){
			fs.mkdirSync("data");
		}
		this.userDatabase = this.getDB<User>("users");
		this.guildDatabase = this.getDB<Guild>("guilds");
		this.logger.info("Storage Initialized.");
		setInterval(()=>{
			this.logger.info("Saving databases.")
			this.saveDatabases();
		}, ServerData.getInstance().settings.autosaveDelay*60000)
		next();
	}
	getDB<T1>(name): Database<T1> {
		for (var i in this.instances) {
			if (this.instances[i].name == name) {
				return this.instances[i];
			}
		}
		this.logger.info(`Loading database '${name}'.`);
		var db = new Database<T1>(name);
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
		this.saveDatabases().finally(()=>{
			next();
		});
	}
}
export class Database<T1 extends any> {
	public readonly name: string;
	private databaseFile: string;
	public database: Array<T1>;
	private logger: Logger;
	constructor(name) {
		this.name = name;
		this.logger = new Logger(`${this.name}_DB`);
		this.databaseFile = process.cwd() + "/data/" + this.name + ".db";
		try {
			this.database = JSON.parse(fs.readFileSync(this.databaseFile).toString())
		} catch (e) {
			this.logger.error("Failed to load from disk. Error: ")
			this.logger.error(e);
			this.database = new Array<T1>();
		}
		if (JSON.stringify(this.database) == "{}") {
			this.database = new Array<T1>();
		}
	}
	toString() {
		return this.name;
	}
	save(): Promise<void> {
		return new Promise((resolve, reject)=>{
			fs.promises.writeFile(this.databaseFile, JSON.stringify(this.database, null, 4))
			.then(() => {
				this.logger.info(`Saved ${this.name}`);
				resolve();
			}).catch((e)=>{
				reject(e);
			});
		})
	}
}
