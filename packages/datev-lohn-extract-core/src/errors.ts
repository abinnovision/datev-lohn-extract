/**
 * Custom error classes for DATEV extraction operations
 */

/**
 * Base error class for all DATEV extraction errors
 */
export class DatevExtractionError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "DatevExtractionError";
		Object.setPrototypeOf(this, DatevExtractionError.prototype);
	}
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends DatevExtractionError {
	public constructor(message: string) {
		super(message);
		this.name = "ValidationError";
		Object.setPrototypeOf(this, ValidationError.prototype);
	}
}

/**
 * Error thrown when PDF extraction fails
 */
export class ExtractionError extends DatevExtractionError {
	public constructor(
		message: string,
		public readonly pageIndex?: number,
	) {
		super(pageIndex !== undefined ? `Page ${pageIndex}: ${message}` : message);
		this.name = "ExtractionError";
		Object.setPrototypeOf(this, ExtractionError.prototype);
	}
}

/**
 * Error thrown when form detection fails
 */
export class FormDetectionError extends DatevExtractionError {
	public constructor(
		message: string,
		public readonly formType?: string,
	) {
		super(formType ? `Form ${formType}: ${message}` : message);
		this.name = "FormDetectionError";
		Object.setPrototypeOf(this, FormDetectionError.prototype);
	}
}

/**
 * Error thrown when PDF generation fails
 */
export class PdfGenerationError extends DatevExtractionError {
	public constructor(message: string) {
		super(message);
		this.name = "PdfGenerationError";
		Object.setPrototypeOf(this, PdfGenerationError.prototype);
	}
}
