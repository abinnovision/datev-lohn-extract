import {
	PageExtractor,
	PageGrouper,
	PdfGenerator,
	SepaTransfersGenerator,
} from "@internal/datev-lohn-extract-core";
import archiver from "archiver";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";

import { env } from "../env.js";
import {
	sanitizeFilename,
	validateContentLength,
	validatePageCount,
	validatePdfBuffer,
} from "../middleware/upload-validation.js";
import {
	BadRequestErrorSchema,
	InternalServerErrorSchema,
	PayloadTooLargeErrorSchema,
	RequestTimeoutErrorSchema,
} from "../schemas/common.js";
import {
	FileValidationError,
	ProcessingError,
	ProcessingTimeoutError,
	errorToResponse,
} from "../utils/errors.js";

const extractRoutes = new Hono();

// Create extraction pipeline instances
const pageExtractor = new PageExtractor();
const pageGrouper = new PageGrouper();
const pdfGenerator = new PdfGenerator();
const sepaTransfersGenerator = new SepaTransfersGenerator();

/**
 * POST /bundle
 * Upload a DATEV PDF and receive a ZIP bundle with:
 * - Individual personnel PDFs
 * - Company-wide PDFs
 * - SEPA transfers CSV
 * - Metadata JSON with period information
 */
extractRoutes.post(
	"/bundle",
	describeRoute({
		tags: ["Extract"],
		summary: "Extract and bundle DATEV PDF",
		description:
			"Upload a DATEV salary statement PDF and receive a ZIP bundle containing " +
			"individual personnel PDFs, company-wide PDFs, a SEPA transfers CSV file, " +
			"and metadata about the extraction period. " +
			"\n\nSecurity features:\n" +
			"- File size validation (max 50MB)\n" +
			"- File type validation (PDF only)\n" +
			"- Processing timeout (60s)\n" +
			"- Path traversal prevention\n" +
			"- Page count validation (max 1000 pages)",
		requestBody: {
			required: true,
			content: {
				"multipart/form-data": {
					schema: {
						type: "object",
						properties: {
							file: {
								type: "string",
								format: "binary",
								description:
									"PDF file to process (max 50MB). Must be a valid DATEV salary statement PDF.",
							},
						},
						required: ["file"],
					},
				},
			},
		},
		responses: {
			200: {
				description:
					"Successfully processed PDF. Returns ZIP bundle containing personnel PDFs, company PDFs, SEPA CSV, and metadata",
				content: {
					"application/zip": {
						schema: {
							type: "string",
							format: "binary",
							description:
								"ZIP archive containing split PDFs, SEPA transfers CSV, and metadata. " +
								"Contents: personnel PDFs (XXXXX-YYYY-Month.pdf), company PDFs (COMPANY-YYYY-Month.pdf), sepa-transfers.csv, and metadata.json",
						},
					},
				},
			},
			400: {
				description: "Bad Request - Invalid file or validation failed",
				content: {
					"application/json": {
						schema: resolver(BadRequestErrorSchema),
					},
				},
			},
			408: {
				description: "Request Timeout - Processing exceeded time limit",
				content: {
					"application/json": {
						schema: resolver(RequestTimeoutErrorSchema),
					},
				},
			},
			413: {
				description: "Payload Too Large - File size exceeds limit",
				content: {
					"application/json": {
						schema: resolver(PayloadTooLargeErrorSchema),
					},
				},
			},
			500: {
				description: "Internal Server Error - Processing failed",
				content: {
					"application/json": {
						schema: resolver(InternalServerErrorSchema),
					},
				},
			},
		},
	}),
	// eslint-disable-next-line complexity
	async (c) => {
		try {
			// Validate Content-Length header first (before parsing body)
			const contentLength = c.req.header("content-length");
			validateContentLength(contentLength ?? null);

			// Parse multipart form data
			const formData = await c.req.formData();
			const file = formData.get("file");

			if (!file || !(file instanceof File)) {
				throw new FileValidationError(
					'No file uploaded. Include a file in the "file" field of multipart/form-data',
				);
			}

			// Read file buffer
			const arrayBuffer = await file.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			// Validate PDF
			validatePdfBuffer(buffer, file.type);

			// Extract with timeout using individual classes
			const extractionPromise = (async () => {
				// Step 1: Extract pages from PDF
				const extractedPages = await pageExtractor.extractPages(buffer);

				// Step 2: Group pages by personnel
				const groupedPages = pageGrouper.groupByPersonnel(extractedPages);

				// Step 3: Generate PDFs
				const personnelPdfs = await Promise.all(
					groupedPages.personnelGroups.map((group) =>
						pdfGenerator.generatePersonnelPdf(group, buffer),
					),
				);

				const companyPdfs = await Promise.all(
					groupedPages.companyGroups.map((group) =>
						pdfGenerator.generateCompanyPdf(group, buffer),
					),
				);

				// Step 4: Generate SEPA transfers CSV
				const sepaTransfersCsv =
					sepaTransfersGenerator.generateSepaTransfersCsv(
						groupedPages.personnelGroups,
					);

				return { personnelPdfs, companyPdfs, sepaTransfersCsv };
			})();

			const timeoutPromise = new Promise<never>((_, reject) => {
				setTimeout(
					() => reject(new ProcessingTimeoutError(env.APP_PROCESSING_TIMEOUT)),
					env.APP_PROCESSING_TIMEOUT,
				);
			});

			const result = await Promise.race([extractionPromise, timeoutPromise]);

			// Validate page count (sum of all PDFs)
			const totalPages = result.personnelPdfs.reduce(
				(sum: number, pdf) => sum + pdf.pageCount,
				0,
			);

			validatePageCount(totalPages, env.APP_MAX_PAGE_COUNT);

			// Create ZIP archive in memory
			const archive = archiver("zip", {
				zlib: { level: 9 }, // Maximum compression
			});

			// Collect chunks as they are emitted
			const chunks: Buffer[] = [];
			let totalSize = 0;
			const MAX_ZIP_SIZE = 100 * 1024 * 1024; // 100MB

			archive.on("data", (chunk: Buffer) => {
				totalSize += chunk.length;
				if (totalSize > MAX_ZIP_SIZE) {
					archive.abort();
					throw new ProcessingError(
						`Generated ZIP exceeds maximum size of ${Math.round(MAX_ZIP_SIZE / 1024 / 1024)}MB`,
					);
				}
				chunks.push(chunk);
			});

			// Handle archive errors
			archive.on("error", (err) => {
				throw new ProcessingError("Failed to create ZIP archive", err);
			});

			// Add personnel PDFs
			for (const pdf of result.personnelPdfs) {
				const filenameParts = [pdf.personnelNumber];
				if (pdf.dateInfo.year && pdf.dateInfo.month) {
					filenameParts.push(pdf.dateInfo.year, pdf.dateInfo.month);
				} else if (pdf.dateInfo.year) {
					filenameParts.push(pdf.dateInfo.year);
				}
				const filename = sanitizeFilename(filenameParts.join("-") + ".pdf");
				archive.append(pdf.data, { name: filename });
			}

			// Add company PDFs
			for (const pdf of result.companyPdfs) {
				const filenameParts = ["COMPANY"];
				if (pdf.dateInfo?.year && pdf.dateInfo?.month) {
					filenameParts.push(pdf.dateInfo.year, pdf.dateInfo.month);
				} else if (pdf.dateInfo?.year) {
					filenameParts.push(pdf.dateInfo.year);
				}
				const filename = sanitizeFilename(filenameParts.join("-") + ".pdf");
				archive.append(pdf.data, { name: filename });
			}

			// Add SEPA transfers CSV
			archive.append(result.sepaTransfersCsv, { name: "sepa-transfers.csv" });

			// Generate and add metadata.json
			// Extract period information from the first personnel PDF (all should have the same period)
			const periodInfo =
				result.personnelPdfs.length > 0
					? result.personnelPdfs[0]?.dateInfo
					: result.companyPdfs.length > 0
						? result.companyPdfs[0]?.dateInfo
						: null;

			const metadata = {
				period: periodInfo
					? {
							year: periodInfo.year || null,
							month: periodInfo.month || null,
						}
					: null,
				fileCount: {
					personnel: result.personnelPdfs.length,
					company: result.companyPdfs.length,
				},
			};

			archive.append(JSON.stringify(metadata, null, 2), {
				name: "metadata.json",
			});

			// Finalize archive and wait for it to finish
			await archive.finalize();

			// Combine all chunks into final buffer
			const zipBuffer = Buffer.concat(chunks);

			// Return ZIP file
			return c.body(zipBuffer, 200, {
				"Content-Type": "application/zip",
				"Content-Disposition": 'attachment; filename="datev-extract.zip"',
			});
		} catch (error) {
			// Handle errors with appropriate status codes
			const response = errorToResponse(error);
			return c.json(response, response.statusCode as any);
		}
	},
);

export { extractRoutes };
