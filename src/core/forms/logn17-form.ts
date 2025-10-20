/**
 * LOGN17 Form - Individual Employee Salary Statement
 * Extracts personnel info, dates, and financial data (Brutto, Netto, IBAN, Konto)
 */

import { AbstractForm } from './abstract-form.js';
import type { LOGN17Page } from '../../types.js';

export class LOGN17Form extends AbstractForm<LOGN17Page> {
  readonly formType = 'LOGN17' as const;
  readonly name = 'Lohnabrechnung (Individuell)';

  // Extraction patterns encapsulated in the form class
  private readonly patterns = {
    personnel: /(?:Personalnummer|Personal-Nr\.|Pers\.-Nr\.|PN)\s*:?\s*(\d{4,6})/i,
    date: /(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/i,
    // Name appears after Pers.-Nr. xxx* and a code, before street address
    name: /Pers\.-Nr\.\s+\d+\*\s+\w+\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)(?=\s+[A-ZÄÖÜ][a-zäöüß]+straße|$)/,
    // Brutto: amount after "Gehalt" line item
    brutto: /Gehalt\s+[A-Z\s]+\s+(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/i,
    // Netto: amount after IBAN and optional reference number
    netto: /DE\d{2}(?:\s+\d{2,4})+\s+(?:\d+\s+)?(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/,
    // IBAN: German IBAN (DE + 20 digits) - stops before any following number
    iban: /(DE\d{2}(?:\s+\d{2,4}){5,6})(?=\s+\d)/,
    pageBreak: /Personalnummer|LOGN17|Lohnabrechnung/i
  };

  extractMetadata(text: string, pageIndex: number, rawText: string): LOGN17Page {
    return {
      formType: this.formType,
      pageIndex,
      rawText,

      // Identity fields
      personnelNumber: this.extractPersonnelNumber(text),
      employeeName: this.extractEmployeeName(text),

      // Date fields (monthly)
      year: this.extractYear(text),
      month: this.extractMonth(text),

      // Financial fields
      brutto: this.extractBrutto(text),
      netto: this.extractNetto(text),
      iban: this.extractIBAN(text),

      // Flags
      isFirstPage: this.isFirstPage(text),
      isCompanyWide: false  // LOGN17 is always individual employee
    };
  }

  isFirstPage(text: string): boolean {
    return this.patterns.pageBreak.test(text);
  }

  hasPersonnelNumbers(): boolean {
    return true;  // LOGN17 always has personnel numbers
  }

  // ============================================================================
  // Private Extraction Methods
  // ============================================================================

  /**
   * Extract personnel number from text
   */
  private extractPersonnelNumber(text: string): string | null {
    const match = text.match(this.patterns.personnel);
    return (match && match[1]) ? match[1] : null;
  }

  /**
   * Extract employee name from text
   */
  private extractEmployeeName(text: string): string | null {
    const match = text.match(this.patterns.name);
    return (match && match[1]) ? match[1] : null;
  }

  /**
   * Extract year from German date format
   */
  private extractYear(text: string): string | null {
    const match = text.match(this.patterns.date);
    return (match && match[2]) ? match[2] : null;
  }

  /**
   * Extract month name from German date format
   */
  private extractMonth(text: string): string | null {
    const match = text.match(this.patterns.date);
    return (match && match[1]) ? match[1] : null;
  }

  /**
   * Extract Bruttolohn (gross salary)
   * Handles German number format with dots and commas
   */
  private extractBrutto(text: string): string | null {
    const match = text.match(this.patterns.brutto);
    if (!match || !match[1]) return null;

    // Convert German format to standard decimal:
    // 1.234,56 -> 1234.56
    return match[1]
      .replace(/\./g, '')  // Remove thousand separators
      .replace(',', '.');   // Replace decimal comma with dot
  }

  /**
   * Extract Nettolohn (net salary)
   * Handles German number format with dots and commas
   */
  private extractNetto(text: string): string | null {
    const match = text.match(this.patterns.netto);
    if (!match || !match[1]) return null;

    // Convert German format to standard decimal
    return match[1]
      .replace(/\./g, '')
      .replace(',', '.');
  }

  /**
   * Extract IBAN (International Bank Account Number)
   * Removes spaces for consistency
   */
  private extractIBAN(text: string): string | null {
    const match = text.match(this.patterns.iban);
    if (!match || !match[1]) return null;

    // Remove all spaces for clean IBAN
    return match[1].replace(/\s/g, '');
  }
}
