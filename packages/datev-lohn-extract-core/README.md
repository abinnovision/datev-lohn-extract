# @internal/datev-lohn-extract-core

Core library for extracting structured data from DATEV PDF salary statements.

## Features

- PDF text extraction and form detection
- Support for LOGN17 (salary statements) and LOMS05 (social security) forms
- Personnel-based page grouping
- PDF generation for individual employees and company documents
- SEPA transfer CSV generation

## Installation

Add to your workspace package:

```json
{
  "dependencies": {
    "@internal/datev-lohn-extract-core": "workspace:^"
  }
}
```

## Usage

### Basic Extraction and Grouping

```typescript
import { PageExtractor, PageGrouper } from "@internal/datev-lohn-extract-core";

// Extract pages from PDF
const extractor = new PageExtractor();
const pages = await extractor.extractPages(pdfBuffer);

// Group pages by personnel number
const grouper = new PageGrouper();
const result = grouper.groupByPersonnel(pages);

console.log(`Found ${result.personnelGroups.length} employees`);
```

### Generate Individual PDFs

```typescript
import { PdfGenerator } from "@internal/datev-lohn-extract-core";

const generator = new PdfGenerator();

// Generate PDF for each employee
for (const group of result.personnelGroups) {
  const pdf = await generator.generatePersonnelPdf(group, pdfBuffer);
  // pdf.data is a Buffer containing the PDF
  // pdf.personnelNumber, pdf.employeeName, pdf.dateInfo available
}

// Generate company-wide PDFs
for (const group of result.companyGroups) {
  const pdf = await generator.generateCompanyPdf(group, pdfBuffer);
  // pdf.data is a Buffer containing the PDF
}
```

### Generate SEPA Transfers CSV

```typescript
import { SepaTransfersGenerator } from "@internal/datev-lohn-extract-core";

const sepaGenerator = new SepaTransfersGenerator();
const csv = sepaGenerator.generateSepaTransfersCsv(result.personnelGroups);

// csv is a string with format:
// beneficiary_name,iban,amount,currency,reference
```

## API

### PageExtractor

Extracts text and detects form types from PDF pages.

```typescript
class PageExtractor {
  constructor(options?: { logger?: Logger });
  extractPages(pdfBuffer: Buffer): Promise<ExtractedPage[]>;
}
```

### PageGrouper

Groups extracted pages by personnel number or as company-wide documents.

```typescript
class PageGrouper {
  groupByPersonnel(pages: ExtractedPage[]): PageGrouperResult;
}

interface PageGrouperResult {
  personnelGroups: PersonnelGroup[];
  companyGroups: CompanyGroup[];
}
```

### PdfGenerator

Generates PDF buffers from grouped pages.

```typescript
class PdfGenerator {
  generatePersonnelPdf(
    group: PersonnelGroup,
    sourcePdfBuffer: Buffer
  ): Promise<GeneratedPersonnelPdf>;

  generateCompanyPdf(
    group: CompanyGroup,
    sourcePdfBuffer: Buffer
  ): Promise<GeneratedCompanyPdf>;
}
```

### SepaTransfersGenerator

Generates SEPA transfer CSV data for salary payments.

```typescript
class SepaTransfersGenerator {
  generateSepaTransfersCsv(groups: PersonnelGroup[]): string;
}
```

## Types

```typescript
// Form types
type FormType = "LOGN17" | "LOMS05" | "UNKNOWN";

// Page types (discriminated union)
type ExtractedPage = LOGN17Page | LOMS05Page | UnknownPage;

interface LOGN17Page {
  formType: "LOGN17";
  pageIndex: number;
  personnelNumber: string | null;
  employeeName: string | null;
  year: string | null;
  month: string | null;
  brutto: string | null;
  netto: string | null;
  iban: string | null;
  isFirstPage: boolean;
  isCompanyWide: false;
}

// Grouping types
interface PersonnelGroup {
  personnelNumber: string;
  employeeName: string;
  pages: ExtractedPage[];
  dateInfo: DateInfo;
}

interface CompanyGroup {
  pages: ExtractedPage[];
  dateInfo: DateInfo | null;
}

// Generated PDF types
interface GeneratedPersonnelPdf {
  data: Buffer;
  pageCount: number;
  personnelNumber: string;
  employeeName: string;
  dateInfo: DateInfo;
}

interface GeneratedCompanyPdf {
  data: Buffer;
  pageCount: number;
  dateInfo: DateInfo | null;
}
```

## Error Handling

The library exports custom error classes:

- `ValidationError` - Invalid input parameters
- `ExtractionError` - PDF loading or extraction failure
- `FormDetectionError` - Form type detection failure
- `PdfGenerationError` - PDF generation failure

## Type Guards

```typescript
import { isLOGN17Page, isLOMS05Page, isUnknownPage } from "@internal/datev-lohn-extract-core";

if (isLOGN17Page(page)) {
  // TypeScript knows page is LOGN17Page
  console.log(page.netto);
}
```

## License

MIT
