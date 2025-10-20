import { AbstractForm } from "./abstract-form.js";

import type { LOMS05Page } from "../../types.js";

/**
 * LOMS05 Form - Social Security Notification (Meldebescheinigung zur Sozialversicherung)
 * Minimal extraction - only personnel number needed for identification
 */
export class LOMS05Form extends AbstractForm<LOMS05Page> {
	public readonly formType = "LOMS05" as const;
	public readonly name = "Meldebescheinigung zur Sozialversicherung";

	// Minimal extraction patterns - only personnel number and date
	private readonly patterns = {
		personnel:
			/(?:Personalnummer|Personal-Nr\.|Pers\.-Nr\.|PN)\s*:?\s*(\d{4,6})/i,
		date: /(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/i,
		pageBreak: /Meldebescheinigung|LOMS05|Sozialversicherung/i,
	};

	public extractMetadata(
		text: string,
		pageIndex: number,
		rawText: string,
	): LOMS05Page {
		return {
			formType: this.formType,
			pageIndex,
			rawText,

			// Minimal identity extraction - only Pers.-Nr. matters
			personnelNumber: this.extractPersonnelNumber(text),
			employeeName: null, // Not extracted from this form

			// Date (monthly)
			year: this.extractYear(text),
			month: this.extractMonth(text),

			// Flags
			isFirstPage: this.isFirstPage(text),
			isCompanyWide: false, // LOMS05 is always per employee
		};
	}

	public isFirstPage(text: string): boolean {
		return this.patterns.pageBreak.test(text);
	}

	/**
	 * Extract personnel number from text
	 */
	private extractPersonnelNumber(text: string): string | null {
		const match = text.match(this.patterns.personnel);
		return match && match[1] ? match[1] : null;
	}

	/**
	 * Extract year from German date format
	 */
	private extractYear(text: string): string | null {
		const match = text.match(this.patterns.date);
		return match && match[2] ? match[2] : null;
	}

	/**
	 * Extract month name from German date format
	 */
	private extractMonth(text: string): string | null {
		const match = text.match(this.patterns.date);
		return match && match[1] ? match[1] : null;
	}
}
