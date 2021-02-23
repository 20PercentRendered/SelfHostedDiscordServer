import { CommandArray } from "@main/classes/Command";
import { BaseModule } from "@main/classes/modules/BaseModule";
import { Logger } from "@main/logger";
import { CommandLibrary } from "./commands";

export default class CoreModule implements BaseModule {
	public readonly name: string = "Core Functionality Module";
	public readonly intName: string = "core";
	public readonly version: number = 1;
	public commands: CommandArray;
	private commandLibrary;
	readonly dependencies = new Array<string>();
	private logger: Logger;
	init(next: () => void) {
		this.logger = new Logger("Core");
		this.commandLibrary = new CommandLibrary();
		this.commandLibrary.init();
		this.logger.info("Commands initialized.");
		next();
	}
	stop(next: () => void) {
		next();
	}
	public registerCommand(name: string, func: () => void) {
		this.commandLibrary.registerCommand(name, func);
	}
}
