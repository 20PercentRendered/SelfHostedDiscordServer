import { Logger } from "@main/logger";

const fs = require('fs')
    , path = require( 'path' )
    , glob = require('glob')
    , logger = new Logger("Commands")
    , myRL = require('serverline')
    , os = require('os');
var commands = [];
var commandnames = [];
myRL.init();
glob.sync( process.cwd()+'/commands/*' ).sort().forEach( function( file ) {
    try {
        var command = new (require(path.resolve(process.cwd() + "/"+ file+"/main"))).default;
        logger.info("Found "+ command.name)
        commands.push(command);
    } catch (e) {
        logger.error("Failed to load:" + file)
        logger.error(e);
    }
});
myRL.setCompletion(commandnames);
logger.info(`Loaded ${commands.length} commands.`);
    myRL.setPrompt('> ')
    myRL.on('line', function(line) {
        var params = [];
        params = line.trim().split(/\s+/);
        const commandname = params[0];
        params.shift();
        if (commandnames.includes(commandname)) {
            var command = commands[commandnames.indexOf(commandname)];
            try {
                command.run(params,logger);
            } catch (e) {
                logger.error(e.message);
                logger.error(`Error when executing ${commandname}.`)
            }
        } else {
            logger.error(`Command ${commandname} doesn't exist!`)
        }
    })
myRL.on('SIGINT', function(rl) {
    logger.warn("Shutting down");
    process.exit(0);
})
function registerCommand(name, cb) {
    commandnames.push(name);
    commands.push({run: cb});
    myRL.setCompletion(commandnames);
}
global['commands'].registerCommand = registerCommand;

export {};