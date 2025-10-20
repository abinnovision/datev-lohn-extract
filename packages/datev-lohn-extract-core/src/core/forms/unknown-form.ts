import { AbstractForm } from "./abstract-form.js";

import type { UnknownPage } from "../../types.js";

/**
 * Unknown Form - Fallback handler for unrecognized form types
 * No extraction attempts - just stores the detected form code if available
 */
export class UnknownForm extends AbstractForm<UnknownPage> {
	public readonly formType = "UNKNOWN" as const;
	public readonly name = "Unbekanntes Formular";

	// Patterns for extraction
	private readonly FORM_NUMBER_PATTERN =
		/(?:Form\.-Nr\.|Formular-Nr\.|F\.-Nr\.)\s*:?\s*([A-Z0-9]+)/i;
	private readonly DATE_PATTERN =
		/(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/i;

	public extractMetadata(
		text: string,
		pageIndex: number,
		rawText: string,
	): UnknownPage {
		return {
			formType: this.formType,
			pageIndex,
			rawText,

			// Try to extract the form code if present
			detectedFormCode: this.extractFormCode(text),

			// No personnel extraction
			personnelNumber: null,
			employeeName: null,

			// Extract date for grouping purposes
			year: this.extractYear(text),
			month: this.extractMonth(text),

			// Flags
			isFirstPage: true, // Assume first page since we can't determine
			isCompanyWide: true, // Assume company-wide since we have no personnel info
		};
	}

	public isFirstPage(_text: string): boolean {
		return true; // Can't determine, assume true
	}

	// ============================================================================
	// Private Extraction Methods
	// ============================================================================

	/**
	 * Extract form code from explicit form number if present
	 */
	private extractFormCode(text: string): string | null {
		const match = text.match(this.FORM_NUMBER_PATTERN);
		return match && match[1] ? match[1].toUpperCase() : null;
	}

	/**
	 * Extract year from date in text (only recent years to avoid footnotes)
	 */
	private extractYear(text: string): string | null {
		const dateMatch = text.match(this.DATE_PATTERN);
		if (dateMatch && dateMatch[2]) {
			const year = parseInt(dateMatch[2], 10);
			// Only accept years >= 2020 to filter out historical references in footnotes
			if (year >= 2020) {
				return dateMatch[2];
			}
		}
		return null;
	}

	/**
	 * Extract month name from date in text (only recent years to avoid footnotes)
	 */
	private extractMonth(text: string): string | null {
		const dateMatch = text.match(this.DATE_PATTERN);
		if (dateMatch && dateMatch[2]) {
			const year = parseInt(dateMatch[2], 10);
			// Only accept years >= 2020 to filter out historical references in footnotes
			if (year >= 2020 && dateMatch[1]) {
				return dateMatch[1];
			}
		}
		return null;
	}
}
