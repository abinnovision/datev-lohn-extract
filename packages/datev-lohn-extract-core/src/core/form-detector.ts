import { allFormHandlers, UnknownForm } from "./forms/index.js";

import type { FormType } from "../types.js";
import type { AbstractForm } from "./forms/index.js";

/**
 * Pattern to detect explicit form numbers in documents
 */
const FORM_NUMBER_PATTERN =
	/(?:Form\.-Nr\.|Formular-Nr\.|F\.-Nr\.)\s*:?\s*([A-Z0-9]+)/i;

/**
 * Form type detector - uses form classes for centralized detection
 */
export class FormDetector {
	/**
	 * Detect form type from page text
	 * Uses explicit form number detection only (Form.-Nr., Formular-Nr., F.-Nr.)
	 *
	 * @param text - Page text content
	 * @returns Detected form type code
	 */
	public static detectFormType(text: string): FormType {
		// Try to find explicit form number
		const formMatch = text.match(FORM_NUMBER_PATTERN);
		if (formMatch && formMatch[1]) {
			const formCode = formMatch[1].toUpperCase();

			// Check if we have a handler for this exact form code
			const handler = allFormHandlers.find((f) => f.formType === formCode);
			if (handler) {
				return handler.formType;
			}

			// If we found a form number but no handler, return UNKNOWN
			// (will be handled by UnknownForm and skipped from output)
			return "UNKNOWN";
		}

		// No form number found - mark as unknown
		return "UNKNOWN";
	}

	/**
	 * Get form handler instance for a form type
	 * Returns the appropriate form class instance for extraction
	 *
	 * @param formType - Form type code
	 * @returns Form class instance
	 */
	public static getFormHandler(formType: FormType): AbstractForm<any> {
		// Find matching form handler
		const handler = allFormHandlers.find((f) => f.formType === formType);
		return handler || new UnknownForm();
	}
}
