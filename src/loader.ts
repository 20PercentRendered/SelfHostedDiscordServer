import { BaseModule } from "./classes/modules/BaseModule";
import { Logger } from "@main/logger";

import path from 'path';
import glob from 'glob';
const logger = new Logger("Loader");
import dgraph from 'dependency-graph';

var graph = new dgraph.DepGraph();

function init() {
    logger.info("Loading modules."); 
    var moduleInfo = [];
    glob.sync( 'modules/*' ).sort().forEach( function( file ) {
        try {
            var info = require( path.resolve( process.cwd() + "/"+ file+"/module.json" ) );
            graph.addNode(info.name);
            moduleInfo.push(info);
        } catch (e) {
            logger.error("Failed to load:" + file)
            logger.error(e);
        }
    });
    for (var i in moduleInfo) {
        var mod = moduleInfo[i];
        for (var dep in mod.dependencies) {
            graph.addDependency(mod.name, mod.dependencies[dep]);
        }
    }
    
    return loadModules(graph.overallOrder());
}

function loadModules(modulePaths) {
    var modules = new Array<BaseModule>();
    var i = 0;
    var failureCount = 0;
    //self-controllable for loop
    function executeNext() {
        function next() {
            if (i==modulePaths.length-1) {
                if (failureCount>0) {
                    logger.info("Failed to load some modules. Failure Count:"+failureCount.toString())
                } else {
                    logger.info("All modules loaded.")
                }
                
                return;
            }
            i++;
            executeNext();
        }
        var item = modulePaths[i];
        logger.info(`Loading ${item} module...`);
        try {
            modules.push(loadModule(item, next));
        } catch (e) {
            logger.error(`Failed to load ${item} module: ${e}`)
            failureCount++
        }
    }
    executeNext();
}

function loadModule(name: String, cb): BaseModule {
    var loadedmodule = require(`./modules/${name}/main`);
    loadedmodule.init(cb);
    return loadedmodule;
}

export {
    init
};