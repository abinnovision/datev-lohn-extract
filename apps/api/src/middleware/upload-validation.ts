/**
 * Upload validation middleware
 * Validates file uploads for security and prevents attack vectors
 */

import { env } from "../env.js";
import { FileValidationError, FileTooLargeError } from "../utils/errors.js";

/**
 * Validate Content-Length header to prevent oversized uploads
 * @throws {FileTooLargeError} If Content-Length exceeds MAX_FILE_SIZE
 */
export function validateContentLength(contentLength: string | null): void {
	if (!contentLength) {
		throw new FileValidationError(
			"Content-Length header is required for file uploads",
		);
	}

	const size = Number(contentLength);
	if (isNaN(size) || size <= 0) {
		throw new FileValidationError("Invalid Content-Length header");
	}

	if (size > env.APP_MAX_FILE_SIZE) {
		throw new FileTooLargeError(size, env.APP_MAX_FILE_SIZE);
	}
}

/**
 * Validate that file buffer is a valid PDF
 * Checks:
 * 1. Buffer is not empty
 * 2. Has PDF magic bytes (%PDF-)
 *
 * @param buffer - File buffer to validate
 * @param contentType - Content-Type header from request
 * @throws {FileValidationError} If validation fails
 */
export function validatePdfBuffer(buffer: Buffer, contentType?: string): void {
	// Check buffer exists and is not empty
	if (!buffer || buffer.length === 0) {
		throw new FileValidationError("Uploaded file is empty");
	}

	// Check Content-Type header
	if (contentType && !contentType.includes("application/pdf")) {
		throw new FileValidationError(
			`Invalid Content-Type: ${contentType}. Expected application/pdf`,
		);
	}

	// Check PDF magic bytes
	const header = buffer.toString("ascii", 0, Math.min(5, buffer.length));
	if (!header.startsWith("%PDF-")) {
		throw new FileValidationError(
			"Invalid PDF file: Missing PDF signature (%PDF-)",
		);
	}

	// Additional size check (defense in depth)
	if (buffer.length > env.APP_MAX_FILE_SIZE) {
		throw new FileTooLargeError(buffer.length, env.APP_MAX_FILE_SIZE);
	}
}

/**
 * Sanitize filename for safe inclusion in ZIP archives
 * Prevents path traversal and other injection attacks
 *
 * @param filename - Original filename
 * @returns Sanitized filename safe for ZIP inclusion
 */
export function sanitizeFilename(filename: string): string {
	return (
		filename
			// Remove path traversal attempts
			.replace(/\.\./g, "")
			// Remove directory separators
			.replace(/[/\\]/g, "_")
			// Remove null bytes
			.replace(/\0/g, "")
			// Remove leading/trailing whitespace and dots
			.trim()
			.replace(/^\.+/, "")
			.replace(/\.+$/, "")
			// Limit length
			.substring(0, 255) || "file"
	); // Fallback if empty after sanitization
}

/**
 * Validate page count to prevent PDF bomb attacks
 * @param pageCount - Number of pages in extracted PDF
 * @throws {FileValidationError} If page count is suspicious
 */
export function validatePageCount(pageCount: number, maxPages = 1000): void {
	if (pageCount > maxPages) {
		throw new FileValidationError(
			`PDF contains ${pageCount} pages, which exceeds the maximum allowed (${maxPages}). This may indicate a PDF bomb attack.`,
		);
	}
}
