import { ValidationError } from "../errors.js";
import { isLOGN17Page } from "../type-guards.js";

import type { PersonnelGroup } from "../types.js";

/**
 * SEPA transfer generator - generates SEPA transfer data as CSV string
 */
export class SepaTransfersGenerator {
	/**
	 * Generate SEPA transfer CSV data for salary payments.
	 *
	 * Format: beneficiary_name,iban,amount,currency,reference
	 *
	 * @param groups - Personnel groups to generate SEPA transfers for
	 * @returns CSV string with headers and data rows
	 * @throws {ValidationError} If groups array is invalid
	 */
	public generateSepaTransfersCsv(groups: PersonnelGroup[]): string {
		// Validate input
		if (!Array.isArray(groups)) {
			throw new ValidationError("Groups must be an array");
		}

		// CSV header for SEPA transfers
		const headers = "beneficiary_name,iban,amount,currency,reference";
		const csvLines: string[] = [headers];

		// Iterate over the groups and extract the payment information.
		for (const group of groups) {
			// Find LOGN17 page to extract financial data
			const page = group.pages.find(isLOGN17Page);
			if (!page) {
				continue;
			}

			// Extract data
			const beneficiaryName = group.employeeName || "";
			const iban = page?.iban || "";
			const amount = page?.netto || "";
			const currency = "EUR";

			const month = group.dateInfo.month || "";
			const year = group.dateInfo.year || "";

			const reference =
				month && year
					? `Gehalt ${month} ${year} (${group.personnelNumber})`
					: `Gehalt (${group.personnelNumber})`;

			csvLines.push(
				[beneficiaryName, iban, amount, currency, reference]
					.map((v) => `"${v}"`)
					.join(","),
			);
		}

		return csvLines.join("\n");
	}
}
