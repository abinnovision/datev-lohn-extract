/**
 * CSV exporter for SEPA transfer data
 * Exports employee payment information in SEPA-compatible format
 */

import fs from 'fs/promises';
import type { PersonnelGroup, LOGN17Page } from '../types.js';

/**
 * CSV exporter - exports SEPA transfer data
 */
export class CSVExporter {
  /**
   * Export SEPA transfer data for salary payments
   * Format: beneficiary_name,iban,amount,currency,reference
   *
   * @param groups - Personnel groups to export
   * @param outputPath - Path to write CSV file
   */
  async exportSepaTransfers(
    groups: PersonnelGroup[],
    outputPath: string
  ): Promise<void> {
    // CSV header for SEPA transfers
    const headers = 'beneficiary_name,iban,amount,currency,reference';
    const csvLines: string[] = [headers];

    for (const group of groups) {
      // Find LOGN17 page to extract financial data
      const logn17Page = group.pages.find(p => p.formType === 'LOGN17') as LOGN17Page | undefined;

      // Extract data
      const beneficiaryName = group.employeeName || '';
      const iban = logn17Page?.iban || '';
      const amount = logn17Page?.netto || '';
      const currency = 'EUR';

      // Build reference: "Lohn <Month> <Year> (<Personnel Number>)"
      const month = group.dateInfo.month || '';
      const year = group.dateInfo.year || '';
      const reference = month && year
        ? `Lohn ${month} ${year} (${group.personnelNumber})`
        : `Lohn (${group.personnelNumber})`;

      csvLines.push(
        `${beneficiaryName},${iban},${amount},${currency},${reference}`
      );
    }

    await fs.writeFile(outputPath, csvLines.join('\n'), 'utf-8');
  }
}
