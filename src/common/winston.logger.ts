import { LoggerService } from "@nestjs/common";
import { createLogger, Logger } from "winston";
import { loggerConfig } from "./logger.config";

export class WinstonLogger implements LoggerService {
    private logger: Logger;

    constructor() {
        this.logger = createLogger(loggerConfig);
    }

    log(message: string, context?: string){
        this.logger.info(message, {context});
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { trace, context });
    }

    warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }

    debug(message: string, context?: string) {
        this.logger.debug(message, {context});
    }

    verbose(message: string, context?: string){
        this.logger.verbose(message, {context})
    }
}