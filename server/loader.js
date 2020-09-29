const fs = require('fs')
    , path = require( 'path' )
    , glob = require('glob')
    , logger = require('./logger').create("Loader")
    , dgraph = require('dependency-graph')
    , util = require('util')
    , events = require('events');

var graph = new dgraph.DepGraph();
var modules = new Map();

function init() {
    logger.info("Loading modules.");  
    var t = loadModulePaths(loadModules);
    loadModules(t);
}

function get(module) {
    if (modules.has(module)) {
        return modules.get(module)
    } else {
        logger.error(`${module} not initialized, yet it has been requested. Are dependencies set correctly?`)
    }
}

function loadModules(modulePaths) {
    //self-controllable for loop
    var i = 0;
    function executeNext() {
        function next() {
            if (i==modulePaths.length-1) {
                logger.info("All modules loaded.")
                return;
            }
            i++;
            executeNext();
        }
        var item = modulePaths[i];
        logger.info(`Loading ${item} module...`);
        var loadedmodule = require(`./modules/${item}/main.js`);
        loadedmodule.init(next);
        modules.set(item, loadedmodule);
    }
    executeNext();
}

function loadModulePaths() {
    var moduleInfo = [];
    glob.sync( './modules/*/module.json' ).sort().forEach( function( file ) {
        var info = require( path.resolve( file ) );
        graph.addNode(info.name);
        moduleInfo.push(info);
    });
    for (i in moduleInfo) {
        var mod = moduleInfo[i];
        for (dep in mod.dependencies) {
            graph.addDependency(mod.name, mod.dependencies[dep]);
        }
    }
    return graph.overallOrder();
}

module.exports.init = init;
module.exports.get = get;