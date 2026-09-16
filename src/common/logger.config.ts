import { format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const isProduction = process.env.NODE_ENV === 'production';
const fileRotateTransport = new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxFiles: '14d',
    maxSize: '20m',
    format: format.combine(format.timestamp(), format.json()),
});

const developmentLogger = {
    level: 'debug',
    transports: [
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.printf(({ timestamp, level, message, context, trace }) => {
                    return `${timestamp} [${context}] ${level}: ${message} ${trace ? `\n${trace}` : ''}`;
                })
            )
        })
    ]
}

const productionLogger = {
    level: 'info',
    transports: [
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.json()
            )
        }),
        fileRotateTransport,
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: format.combine(format.timestamp(), format.json())
        })
    ]
}

export const loggerConfig = isProduction ? productionLogger : developmentLogger;