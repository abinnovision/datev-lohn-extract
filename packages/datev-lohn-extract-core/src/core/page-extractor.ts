import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { pino } from "pino";

import { ExtractionError, ValidationError } from "../errors.js";
import { FormDetector } from "./form-detector.js";

import type { ExtractedPage } from "../types.js";
import type { Logger } from "pino";

export interface PageExtractorOptions {
	/**
	 * Optional logger instance. If not provided, a silent logger is used.
	 */
	logger?: Logger;
}

/**
 * Page extractor - extraction using form class delegation
 * Orchestrates detection and delegates extraction to form-specific classes
 */
export class PageExtractor {
	private readonly logger: Logger;

	public constructor(options: PageExtractorOptions = {}) {
		// If a logger instance is provided, use it with a child logger
		// Otherwise, use a silent logger
		this.logger =
			options.logger?.child({ name: "PageExtractor" }) ??
			pino({ level: "silent" });
	}

	/**
	 * Extract all pages from a PDF buffer
	 * Returns classified pages with form-specific metadata, no side effects
	 *
	 * @param pdfBuffer - PDF file as Buffer
	 * @returns Array of extracted pages with typed metadata
	 * @throws {ValidationError} If PDF buffer is invalid
	 * @throws {ExtractionError} If PDF loading or extraction fails
	 */
	public async extractPages(pdfBuffer: Buffer): Promise<ExtractedPage[]> {
		// Validate input
		this.validatePdfBuffer(pdfBuffer);

		// Load PDF with pdf.js for text extraction
		const data = new Uint8Array(pdfBuffer);
		const loadingTask = pdfjsLib.getDocument({
			data,
			useWorkerFetch: false,
			isEvalSupported: false,
			useSystemFonts: true,
		});

		let pdfDoc;
		try {
			pdfDoc = await loadingTask.promise;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new ExtractionError(`Failed to load PDF: ${message}`);
		}

		const numPages = pdfDoc.numPages;

		this.logger.info(`Extracted %d page(s) from PDF`, numPages);

		const extractedPages: ExtractedPage[] = [];

		// Process each page
		for (let pageNum = 1; pageNum <= numPages; pageNum++) {
			try {
				const page = await pdfDoc.getPage(pageNum);
				const extractedPage = await this.extractSinglePage(page, pageNum - 1);
				extractedPages.push(extractedPage);

				this.logger.debug(
					{ pageIndex: pageNum - 1, formType: extractedPage.formType },
					`Extracted page %d: %s`,
					pageNum - 1,
					extractedPage.formType,
				);
			} catch (error) {
				if (error instanceof ExtractionError) {
					throw error;
				}
				const message =
					error instanceof Error ? error.message : "Unknown error";

				throw new ExtractionError(
					`Failed to extract page: ${message}`,
					pageNum - 1,
				);
			}
		}

		// Clean up pdf.js document
		await pdfDoc.cleanup();

		return extractedPages;
	}

	/**
	 * Extract a single page with all metadata
	 * Delegates to the appropriate form class for extraction
	 *
	 * @param page - PDF.js page object
	 * @param pageIndex - 0-based page index
	 * @returns Extracted page with form-specific metadata
	 */
	private async extractSinglePage(
		page: pdfjsLib.PDFPageProxy,
		pageIndex: number,
	): Promise<ExtractedPage> {
		// Extract text from page
		const rawText = await this.extractPageText(page);

		// Detect form type
		const formType = FormDetector.detectFormType(rawText);

		// Get appropriate form handler
		const formHandler = FormDetector.getFormHandler(formType);

		this.logger.debug(
			{ pageIndex, formType: formHandler.formType },
			`Extracting page %d with %s handler`,
			pageIndex,
			formHandler.name,
		);

		// Delegate extraction to form-specific class
		// Each form class returns its own typed metadata
		return formHandler.extractMetadata(rawText, pageIndex, rawText);
	}

	/**
	 * Extract text from a single PDF page using pdf.js
	 *
	 * @param page - PDF.js page object
	 * @returns Extracted text content
	 */
	private async extractPageText(page: pdfjsLib.PDFPageProxy): Promise<string> {
		const textContent = await page.getTextContent();

		// Combine all text items into a single string
		return textContent.items.map((item: any) => item.str).join(" ");
	}

	/**
	 * Validate PDF buffer input
	 *
	 * @param pdfBuffer - Buffer to validate
	 * @throws {ValidationError} If buffer is invalid
	 */
	private validatePdfBuffer(pdfBuffer: Buffer): void {
		if (!Buffer.isBuffer(pdfBuffer)) {
			throw new ValidationError(
				"Input must be a Buffer. Received: " + typeof pdfBuffer,
			);
		}

		if (pdfBuffer.length === 0) {
			throw new ValidationError("PDF buffer is empty");
		}

		// Check for PDF signature (%PDF-)
		const header = pdfBuffer.toString(
			"ascii",
			0,
			Math.min(5, pdfBuffer.length),
		);

		if (!header.startsWith("%PDF-")) {
			throw new ValidationError(
				"Invalid PDF file: Missing PDF signature. Expected %PDF- header.",
			);
		}

		// All validation checks passed
	}
}
