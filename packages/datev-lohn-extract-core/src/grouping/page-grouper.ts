import type { CompanyGroup, ExtractedPage, PersonnelGroup } from "../types.js";

/**
 * Result of grouping operation
 */
export interface PageGrouperResult {
	/**
	 * Groups of pages per personnel number
	 */
	personnelGroups: PersonnelGroup[];
	/**
	 * Company-wide pages grouped by month (if any)
	 */
	companyGroups: CompanyGroup[];
}

/**
 * Page grouper - groups extracted pages by various strategies
 */
export class PageGrouper {
	/**
	 * Group pages by personnel number
	 * Handles both employee-specific and company-wide documents
	 * Skips UNKNOWN form types
	 *
	 * @param pages - Extracted pages to group
	 * @returns Grouping result with personnel groups and company pages
	 */
	public groupByPersonnel(pages: ExtractedPage[]): PageGrouperResult {
		const personnelMap = new Map<string, ExtractedPage[]>();
		const companyPages: ExtractedPage[] = [];

		// Track context for continuation pages
		let currentPersonnelNumber: string | null = null;

		for (const page of pages) {
			// Company-wide pages (including UNKNOWN) ALWAYS go to company group
			if (page.isCompanyWide) {
				companyPages.push(page);
				continue;
			}

			// Update context if we find a personnel number
			if (page.personnelNumber) {
				currentPersonnelNumber = page.personnelNumber;
			}

			// Assign page to appropriate group
			if (currentPersonnelNumber) {
				// Add to personnel group
				if (!personnelMap.has(currentPersonnelNumber)) {
					personnelMap.set(currentPersonnelNumber, []);
				}
				personnelMap.get(currentPersonnelNumber)!.push(page);
			} else {
				// No context - treat as company-wide
				companyPages.push(page);
			}
		}

		// Convert map to personnel groups
		const personnelGroups: PersonnelGroup[] = Array.from(
			personnelMap.entries(),
		).map(([personnelNumber, groupPages]) => {
			const firstPage = groupPages[0]!;

			return {
				personnelNumber,
				employeeName: firstPage.employeeName || "Unknown",
				pages: groupPages,
				dateInfo: {
					year: firstPage.year,
					month: firstPage.month,
				},
			};
		});

		// Infer date for undated company pages from personnel groups
		// If all personnel groups have the same period, use that for undated company pages
		let inferredDate: { year: string; month: string } | null = null;
		if (personnelGroups.length > 0) {
			const firstDate = personnelGroups[0];
			const allSameDate = personnelGroups.every(
				(g) =>
					g.dateInfo.year === firstDate?.dateInfo.year &&
					g.dateInfo.month === firstDate?.dateInfo.month,
			);

			if (
				allSameDate &&
				firstDate?.dateInfo.year &&
				firstDate?.dateInfo.month
			) {
				inferredDate = {
					year: firstDate.dateInfo.year,
					month: firstDate.dateInfo.month,
				};
			}
		}

		// Group company pages by month
		const companyGroupsMap = new Map<string, ExtractedPage[]>();
		for (const page of companyPages) {
			let monthKey: string;
			if (page.year && page.month) {
				// Page has explicit date
				monthKey = `${page.year}-${page.month}`;
			} else if (inferredDate) {
				// Use inferred date from personnel groups
				monthKey = `${inferredDate.year}-${inferredDate.month}`;
			} else {
				// No date available
				monthKey = "no-date";
			}

			if (!companyGroupsMap.has(monthKey)) {
				companyGroupsMap.set(monthKey, []);
			}
			companyGroupsMap.get(monthKey)!.push(page);
		}

		const companyGroups: CompanyGroup[] = Array.from(
			companyGroupsMap.entries(),
		).map(([key, pages]) => {
			// Determine dateInfo for this group
			let dateInfo: { year: string; month: string } | null = null;

			if (key !== "no-date") {
				// Try to get date from first page with explicit date
				const pageWithDate = pages.find((p) => p.year && p.month);
				if (pageWithDate?.year && pageWithDate?.month) {
					dateInfo = { year: pageWithDate.year, month: pageWithDate.month };
				} else if (inferredDate) {
					// Use inferred date
					dateInfo = inferredDate;
				}
			}

			return {
				pages,
				formTypes: new Set(pages.map((p) => p.formType)),
				dateInfo,
			};
		});

		return {
			personnelGroups,
			companyGroups,
		};
	}
}
