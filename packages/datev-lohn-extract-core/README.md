# @internal/datev-lohn-extract-core

Core library for extracting structured data from DATEV PDF salary statements. This is a headless library designed for programmatic use.

## Overview

This package provides a headless extraction layer for DATEV PDF documents with support for multiple form types:

- **LOGN17**: Individual employee salary statements
- **LOMS05**: Social security notifications
- **Unknown forms**: Fallback handling for unrecognized documents

## Features

- **Form Detection**: Automatic identification of DATEV form types
- **Data Extraction**: Structured extraction of personnel, financial, and date information
- **Page Grouping**: Intelligent grouping of pages by employee or company-wide
- **Export Utilities**: PDF splitting, CSV export, and statistics generation
- **Type Safety**: Full TypeScript support with discriminated union types

## Installation

This is an internal workspace package. Add it to your workspace:

```json
{
  "dependencies": {
    "@internal/datev-lohn-extract-core": "workspace:^"
  }
}
```

## Usage

### Basic Extraction

```typescript
import { PageExtractor } from "@internal/datev-lohn-extract-core";

const extractor = new PageExtractor();
const pages = await extractor.extractAllPages("path/to/datev.pdf");

// Each page has a discriminated union type
for (const page of pages) {
  switch (page.formType) {
    case "LOGN17":
      console.log(`Employee: ${page.employeeName}, Netto: ${page.netto}`);
      break;
    case "LOMS05":
      console.log(`Social Security: ${page.personnelNumber}`);
      break;
    case "UNKNOWN":
      console.log(`Unknown form: ${page.detectedFormCode}`);
      break;
  }
}
```

### Grouping Pages

```typescript
import { PageGrouper } from "@internal/datev-lohn-extract-core";

const grouper = new PageGrouper();
const result = grouper.groupPages(pages);

console.log(`Found ${result.personnelGroups.length} employees`);
console.log(`Statistics:`, result.statistics);
```

### Exporting Results

```typescript
import {
  PDFWriter,
  CSVExporter,
  StatsExporter,
} from "@internal/datev-lohn-extract-core";

// Split PDFs by employee
const writer = new PDFWriter("source.pdf");
await writer.writePersonnelGroups(result.personnelGroups, {
  outputDir: "./output",
  prefix: "salary",
  includeFormTypeInFilename: true,
});

// Export SEPA transfer data
const csvExporter = new CSVExporter();
await csvExporter.exportTransfers(
  result.personnelGroups,
  "./output/transfers.csv",
);

// Export statistics
const statsExporter = new StatsExporter();
await statsExporter.exportStats(result, "./output/stats.json");
```

## API Reference

### Core Classes

- **`PageExtractor`**: Extract structured data from PDF pages
- **`FormDetector`**: Detect form types from text content
- **`PageGrouper`**: Group pages by employee or company-wide

### Form Classes

- **`AbstractForm`**: Base class for all form types
- **`LOGN17Form`**: Handler for salary statements
- **`LOMS05Form`**: Handler for social security notifications
- **`UnknownForm`**: Fallback for unrecognized forms

### Output Classes

- **`PDFWriter`**: Split PDFs by employee or form type
- **`CSVExporter`**: Export SEPA transfer data to CSV
- **`StatsExporter`**: Generate extraction statistics

### Type Exports

See `types.ts` for full type definitions:

- `ExtractedPage` - Discriminated union of all page types
- `GroupingResult` - Result of grouping operation
- `PersonnelGroup` - Group of pages for one employee
- `CompanyGroup` - Company-wide pages

## Architecture

This package follows a layered architecture:

1. **Core Layer**: Headless extraction (no side effects)
2. **Grouping Layer**: Business logic for organizing pages
3. **Output Layer**: File writing and export utilities

All extraction logic is pure and side-effect free. File I/O is isolated to the output layer.

## License

MIT
