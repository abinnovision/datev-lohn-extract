/**
 * Main module exports for DATEV PDF Splitter
 *
 * This library provides a headless extraction layer for DATEV PDF documents,
 * with utilities for grouping and exporting results.
 *
 * New in v2: Object-oriented form architecture with discriminated union types
 */

// Core extraction layer (headless, no side effects)
export { PageExtractor } from './core/page-extractor.js';
export { FormDetector } from './core/form-detector.js';

// Form classes (new OO architecture)
export {
  AbstractForm,
  LOGN17Form,
  LOMS05Form,
  UnknownForm
} from './core/forms/index.js';

// Grouping layer
export { PageGrouper } from './grouping/page-grouper.js';

// Output layer
export { PDFWriter } from './output/pdf-writer.js';
export { CSVExporter } from './output/csv-exporter.js';
export { StatsExporter } from './output/stats-exporter.js';

// Type exports
export type {
  // Core types
  FormType,
  DateInfo,

  // Form-specific page types (discriminated union)
  LOGN17Page,
  LOMS05Page,
  UnknownPage,

  // Extraction types
  ExtractedPage,  // Union of all page types
  ExtractionOptions,

  // Grouping types
  PersonnelGroup,
  CompanyGroup,
  GroupingResult,
  GroupingStatistics,

  // Output types
  WrittenFile,
  WriteOptions
} from './types.js';
