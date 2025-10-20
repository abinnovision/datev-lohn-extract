/**
 * Type guard functions for extracted page types
 * These helper functions enable TypeScript type narrowing for discriminated unions
 */

import type {
	ExtractedPage,
	LOGN17Page,
	LOMS05Page,
	UnknownPage,
} from "./types.js";

/**
 * Type guard to check if a page is a LOGN17 (employee salary statement) page
 *
 * @example
 * ```typescript
 * if (isLOGN17Page(page)) {
 *   // TypeScript now knows page is LOGN17Page
 *   console.log(page.iban); // OK - iban exists on LOGN17Page
 * }
 * ```
 *
 * @param page - The extracted page to check
 * @returns true if page is a LOGN17Page
 */
export function isLOGN17Page(page: ExtractedPage): page is LOGN17Page {
	return page.formType === "LOGN17";
}

/**
 * Type guard to check if a page is a LOMS05 (social security notification) page
 *
 * @example
 * ```typescript
 * if (isLOMS05Page(page)) {
 *   // TypeScript now knows page is LOMS05Page
 *   console.log(page.personnelNumber); // OK - personnelNumber exists
 * }
 * ```
 *
 * @param page - The extracted page to check
 * @returns true if page is a LOMS05Page
 */
export function isLOMS05Page(page: ExtractedPage): page is LOMS05Page {
	return page.formType === "LOMS05";
}

/**
 * Type guard to check if a page is an unknown/unrecognized form
 *
 * @example
 * ```typescript
 * if (isUnknownPage(page)) {
 *   // TypeScript now knows page is UnknownPage
 *   console.log(page.detectedFormCode); // OK - detectedFormCode exists
 *   console.log(page.isCompanyWide); // true - always company-wide
 * }
 * ```
 *
 * @param page - The extracted page to check
 * @returns true if page is an UnknownPage
 */
export function isUnknownPage(page: ExtractedPage): page is UnknownPage {
	return page.formType === "UNKNOWN";
}

/**
 * Type guard to check if a page belongs to a specific employee (has personnel number)
 *
 * @example
 * ```typescript
 * const employeePages = pages.filter(isEmployeePage);
 * // employeePages contains only LOGN17 and LOMS05 pages
 * ```
 *
 * @param page - The extracted page to check
 * @returns true if page has a personnel number (LOGN17 or LOMS05)
 */
export function isEmployeePage(
	page: ExtractedPage,
): page is LOGN17Page | LOMS05Page {
	return page.formType === "LOGN17" || page.formType === "LOMS05";
}
