const logger = require('../../logger').create("Storage")
const Database = require('./database')
var instances = [];
//required for tsc
import moduleConfig from './module.json'

function init(next) {
    global['commands'].registerCommand("savedbs", saveDatabases)
    logger.info("Storage Initialized.")
    next();
}
function getDB(name) {
    for (var i in instances) {
        if (instances[i].name == name) {
            return instances[i];
        }
    }
    logger.info("Creating new database '"+name+"'")
    var db = new Database(name);
    instances.push(db)
    return db;
}
function saveDatabases() {
    for (var i in instances) {
        instances[i].save();
    }
}

export {init}
global['storage'] = {}
global['storage'].getDB = getDB;
