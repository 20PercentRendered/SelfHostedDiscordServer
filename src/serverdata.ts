import { Settings } from "@main/classes/Settings";
import { Logger } from "@main/logger";
import { ModuleArray } from "@main/classes/modules/BaseModule";
import { Loader } from "@main/classes/Loader";

export class ServerData {
	// Static property to store an instance
	private static instance: ServerData = new ServerData();
	public modules: ModuleArray;
	public settings: Settings;
	public loader: Loader;
	public publicIp: string;
    public internalIps: string[];
    public dnsName: string;

	// Constructor is private!
	private constructor() {
		this.modules = new ModuleArray();
		this.settings = new Settings();
		this.internalIps = new Array<string>();
		if (this.settings.port=="443") {
			this.dnsName = "127.0.0.1"
		} else {
			this.dnsName = "127.0.0.1:"+this.settings.port;
		}
	}

	// Static method to retreive the singleton instance
	static getInstance(): ServerData {
		return this.instance;
	}
	// rest of the code
}
