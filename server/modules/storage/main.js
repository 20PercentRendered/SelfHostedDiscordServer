const logger = require('../../logger').create("Storage");

function init(next) {
    logger.info("Storage Initialized.")
    next();
}

module.exports.init = init;