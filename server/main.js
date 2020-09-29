const logger = require("./logger").create("Init");
logger.info("Begin startup sequence.");
require('./commands');
logger.info("Commands initialized.");
require('./loader').init();
