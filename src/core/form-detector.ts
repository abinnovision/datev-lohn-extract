/**
 * Form type detection for DATEV documents
 * Uses form class instances for detection
 */

import type { FormType } from '../types.js';
import { AbstractForm } from './forms/abstract-form.js';
import { LOGN17Form, LOMS05Form, UnknownForm } from './forms/index.js';

/**
 * Pattern to detect explicit form numbers in documents
 */
const FORM_NUMBER_PATTERN = /(?:Form\.-Nr\.|Formular-Nr\.|F\.-Nr\.)\s*:?\s*([A-Z0-9]+)/i;

/**
 * Form type detector - uses form classes for centralized detection
 */
export class FormDetector {
  /**
   * Registry of all available form classes
   */
  private static readonly formClasses: AbstractForm<any>[] = [
    new LOGN17Form(),
    new LOMS05Form()
  ];

  /**
   * Detect form type from page text
   * Uses explicit form number detection only (Form.-Nr., Formular-Nr., F.-Nr.)
   *
   * @param text - Page text content
   * @returns Detected form type code
   */
  static detectFormType(text: string): FormType {
    // Try to find explicit form number
    const formMatch = text.match(FORM_NUMBER_PATTERN);
    if (formMatch && formMatch[1]) {
      const formCode = formMatch[1].toUpperCase();

      // Check if we have a handler for this exact form code
      const handler = this.formClasses.find(f => f.formType === formCode);
      if (handler) {
        return handler.formType;
      }

      // If we found a form number but no handler, return UNKNOWN
      // (will be handled by UnknownForm and skipped from output)
      return 'UNKNOWN';
    }

    // No form number found - mark as unknown
    return 'UNKNOWN';
  }

  /**
   * Get form handler instance for a form type
   * Returns the appropriate form class instance for extraction
   *
   * @param formType - Form type code
   * @returns Form class instance
   */
  static getFormHandler(formType: FormType): AbstractForm<any> {
    // Find matching form handler
    const handler = this.formClasses.find(f => f.formType === formType);
    return handler || new UnknownForm();
  }

  /**
   * Check if a form type is a salary statement (Lohnabrechnung)
   *
   * @param formType - Form type to check
   * @returns True if this is a salary statement type
   */
  static isSalaryStatement(formType: FormType): boolean {
    return formType === 'LOGN17' || formType === 'LOMS05';
  }

  /**
   * Check if a form type typically has personnel numbers
   *
   * @param formType - Form type to check
   * @returns True if this form type typically has personnel numbers
   */
  static hasPersonnelNumbers(formType: FormType): boolean {
    const handler = this.getFormHandler(formType);
    return handler.hasPersonnelNumbers();
  }
}
