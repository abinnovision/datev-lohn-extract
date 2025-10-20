/**
 * Custom error classes for API operations
 * Provides structured error responses with appropriate HTTP status codes
 */

/**
 * Base API error class
 */
export class ApiError extends Error {
	public constructor(
		message: string,
		public readonly statusCode: number,
		public readonly details?: unknown,
	) {
		super(message);
		this.name = "ApiError";
		Object.setPrototypeOf(this, ApiError.prototype);
	}
}

/**
 * Error thrown when file validation fails
 * HTTP 400 Bad Request
 */
export class FileValidationError extends ApiError {
	public constructor(message: string, details?: unknown) {
		super(message, 400, details);
		this.name = "FileValidationError";
		Object.setPrototypeOf(this, FileValidationError.prototype);
	}
}

/**
 * Error thrown when file size exceeds limit
 * HTTP 413 Payload Too Large
 */
export class FileTooLargeError extends ApiError {
	public constructor(
		public readonly fileSize: number,
		public readonly maxSize: number,
	) {
		super(
			`File size ${Math.round(fileSize / 1024 / 1024)}MB exceeds maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB`,
			413,
			{ fileSize, maxSize },
		);
		this.name = "FileTooLargeError";
		Object.setPrototypeOf(this, FileTooLargeError.prototype);
	}
}

/**
 * Error thrown when processing timeout is exceeded
 * HTTP 408 Request Timeout
 */
export class ProcessingTimeoutError extends ApiError {
	public constructor(timeout: number) {
		super(`Processing exceeded timeout of ${timeout}ms`, 408, { timeout });
		this.name = "ProcessingTimeoutError";
		Object.setPrototypeOf(this, ProcessingTimeoutError.prototype);
	}
}

/**
 * Error thrown when processing fails
 * HTTP 500 Internal Server Error
 */
export class ProcessingError extends ApiError {
	public constructor(message: string, cause?: Error) {
		super(
			`Processing failed: ${message}`,
			500,
			cause
				? {
						cause: cause.message,
						stack:
							process.env.NODE_ENV === "development" ? cause.stack : undefined,
					}
				: undefined,
		);
		this.name = "ProcessingError";
		Object.setPrototypeOf(this, ProcessingError.prototype);
	}
}

/**
 * Convert error to safe JSON response
 * Hides internal details in production
 */
export function errorToResponse(error: unknown): {
	error: string;
	message: string;
	statusCode: number;
	details?: unknown;
} {
	if (error instanceof ApiError) {
		return {
			error: error.name,
			message: error.message,
			statusCode: error.statusCode,
			details:
				process.env.NODE_ENV === "development" ? error.details : undefined,
		};
	}

	// Unknown error - hide details in production
	const message =
		error instanceof Error ? error.message : "Unknown error occurred";

	return {
		error: "InternalServerError",
		message:
			process.env.NODE_ENV === "development"
				? message
				: "An internal error occurred",
		statusCode: 500,
		details:
			process.env.NODE_ENV === "development" && error instanceof Error
				? { stack: error.stack }
				: undefined,
	};
}
