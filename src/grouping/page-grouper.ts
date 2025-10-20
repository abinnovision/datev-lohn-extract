/**
 * Page grouping logic for DATEV documents
 * Groups extracted pages by personnel number and handles company-wide documents
 */

import type {
  ExtractedPage,
  PersonnelGroup,
  CompanyGroup,
  GroupingResult,
  GroupingStatistics,
  FormType
} from '../types.js';

/**
 * Form types that should be combined per employee
 * LOGN17 (salary) + LOMS05 (social security) for the same month
 */
const COMBINABLE_FORM_TYPES: ReadonlySet<FormType> = new Set([
  'LOGN17',
  'LOMS05'
]);

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
  groupByPersonnel(pages: ExtractedPage[]): GroupingResult {
    const personnelMap = new Map<string, ExtractedPage[]>();
    const companyPages: ExtractedPage[] = [];
    const formTypeBreakdown: Record<string, number> = {};

    // Track context for continuation pages
    let currentPersonnelNumber: string | null = null;

    for (const page of pages) {
      // Track form type statistics
      formTypeBreakdown[page.formType] = (formTypeBreakdown[page.formType] || 0) + 1;

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
    const personnelGroups: PersonnelGroup[] = Array.from(personnelMap.entries()).map(
      ([personnelNumber, groupPages]) => {
        const formTypes = new Set<FormType>(groupPages.map(p => p.formType));
        const firstPage = groupPages[0]!;

        return {
          personnelNumber,
          employeeName: firstPage.employeeName || 'Unknown',
          pages: groupPages,
          formTypes,
          dateInfo: {
            year: firstPage.year,
            month: firstPage.month
          }
        };
      }
    );

    // Infer date for undated company pages from personnel groups
    // If all personnel groups have the same period, use that for undated company pages
    let inferredDate: { year: string; month: string } | null = null;
    if (personnelGroups.length > 0) {
      const firstDate = personnelGroups[0];
      const allSameDate = personnelGroups.every(
        g => g.dateInfo.year === firstDate?.dateInfo.year &&
             g.dateInfo.month === firstDate?.dateInfo.month
      );
      if (allSameDate && firstDate?.dateInfo.year && firstDate?.dateInfo.month) {
        inferredDate = {
          year: firstDate.dateInfo.year,
          month: firstDate.dateInfo.month
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
        monthKey = 'no-date';
      }

      if (!companyGroupsMap.has(monthKey)) {
        companyGroupsMap.set(monthKey, []);
      }
      companyGroupsMap.get(monthKey)!.push(page);
    }

    const companyGroups: CompanyGroup[] = Array.from(companyGroupsMap.entries()).map(([key, pages]) => {
      // Determine dateInfo for this group
      let dateInfo: { year: string; month: string } | null = null;

      if (key !== 'no-date') {
        // Try to get date from first page with explicit date
        const pageWithDate = pages.find(p => p.year && p.month);
        if (pageWithDate?.year && pageWithDate?.month) {
          dateInfo = { year: pageWithDate.year, month: pageWithDate.month };
        } else if (inferredDate) {
          // Use inferred date
          dateInfo = inferredDate;
        }
      }

      return {
        pages,
        formTypes: new Set(pages.map(p => p.formType)),
        dateInfo
      };
    });

    // Build statistics
    const statistics: GroupingStatistics = {
      totalPages: pages.length,
      uniquePersonnel: personnelGroups.length,
      companyPages: companyPages.length,
      skippedPages: 0,  // No longer skipping UNKNOWN - they go to company group
      formTypeBreakdown
    };

    return {
      personnelGroups,
      companyGroups,
      statistics
    };
  }

  /**
   * Combine related form types for the same employee
   * E.g., merge Lohnabrechnung + Meldebescheinigung (SV) into single group
   *
   * @param groups - Personnel groups to process
   * @returns Groups with related forms combined (same structure, just reorganized)
   */
  combineRelatedForms(groups: PersonnelGroup[]): PersonnelGroup[] {
    // For now, this is a pass-through since we're already grouping by personnel number
    // All forms for the same employee/month are already in one group
    // The actual combination happens at PDF write time
    return groups;
  }

  /**
   * Group pages by month and personnel number
   * Useful for separating different months for the same employee
   *
   * @param pages - Extracted pages to group
   * @returns Groups organized by personnel and month
   */
  groupByPersonnelAndMonth(pages: ExtractedPage[]): Map<string, PersonnelGroup[]> {
    const result = new Map<string, PersonnelGroup[]>();

    // First group by personnel
    const byPersonnel = this.groupByPersonnel(pages);

    // Then split each personnel group by month
    for (const group of byPersonnel.personnelGroups) {
      const monthGroups = new Map<string, ExtractedPage[]>();

      for (const page of group.pages) {
        const monthKey = page.month && page.year
          ? `${page.year}-${page.month}`
          : 'no-date';

        if (!monthGroups.has(monthKey)) {
          monthGroups.set(monthKey, []);
        }
        monthGroups.get(monthKey)!.push(page);
      }

      // Create separate groups for each month
      const personnelMonthGroups: PersonnelGroup[] = Array.from(monthGroups.entries()).map(
        ([_monthKey, monthPages]) => ({
          personnelNumber: group.personnelNumber,
          employeeName: group.employeeName,
          pages: monthPages,
          formTypes: new Set(monthPages.map(p => p.formType)),
          dateInfo: {
            year: monthPages[0]!.year,
            month: monthPages[0]!.month
          }
        })
      );

      result.set(group.personnelNumber, personnelMonthGroups);
    }

    return result;
  }

  /**
   * Check if two form types should be combined
   *
   * @param formType1 - First form type
   * @param formType2 - Second form type
   * @returns True if these forms should be combined
   */
  static shouldCombineForms(formType1: FormType, formType2: FormType): boolean {
    return COMBINABLE_FORM_TYPES.has(formType1) && COMBINABLE_FORM_TYPES.has(formType2);
  }

  /**
   * Sort pages within a group by their original order
   *
   * @param group - Personnel group to sort
   * @returns Group with sorted pages
   */
  static sortPagesInGroup(group: PersonnelGroup): PersonnelGroup {
    return {
      ...group,
      pages: [...group.pages].sort((a, b) => a.pageIndex - b.pageIndex)
    };
  }
}
