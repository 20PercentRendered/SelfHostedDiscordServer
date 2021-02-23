import { Settings } from "@main/classes/Settings";
import { Logger } from "@main/logger";
import { ModuleArray } from "@main/classes/modules/BaseModule";

export class ServerData {
	// Static property to store an instance
	private static instance: ServerData = new ServerData();
	public modules: ModuleArray;
	public settings: Settings;
	private logger: Logger;

	// Constructor is private!
	private constructor() {
		this.modules = new ModuleArray();
		this.settings = new Settings();
	}

	// Static method to retreive the singleton instance
	static getInstance(): ServerData {
		return this.instance;
	}
	// rest of the code
}
