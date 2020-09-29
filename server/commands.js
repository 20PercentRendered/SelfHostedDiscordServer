//eventually modularize
const fs = require('fs')
    , path = require( 'path' )
    , glob = require('glob')
    , logger = require('./logger').create("Commands")
    , myRL = require('serverline')
    , os = require('os');
var commands = [];
var commandnames = [];
myRL.init();
glob.sync( './commands/*/command.json' ).forEach( function( file ) {
    var command = require(path.resolve( file ));
    commandnames.push(command.name);
    commands.push(require(`${file}/../${command.file}`));
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