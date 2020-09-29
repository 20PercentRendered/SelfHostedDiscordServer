const winston = require('winston');
const moment = require('moment');
const colors = require('colors');
const formattedTime = ()=>{ return moment().format('HH:mm:ss') }

function create(name) {

    const myFormat = winston.format.printf(({ level, message }) => {
        return `${colors.blue(formattedTime())} [${level}] [${name}] ${message}`;
    });
    return winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.colorize(),
            myFormat
        ),
        transports: [
          //
          // - Write all logs with level `error` and below to `error.log`
          // - Write all logs with level `info` and below to `combined.log`
          //
          new winston.transports.File({ format: winston.format.combine(winston.format.uncolorize()), filename: `./logs/${moment().format("YYYY_MM_DD")}.log` }),
          new winston.transports.Console()
        ]
    });
}
module.exports.create = create;