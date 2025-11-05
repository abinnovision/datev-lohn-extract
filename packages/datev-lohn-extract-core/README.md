# @internal/datev-lohn-extract-core

Core library for extracting structured data from DATEV PDF salary statements.

## Features

- PDF text extraction and form detection
- Support for LOGN17 (salary statements) and LOMS05 (social security) forms
- Personnel-based page grouping
- PDF generation for individual employees and company documents
- SEPA transfer CSV generation

## Usage

### Extract and Group Pages

```typescript
import { PageExtractor, PageGrouper } from "@internal/datev-lohn-extract-core";

// Extract pages from PDF
const extractor = new PageExtractor();
const pages = await extractor.extractPages(pdfBuffer);

// Group pages by personnel number
const grouper = new PageGrouper();
const result = grouper.groupByPersonnel(pages);

console.log(`Found ${result.personnelGroups.length} employees`);
console.log(`Found ${result.companyGroups.length} company documents`);
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

// CSV format: beneficiary_name,iban,amount,currency,reference
```

### Complete Example

```typescript
import {
  PageExtractor,
  PageGrouper,
  PdfGenerator,
  SepaTransfersGenerator,
} from "@internal/datev-lohn-extract-core";
import fs from "fs/promises";

// Read PDF
const pdfBuffer = await fs.readFile("salary-statements.pdf");

// Extract and group
const extractor = new PageExtractor();
const pages = await extractor.extractPages(pdfBuffer);

const grouper = new PageGrouper();
const result = grouper.groupByPersonnel(pages);

// Generate PDFs
const generator = new PdfGenerator();

for (const group of result.personnelGroups) {
  const pdf = await generator.generatePersonnelPdf(group, pdfBuffer);
  await fs.writeFile(
    `PERSONNEL-${group.dateInfo.year}-${group.dateInfo.month}-${group.personnelNumber}.pdf`,
    pdf.data
  );
}

// Generate SEPA CSV
const sepaGenerator = new SepaTransfersGenerator();
const csv = sepaGenerator.generateSepaTransfersCsv(result.personnelGroups);
await fs.writeFile("sepa-transfers.csv", csv);
```

### Using Type Guards

```typescript
import { isLOGN17Page } from "@internal/datev-lohn-extract-core";

for (const page of pages) {
  if (isLOGN17Page(page)) {
    // TypeScript knows page is LOGN17Page
    console.log(`${page.employeeName}: ${page.netto} EUR`);
  }
}
```

## License

MIT
