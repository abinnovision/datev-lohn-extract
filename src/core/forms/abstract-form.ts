/**
 * Abstract base class for all DATEV form types
 * Each form type extends this class and implements form-specific extraction logic
 */

import type { FormType } from '../../types.js';

/**
 * Abstract base class for form extraction
 *
 * @template TMetadata - The specific page type this form produces (e.g., LOGN17Page, LSBPage)
 */
export abstract class AbstractForm<TMetadata> {
  /**
   * The form type identifier (LOGN17, LOA, LSB, etc.)
   */
  abstract readonly formType: FormType;

  /**
   * Display name for the form
   */
  abstract readonly name: string;

  /**
   * Extract complete metadata from a PDF page
   *
   * This is the main method that each form type implements.
   * It should extract all relevant fields and return a typed metadata object.
   *
   * @param text - Raw text content extracted from the PDF page
   * @param pageIndex - Zero-based page index in the source PDF
   * @param rawText - Complete raw text (for storage in the result)
   * @returns Typed metadata object for this form type
   */
  abstract extractMetadata(
    text: string,
    pageIndex: number,
    rawText: string
  ): TMetadata;

  /**
   * Check if this appears to be the first page of a new document
   *
   * Used for page grouping - helps determine where documents start.
   * Different form types have different indicators for first pages.
   *
   * @param text - Raw text content from the page
   * @returns True if this looks like a first page
   */
  abstract isFirstPage(text: string): boolean;

  /**
   * Check if this form type can contain individual personnel numbers
   *
   * Returns false for company-wide forms (journals, summaries),
   * true for individual employee forms (salary statements, tax certificates).
   *
   * @returns True if this form type has personnel numbers
   */
  abstract hasPersonnelNumbers(): boolean;
}
