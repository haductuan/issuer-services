import winston from "winston";
import { isProduction } from "../../common/config/secrets.js";

const logger = winston.createLogger({
    level: 'debug',
    levels: winston.config.npm.levels,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
        winston.format.colorize({ all: true }),
        winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
    ),
    transports: isProduction ? [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/all.log' }),
    ] : [
        new winston.transports.Console(),
    ],
})

export default logger