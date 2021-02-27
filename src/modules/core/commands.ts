import { Command } from "@main/classes/Command";
import { Logger } from "@main/logger";
import { ServerData } from "@main/serverdata";

const fs = require("fs"),
	path = require("path"),
	glob = require("glob"),
	logger = new Logger("Commands"),
	myRL = require("serverline"),
	os = require("os");

export class CommandLibrary {
	private commands: any;
	private commandnames: any;
	constructor() {
		this.commands = new Array<Command>();
		this.commandnames = new Array<string>();
	}
	init() {
		myRL.init();
		glob
			.sync(process.cwd() + "/commands/*")
			.sort()
			.forEach((file) => {
				try {
					var command = new (require(path.resolve(
						"/" + file + "/main"
					)).default)();
					this.commandnames.push(command.name);
					logger.info("Found " + command.name);
					this.commands.push(command);
				} catch (e) {
					logger.error("Failed to load:" + file);
					logger.error(e);
				}
			});
		myRL.setCompletion(this.commandnames);
		logger.info(`Loaded ${this.commands.length} commands.`);
		myRL.setPrompt("> ");
		myRL.on("line", (line) => {
			var params = [];
			params = line.trim().split(/\s+/);
			const commandname = params[0];
			params.shift();
			if (this.commandnames.includes(commandname)) {
				var command = this.commands[this.commandnames.indexOf(commandname)];
				try {
					command.run(params, logger);
				} catch (e) {
					logger.error(e.message);
					logger.error(`Error when executing ${commandname}.`);
				}
			} else {
				logger.error(`Command ${commandname} doesn't exist!`);
			}
		});
		myRL.on("SIGINT", (rl) => {
			logger.warn("Shutting down");
			ServerData.getInstance().loader.requestShutdown("SIGINT received")
		});
	}
	registerCommand(name, cb) {
		this.commandnames.push(name);
		this.commands.push({ run: cb });
		myRL.setCompletion(this.commandnames);
	}
}
