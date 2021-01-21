import winston from 'winston';
import moment from 'moment';
import colors from 'colors';
const formattedTime = ()=>{ return moment().format('HH:mm:ss') }

export class Logger {
    _logger: winston.Logger;
    constructor(name) {
        const myFormat = winston.format.printf(({ level, message }) => {
            return `${colors.blue(formattedTime())} [${level}] [${name}] ${message}`;
        });
        this._logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                myFormat
            ),
            transports: [
              new winston.transports.File({ format: winston.format.combine(winston.format.uncolorize()), filename: process.cwd()+`/logs/${moment().format("YYYY_MM_DD")}.log` }),
              new winston.transports.Console()
            ]
        });
    }
    info(message) {
        this._logger.info(message);
    }
    warn(message) {
        this._logger.warn(message);
    }
    error(message) {
        this._logger.error(message);
    }
}