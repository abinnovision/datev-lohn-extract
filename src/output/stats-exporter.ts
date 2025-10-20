/**
 * Statistics exporter for form type analysis
 * Exports form statistics to JSON format
 */

import fs from 'fs/promises';
import type { ExtractedPage, GroupingStatistics } from '../types.js';
import { FormDetector } from '../core/form-detector.js';

/**
 * Statistics exporter - exports form statistics to JSON
 */
export class StatsExporter {
  /**
   * Export form statistics to JSON file
   *
   * @param pages - Extracted pages to analyze
   * @param outputPath - Path to write JSON file
   * @param groupingStats - Optional grouping statistics
   */
  async exportStatistics(
    pages: ExtractedPage[],
    outputPath: string,
    groupingStats?: GroupingStatistics
  ): Promise<void> {
    const formTypeBreakdown: Record<string, { name: string; pageCount: number }> = {};

    // Build form type breakdown
    for (const page of pages) {
      if (!formTypeBreakdown[page.formType]) {
        const formHandler = FormDetector.getFormHandler(page.formType);
        formTypeBreakdown[page.formType] = {
          name: formHandler.name,
          pageCount: 0
        };
      }
      formTypeBreakdown[page.formType]!.pageCount++;
    }

    // Build page metadata array (excluding rawText for readability)
    const pageMetadata = pages.map(page => {
      const { rawText, ...metadata } = page;
      return metadata;
    });

    // Build statistics object
    const stats = {
      totalPages: pages.length,
      uniquePersonnel: groupingStats?.uniquePersonnel ?? this.countUniquePersonnel(pages),
      companyPages: groupingStats?.companyPages ?? pages.filter(p => p.isCompanyWide).length,
      skippedPages: groupingStats?.skippedPages ?? 0,
      formTypes: formTypeBreakdown,
      pages: pageMetadata  // Detailed page metadata for debugging
    };

    // Write JSON file
    const jsonContent = JSON.stringify(stats, null, 2);
    await fs.writeFile(outputPath, jsonContent, 'utf-8');
  }

  /**
   * Count unique personnel numbers in pages
   */
  private countUniquePersonnel(pages: ExtractedPage[]): number {
    const personnelNumbers = new Set(
      pages
        .map(p => p.personnelNumber)
        .filter((pn): pn is string => pn !== null)
    );
    return personnelNumbers.size;
  }
}
