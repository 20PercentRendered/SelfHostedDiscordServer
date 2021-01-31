import { BaseModule } from "./classes/modules/BaseModule";
import { Logger } from "@main/logger";
import { ServerData } from "@main/serverdata"
import path from 'path';
import glob from 'glob';
const logger = new Logger("Loader");
import dgraph from 'dependency-graph';

export class ModuleArray extends Array<BaseModule> {
    getModule(name: string) {
        return this.find(obj => obj.intName == name)
    }
}
var graph = new dgraph.DepGraph();
var modules: ModuleArray = new ModuleArray();
export function init() {
    logger.info("Loading modules."); 
    glob.sync( 'modules/*' ).sort().forEach( function( file ) {
        try {
            var module = new (require(path.resolve(process.cwd() + "/"+ file+"/main"))).default;
            logger.info("Found "+ module.name)
            graph.addNode(module.intName);
            modules.push(module);
        } catch (e) {
            logger.error("Failed to load:" + file)
            logger.error(e);
        }
    });
    for (var i in modules) {
        var mod = modules[i];
        for (var dep in mod.dependencies) {
            graph.addDependency(mod.intName, mod.dependencies[dep]);
        }
    }
    return loadModules(graph.overallOrder());
}

function loadModules(uninitializedModules) {
    var i = 0;
    var failureCount = 0;
    //self-controllable for loop
    function executeNext() {
        function next() {
            if (i==uninitializedModules.length-1) {
                if (failureCount>0) {
                    logger.info("Failed to load some modules. Failure Count:"+failureCount.toString())
                } else {
                    logger.info("All modules loaded.")
                }
                ServerData.Instance.modules = modules;
                return;
            }
            i++;
            executeNext();
        }
        var item = uninitializedModules[i];
        logger.info(`Initializing ${item} module...`);
        try {
            var mod = modules.find(obj => obj.intName == item)
            mod.init(next);
        } catch (e) {
            logger.error(`Failed to load ${item} module: ${e}`)
            failureCount++
        }
    }
    executeNext();
}