import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class ErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger(ErrorFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest<Request>();
        const response = ctx.getResponse<Response>();
        
        const isHttpException = exception instanceof HttpException;
        const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

        let errorMessage: string | object | unknown;
        const stackTrace = exception instanceof Error ? exception.stack : undefined;

        if (isHttpException) {
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string'){
                errorMessage = exceptionResponse;
            } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
                errorMessage = (exceptionResponse as any).message;
            } else {
                errorMessage = exceptionResponse;
            }
        } else {
            errorMessage = exception instanceof Error ? exception.message : 'An unexpected error occurred';
        }

        const logMessage = `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(errorMessage)}`;

        if (status >= 500) {
            this.logger.error(logMessage, stackTrace);
        } else {
            this.logger.warn(logMessage);
        }

        response.status(status).json({
            message: errorMessage,
            timestamp: new Date().toISOString(),
            path: request.url
        });
    }
}
