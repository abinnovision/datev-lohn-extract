/**
 * Type definitions for DATEV PDF Splitter
 * Object-oriented architecture with discriminated union types
 */

/**
 * Form type codes used in DATEV documents
 */
export type FormType = 'LOGN17' | 'LOMS05' | 'UNKNOWN';

/**
 * Date information extracted from text
 */
export interface DateInfo {
  /** Month name (German) or null if year-only */
  month: string | null;
  /** Year as string or null */
  year: string | null;
}

// ============================================================================
// Core Extraction Types (Headless Layer) - Discriminated Union
// ============================================================================

/**
 * LOGN17 - Individual Employee Salary Statement
 * Contains detailed financial data for a single employee
 */
export interface LOGN17Page {
  formType: 'LOGN17';
  pageIndex: number;
  rawText: string;

  // Identity
  personnelNumber: string | null;
  employeeName: string | null;

  // Date (monthly)
  year: string | null;
  month: string | null;

  // Financial data
  brutto: string | null;
  netto: string | null;
  iban: string | null;

  // Flags
  isFirstPage: boolean;
  isCompanyWide: false;  // LOGN17 is always individual
}

/**
 * LOMS05 - Social Security Notification (Meldebescheinigung zur Sozialversicherung)
 * Minimal extraction - only personnel number matters for identification
 */
export interface LOMS05Page {
  formType: 'LOMS05';
  pageIndex: number;
  rawText: string;

  // Identity (minimal - only Pers.-Nr. matters)
  personnelNumber: string | null;
  employeeName: null;  // Not extracted from this form

  // Date (monthly)
  year: string | null;
  month: string | null;

  // Flags
  isFirstPage: boolean;
  isCompanyWide: false;  // LOMS05 is per employee
}

/**
 * Unknown Form - Fallback for unrecognized forms
 * Treated as company-wide documents with minimal extraction (dates only for grouping)
 */
export interface UnknownPage {
  formType: 'UNKNOWN';
  pageIndex: number;
  rawText: string;

  // Detected form code (if any explicit form number was found)
  detectedFormCode: string | null;

  // No personnel extraction
  personnelNumber: null;
  employeeName: null;

  // Date extraction for grouping purposes
  year: string | null;
  month: string | null;

  // Flags
  isFirstPage: true;  // Treat all unknown pages as first pages
  isCompanyWide: true;  // Always company-wide
}

/**
 * Discriminated union of all page types
 * Use type narrowing to access form-specific fields
 */
export type ExtractedPage = LOGN17Page | LOMS05Page | UnknownPage;

// ============================================================================
// Grouping Layer Types
// ============================================================================

/**
 * Group of pages belonging to a single employee
 */
export interface PersonnelGroup {
  /** Personnel number for this group */
  personnelNumber: string;
  /** Employee name */
  employeeName: string;
  /** All pages in this group */
  pages: ExtractedPage[];
  /** All form types present in this group */
  formTypes: Set<FormType>;
  /** Date information (from first page) */
  dateInfo: DateInfo;
}

/**
 * Group of company-wide pages (without personnel numbers)
 */
export interface CompanyGroup {
  /** All company-wide pages */
  pages: ExtractedPage[];
  /** All form types in this group */
  formTypes: Set<FormType>;
  /** Date information if available */
  dateInfo: DateInfo | null;
}

/**
 * Result of grouping operation
 */
export interface GroupingResult {
  /** Groups of pages per personnel number */
  personnelGroups: PersonnelGroup[];
  /** Company-wide pages grouped by month (if any) */
  companyGroups: CompanyGroup[];
  /** Statistics about the grouping */
  statistics: GroupingStatistics;
}

/**
 * Statistics about grouping operation
 */
export interface GroupingStatistics {
  /** Total pages processed */
  totalPages: number;
  /** Number of unique personnel numbers */
  uniquePersonnel: number;
  /** Number of company-wide pages */
  companyPages: number;
  /** Number of skipped pages (UNKNOWN forms) */
  skippedPages: number;
  /** Form type breakdown */
  formTypeBreakdown: Record<FormType, number>;
}

// ============================================================================
// Output Layer Types
// ============================================================================

/**
 * Information about a written PDF file
 */
export interface WrittenFile {
  /** Full path to the written file */
  path: string;
  /** Number of pages in the file */
  pageCount: number;
  /** Form types included in this file */
  formTypes: FormType[];
  /** Personnel number (if applicable) */
  personnelNumber?: string;
  /** Employee name (if applicable) */
  employeeName?: string;
}

/**
 * Options for writing PDF files
 */
export interface WriteOptions {
  /** Output directory */
  outputDir: string;
  /** Prefix for filenames */
  prefix: string;
  /** Whether to include form type in filename */
  includeFormTypeInFilename: boolean;
  /** Whether to combine related forms (e.g., Lohnabrechnung + Meldebescheinigung) */
  combineRelatedForms?: boolean;
}

/**
 * Options for extraction
 */
export interface ExtractionOptions {
  /** Enable verbose logging */
  verbose?: boolean;
  /** Enable trace-level logging */
  trace?: boolean;
}
