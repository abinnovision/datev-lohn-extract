import { PDFDocument } from "pdf-lib";

import { ValidationError, PdfGenerationError } from "../errors.js";

import type {
	PersonnelGroup,
	CompanyGroup,
	GeneratedPersonnelPdf,
	GeneratedCompanyPdf,
} from "../types.js";

/**
 * PDF generator - creates PDF buffers from grouped pages
 */
export class PdfGenerator {
	/**
	 * Generate a PDF buffer for a personnel group
	 *
	 * @param group - Personnel group to generate PDF for
	 * @param sourcePdfBuffer - Original PDF buffer
	 * @returns PDF buffer and metadata
	 * @throws {ValidationError} If group or buffer is invalid
	 * @throws {PdfGenerationError} If PDF generation fails
	 */
	public async generatePersonnelPdf(
		group: PersonnelGroup,
		sourcePdfBuffer: Buffer,
	): Promise<GeneratedPersonnelPdf> {
		// Validate inputs
		this.validatePersonnelGroup(group);
		this.validatePdfBuffer(sourcePdfBuffer);

		try {
			// Create the new PDF.
			const pdfBytes = await this.createNewPdf(
				await PDFDocument.load(sourcePdfBuffer),
				group.pages.map((p) => p.pageIndex),
			);

			return {
				data: Buffer.from(pdfBytes),
				pageCount: group.pages.length,
				personnelNumber: group.personnelNumber,
				employeeName: group.employeeName,
				dateInfo: group.dateInfo,
			};
		} catch (error) {
			if (
				error instanceof ValidationError ||
				error instanceof PdfGenerationError
			) {
				throw error;
			}
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new PdfGenerationError(
				`Failed to generate personnel PDF: ${message}`,
			);
		}
	}

	/**
	 * Generate a PDF buffer for a company group
	 *
	 * @param group - Company group to generate PDF for
	 * @param sourcePdfBuffer - Original PDF buffer
	 * @returns PDF buffer and metadata
	 * @throws {ValidationError} If group or buffer is invalid
	 * @throws {PdfGenerationError} If PDF generation fails
	 */
	public async generateCompanyPdf(
		group: CompanyGroup,
		sourcePdfBuffer: Buffer,
	): Promise<GeneratedCompanyPdf> {
		// Validate inputs
		this.validateCompanyGroup(group);
		this.validatePdfBuffer(sourcePdfBuffer);

		try {
			// Create the new PDF.
			const pdfBytes = await this.createNewPdf(
				await PDFDocument.load(sourcePdfBuffer),
				group.pages.map((p) => p.pageIndex),
			);

			return {
				data: Buffer.from(pdfBytes),
				pageCount: group.pages.length,
				dateInfo: group.dateInfo,
			};
		} catch (error) {
			if (
				error instanceof ValidationError ||
				error instanceof PdfGenerationError
			) {
				throw error;
			}
			const message = error instanceof Error ? error.message : "Unknown error";
			throw new PdfGenerationError(
				`Failed to generate company PDF: ${message}`,
			);
		}
	}

	/**
	 * Create a new PDF from a source document and a list of page indices
	 */
	private async createNewPdf(
		sourceDocument: PDFDocument,
		includedIndices: number[],
	): Promise<Uint8Array> {
		// Create new PDF
		const newPdf = await PDFDocument.create();

		// Copy pages
		const copiedPages = await newPdf.copyPages(sourceDocument, includedIndices);
		copiedPages.forEach((page) => newPdf.addPage(page));

		// Generate PDF bytes
		return await newPdf.save();
	}

	/**
	 * Validate PDF buffer
	 */
	private validatePdfBuffer(buffer: Buffer): void {
		if (!Buffer.isBuffer(buffer)) {
			throw new ValidationError("Source PDF must be a Buffer");
		}
		if (buffer.length === 0) {
			throw new ValidationError("Source PDF buffer is empty");
		}
	}

	/**
	 * Validate personnel group
	 */
	private validatePersonnelGroup(group: PersonnelGroup): void {
		if (!group) {
			throw new ValidationError("Personnel group is required");
		}
		if (!group.pages || group.pages.length === 0) {
			throw new ValidationError("Personnel group must have at least one page");
		}
		if (!group.personnelNumber) {
			throw new ValidationError("Personnel group must have a personnel number");
		}
	}

	/**
	 * Validate company group
	 */
	private validateCompanyGroup(group: CompanyGroup): void {
		if (!group) {
			throw new ValidationError("Company group is required");
		}
		if (!group.pages || group.pages.length === 0) {
			throw new ValidationError("Company group must have at least one page");
		}
	}
}
