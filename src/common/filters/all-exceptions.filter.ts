import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name);

	catch(exception: unknown, host: ArgumentsHost): void {
		const context = host.switchToHttp();
		const response = context.getResponse<Response>();

		const mapped = this.mapException(exception);
		if (mapped.statusCode >= 500) {
			this.logger.error(mapped.message);
		}

		response.status(mapped.statusCode).json({
			success: false,
			statusCode: mapped.statusCode,
			message: mapped.message,
		});
	}

	private mapException(exception: unknown): { statusCode: number; message: string } {
		if (exception instanceof HttpException) {
			const statusCode = exception.getStatus();
			const response = exception.getResponse();

			const message =
				typeof response === 'string'
					? response
					: Array.isArray((response as { message?: unknown }).message)
						? String((response as { message: unknown[] }).message.join(', '))
						: String((response as { message?: unknown }).message ?? exception.message);

			return { statusCode, message };
		}

		if (exception instanceof PrismaClientKnownRequestError) {
			if (exception.code === 'P2002') {
				return { statusCode: HttpStatus.CONFLICT, message: 'Email already exists' };
			}
		}

		return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
	}
}