import CoreModule from "@main/modules/core/main";
import { ServerData } from "@main/serverdata";

/**
 * The base command, you should implement this on every command.
 */
export abstract class Command {
	/**
	 * The name of the command. Required.
	 */
	readonly name: string;
	/**
	 * The run function.
	 * @param args Optional arguments for the command.
	 */
	abstract run(args?);
}
export class CommandArray extends Array<Command> {}
