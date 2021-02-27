import { BaseModule, ModuleArray } from "./classes/modules/BaseModule";
import { Logger } from "@main/logger";
import { ServerData } from "@main/serverdata";
import path from "path";
import glob from "glob";
const logger = new Logger("Loader");
import dgraph from "dependency-graph";
import { Loader } from "@main/classes/Loader";

var graph = new dgraph.DepGraph();
var modules: ModuleArray = new ModuleArray();

export function init() {
	logger.info("Loading modules.");
	glob
		.sync("modules/*")
		.sort()
		.forEach(function (file) {
			try {
				var module = new (require(path.resolve(
					process.cwd() + "/" + file + "/main"
				)).default)();
				logger.info("Found " + getModuleName(module));
				graph.addNode(module.intName);
				modules.push(module);
			} catch (e) {
				logger.error("Failed to load:" + file);
				logger.error(e);
			}
		});
	for (var i in modules) {
		var mod = modules[i];
		for (var dep in mod.dependencies) {
			graph.addDependency(mod.intName, mod.dependencies[dep]);
		}
	}
	logger.debug("Module load order: " + graph.overallOrder());
	ServerData.getInstance().loader = new Loader();
	return loadModules(graph.overallOrder());
}
function getModuleName(module: BaseModule) {
	if (module.name == undefined || null) {
		return module.intName;
	} else {
		return module.name;
	}
}
function loadModules(uninitializedModules) {
	var i = 0;
	var failureCount = 0;
	ServerData.getInstance().modules = new ModuleArray();
	// self-controllable for loop
	function executeNext() {
		var item = uninitializedModules[i];
		var curModule;
		function next() {
			ServerData.getInstance().modules.push(curModule)
			// ServerData.getInstance().modules = modules;
			if (i == uninitializedModules.length - 1) {
				if (failureCount > 0) {
					logger.info(
						"Failed to load some modules. Failure Count:" +
							failureCount.toString()
					);
				} else {
					logger.info("All modules loaded.");
				}
				return;
			}
			i++;
			executeNext();
		}
		logger.info(`Initializing ${item} module...`);
		try {
			var mod = modules.find((obj) => obj.intName == item);
			curModule = mod;
			mod.init(next);
		} catch (e) {
			logger.error(`Failed to load ${item} module: `);
			logger.error(e)
			failureCount++;
		}
	}
	executeNext();
}
