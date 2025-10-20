/**
 * Common Zod schemas for API responses and errors
 * Used across all routes for consistent OpenAPI documentation
 */

import { z } from "zod";

/**
 * Base error response schema
 * Matches the structure from errorToResponse in utils/errors.ts
 */
export const ErrorResponseSchema = z.object({
	error: z.string().describe("Error type/name"),
	message: z.string().describe("Human-readable error message"),
	statusCode: z.number().describe("HTTP status code"),
	details: z
		.unknown()
		.optional()
		.describe("Additional error details (development only)"),
});

/**
 * Specific error response schemas for common HTTP status codes
 */

export const BadRequestErrorSchema = ErrorResponseSchema.describe(
	"Bad Request - Invalid input or validation failed",
);

export const RequestTimeoutErrorSchema = ErrorResponseSchema.describe(
	"Request Timeout - Processing exceeded time limit",
);

export const PayloadTooLargeErrorSchema = ErrorResponseSchema.describe(
	"Payload Too Large - File size exceeds limit",
);

export const InternalServerErrorSchema = ErrorResponseSchema.describe(
	"Internal Server Error - Unexpected server error",
);
