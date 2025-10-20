# DATEV PDF Splitter (TypeScript/Node.js)

A TypeScript/Node.js **library and CLI tool** for processing DATEV salary statement PDFs with **automatic form type detection**. Features a **headless extraction core** for easy integration into other applications. This is a TypeScript implementation equivalent to the Python [datev-splitter](https://github.com/tuergeist/datev-splitter) tool.

## Features

### Core Library
- **Headless extraction** - Stateless, reusable extraction with no side effects
- **Automatic form type detection** (LOA313, LSB, SV, JAB, etc.)
- **Form-specific extraction patterns** for accurate data parsing
- **Flexible grouping strategies** - Group by personnel, month, or custom logic
- **Separation of concerns** - Core extraction → Grouping → Output layers
- **Type-safe** - Full TypeScript support with comprehensive type definitions

### CLI Tool
- Splits multi-employee DATEV PDF payroll statements into individual files
- Extracts personnel numbers (Personalnummer) from each page
- Identifies month and year from salary statements
- Generates organized output filenames: `PREFIX-PERSONNELNUM-YEAR-MONTH-FORMTYPE.pdf`
- **Enhanced CSV export** with personnel numbers, names, and form types
- **JSON statistics export** with form type breakdown
- Configurable logging levels (quiet, debug, trace)
- Handles multi-page employee documents and company-wide documents
- **Processes mixed document types** in a single PDF
- Maintains page order and document integrity

## Requirements

- Node.js >= 18.0.0
- Yarn (recommended) or npm

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd abinnovision-datev-lohn-extract

# Install dependencies
yarn install
# or
npm install

# Build TypeScript to JavaScript
yarn build
# or
npm run build

# Optional: Install globally for system-wide access
npm link
```

## Development

```bash
# Run TypeScript compiler in watch mode
yarn dev
# or
npm run dev

# Type check without building
yarn typecheck
# or
npm run typecheck

# Clean build artifacts
yarn clean
# or
npm run clean
```

## Usage

### Basic Usage

```bash
# After building, run the compiled version
node dist/cli.js salary_statements.pdf

# Or use yarn/npm scripts
yarn start salary_statements.pdf

# Or if installed globally
datev-splitter salary_statements.pdf

# Development: Run directly from TypeScript
yarn dev salary_statements.pdf
```

### Command-Line Options

```
Usage: datev-splitter [options] <infile>

Split DATEV PDF salary statements by personnel number with automatic form type detection

Arguments:
  infile                          DATEV PDF file to process

Options:
  -V, --version                   output the version number
  -q, --quiet                     Show only warnings and errors
  -d, --debug                     Show more context (including form type detection)
  -t, --trace                     Show even more context / trace
  -p, --prefix <prefix>           Prefix for all result files (default: "")
  -o, --output <directory>        Where to write the output files (default: ".")
  -e, --export-pns <file>         Export CSV file with personnel numbers and form types
  -f, --export-form-stats <file>  Export JSON file with form type statistics
  -h, --help                      display help for command
```

### Examples

#### Split with prefix and custom output directory
```bash
node datev-splitter.js -p RD- -o output_pdfs salary_statements.pdf
```

Output:
```
output_pdfs/
  RD-00203-2022-Dezember.pdf
  RD-00456-2022-Dezember.pdf
  RD-00789-2022-Dezember.pdf
```

#### Export personnel list to CSV (with form types)
```bash
node datev-splitter.js -e personnel.csv salary_statements.pdf
```

CSV format:
```csv
Personnel_With_Prefix,Personnel_Number,Name,Form_Types
RD-00203,00203,Max Mustermann,LOA313;LSB
RD-00456,00456,Erika Musterfrau,LOA313
RD-00789,00789,Hans Schmidt,LOA313
```

#### Export form statistics to JSON
```bash
node datev-splitter.js -f stats.json salary_statements.pdf
```

JSON format:
```json
{
  "totalPages": 60,
  "uniquePersonnel": 20,
  "formTypes": {
    "LOA313": {
      "name": "Lohnabrechnung Standard",
      "pageCount": 45
    },
    "LSB": {
      "name": "Lohnsteuerbescheinigung",
      "pageCount": 15
    }
  }
}
```

#### Complete example with all options
```bash
node datev-splitter.js \
  -p COMPANY- \
  -o ./payroll_output \
  -e employees.csv \
  -f form-stats.json \
  -d \
  monthly_payroll_2022_12.pdf
```

**Console output:**
```
INFO: Analyzing document: monthly_payroll_2022_12.pdf
INFO: Total pages: 60
INFO: Page 1: Form type LOA313 (Lohnabrechnung Standard)
DEBUG: Page 1: PN=00203, Date=Dezember 2022, Name=Max Mustermann, Form=LOA313
...

=== Form Type Summary ===
LOA313 (Lohnabrechnung Standard): 45 page(s)
LSB (Lohnsteuerbescheinigung): 15 page(s)
========================

INFO: Splitting document into 20 files
INFO: Created COMPANY-00203-2022-Dezember-LOA313.pdf with 3 page(s) [LOA313]
INFO: Processing complete
```

#### Quiet mode (only show errors)
```bash
node datev-splitter.js -q -o output salary_statements.pdf
```

#### Debug mode (verbose output)
```bash
node datev-splitter.js -d salary_statements.pdf
```

#### Trace mode (maximum verbosity)
```bash
node datev-splitter.js -t salary_statements.pdf
```

## How It Works

1. **Text Extraction**: Uses PDF.js to extract text content from each page
2. **Form Type Detection**:
   - Searches for explicit form numbers: `Form.-Nr. LOA313`, `Formular-Nr.: LSB`
   - Falls back to content-based detection using keywords
   - Supported forms: LOA313, LOA, LSB, SV, JAB
3. **Form-Specific Pattern Matching**: Uses appropriate patterns for each form type:
   - **LOA313/LOA**: `Personalnummer`, `Personal-Nr.`, `Pers.-Nr.`, `PN`
   - **LSB**: `Steuer-Identifikationsnummer`, `Personalnummer`
   - **SV**: `Versicherungsnummer`
   - **JAB**: `Versicherungsnummer`, `Personalnummer`
4. **Date Extraction**: Identifies dates based on form type:
   - Monthly forms: German month names + year (Januar, Februar, März, etc.)
   - Annual forms (LSB, JAB): Year only
5. **Page Grouping**: Groups consecutive pages by personnel number
6. **Statistics Tracking**: Tracks form types and page counts
7. **PDF Creation**: Creates individual PDFs using pdf-lib with form type in filename
8. **File Output**: Saves with structured filenames and optional CSV/JSON exports

## Supported DATEV Form Types

| Form Code | Full Name | Description | Detection Method |
|-----------|-----------|-------------|------------------|
| **LOA313** | Lohnabrechnung Standard | Standard monthly salary statement | Form-Nr. or keywords |
| **LOA** | Lohnabrechnung | Generic salary statement | Form-Nr. or keywords |
| **LSB** | Lohnsteuerbescheinigung | Annual tax certificate | Form-Nr. or keywords |
| **SV** | Sozialversicherungsnachweis | Social security contribution notice | Form-Nr. or keywords |
| **JAB** | Jahresmeldung | Annual report | Form-Nr. or keywords |

Each form type has customized:
- Personnel number extraction patterns
- Date/month extraction patterns
- Name extraction patterns
- Page break indicators

## Library Usage

### Architecture Overview

The library is organized into three distinct layers:

```
┌─────────────────────────────────────────────────┐
│           Core Extraction Layer                 │
│  (Headless - No side effects, just data)       │
│                                                  │
│  • PageExtractor - Extract pages from PDF       │
│  • FormDetector - Detect form types             │
│  • MetadataExtractor - Extract metadata         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│              Grouping Layer                      │
│  (Business logic for organizing pages)          │
│                                                  │
│  • PageGrouper - Group by personnel/month       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│               Output Layer                       │
│  (File writing and export)                      │
│                                                  │
│  • PDFWriter - Write PDF files                  │
│  • CSVExporter - Export personnel data          │
│  • StatsExporter - Export statistics            │
└─────────────────────────────────────────────────┘
```

### Headless Extraction (Core Layer)

The core extraction layer is **completely headless** - no file I/O, no side effects, just pure data extraction:

```typescript
import { PageExtractor } from 'abinnovision-datev-lohn-extract';
import fs from 'fs/promises';

// Read PDF file
const pdfBuffer = await fs.readFile('salary_statements.pdf');

// Extract pages (headless - returns data, no side effects)
const extractor = new PageExtractor({ verbose: true });
const pages = await extractor.extractPages(pdfBuffer);

// Now you have all extracted data as a structured array
console.log(`Extracted ${pages.length} pages`);
pages.forEach(page => {
  console.log(`Page ${page.pageIndex + 1}:`, {
    formType: page.formType,
    personnelNumber: page.personnelNumber,
    employeeName: page.employeeName,
    date: `${page.dateInfo.month} ${page.dateInfo.year}`
  });
});
```

### Grouping Pages

Use the `PageGrouper` to organize extracted pages:

```typescript
import { PageExtractor, PageGrouper } from 'abinnovision-datev-lohn-extract';

const extractor = new PageExtractor();
const pages = await extractor.extractPages(pdfBuffer);

// Group by personnel number
const grouper = new PageGrouper();
const result = grouper.groupByPersonnel(pages);

console.log(`Found ${result.personnelGroups.length} employees`);
console.log(`Form type breakdown:`, result.statistics.formTypeBreakdown);

// Access each personnel group
for (const group of result.personnelGroups) {
  console.log(`${group.employeeName} (${group.personnelNumber}):`, {
    pageCount: group.pages.length,
    formTypes: Array.from(group.formTypes),
    date: `${group.dateInfo.month} ${group.dateInfo.year}`
  });
}

// Access company-wide pages (if any)
if (result.companyGroup) {
  console.log(`Company pages: ${result.companyGroup.pages.length}`);
}
```

### Writing Output Files

Use the output layer to write results to files:

```typescript
import { PageExtractor, PageGrouper, PDFWriter, CSVExporter } from 'abinnovision-datev-lohn-extract';

// Extract and group
const pages = await new PageExtractor().extractPages(pdfBuffer);
const result = new PageGrouper().groupByPersonnel(pages);

// Write individual PDFs
const writer = new PDFWriter();
for (const group of result.personnelGroups) {
  const written = await writer.writePersonnelGroup(
    group,
    pdfBuffer,
    {
      outputDir: './output',
      prefix: 'COMPANY-',
      includeFormTypeInFilename: true
    }
  );
  console.log(`Created ${written.path}`);
}

// Write company PDF if exists
if (result.companyGroup) {
  await writer.writeCompanyGroup(result.companyGroup, pdfBuffer, {
    outputDir: './output',
    prefix: 'COMPANY-',
    includeFormTypeInFilename: true
  });
}

// Export CSV
await new CSVExporter().exportPersonnel(
  result.personnelGroups,
  './output/personnel.csv',
  'COMPANY-'
);
```

### Complete Example

```typescript
import {
  PageExtractor,
  PageGrouper,
  PDFWriter,
  CSVExporter,
  StatsExporter
} from 'abinnovision-datev-lohn-extract';
import fs from 'fs/promises';

async function processSalaryPDF(inputPath: string) {
  // Step 1: Read PDF
  const pdfBuffer = await fs.readFile(inputPath);

  // Step 2: Extract pages (headless)
  const extractor = new PageExtractor({ verbose: true });
  const pages = await extractor.extractPages(pdfBuffer);

  // Step 3: Group by personnel
  const grouper = new PageGrouper();
  const result = grouper.groupByPersonnel(pages);

  // Step 4: Write PDFs
  const writer = new PDFWriter();
  const writeOptions = {
    outputDir: './output',
    prefix: 'COMPANY-',
    includeFormTypeInFilename: true
  };

  for (const group of result.personnelGroups) {
    await writer.writePersonnelGroup(group, pdfBuffer, writeOptions);
  }

  if (result.companyGroup) {
    await writer.writeCompanyGroup(result.companyGroup, pdfBuffer, writeOptions);
  }

  // Step 5: Export CSV and stats
  await new CSVExporter().exportPersonnel(
    result.personnelGroups,
    './output/personnel.csv'
  );

  await new StatsExporter().exportStatistics(
    pages,
    './output/stats.json',
    result.statistics
  );

  console.log('Processing complete!');
}
```

### Custom Grouping Strategies

You can implement custom grouping logic:

```typescript
import { PageExtractor, type ExtractedPage } from 'abinnovision-datev-lohn-extract';

// Extract pages
const pages = await new PageExtractor().extractPages(pdfBuffer);

// Custom grouping: separate by month
const byMonth = new Map<string, ExtractedPage[]>();
for (const page of pages) {
  const key = `${page.dateInfo.year}-${page.dateInfo.month}`;
  if (!byMonth.has(key)) {
    byMonth.set(key, []);
  }
  byMonth.get(key)!.push(page);
}

// Custom grouping: filter by form type
const salaryStatements = pages.filter(p => p.formType === 'LOA313');
const taxCertificates = pages.filter(p => p.formType === 'LSB');
```

### Exported Types

**Core Types:**
- `FormType` - Form type identifier (LOA313, LSB, SV, JAB, etc.)
- `FormConfig` - Configuration for a specific form type
- `DateInfo` - Date information (month/year)

**Extraction Types:**
- `ExtractedPage` - Complete page data with metadata
- `PageMetadata` - Page-level metadata flags
- `ExtractionOptions` - Options for PageExtractor

**Grouping Types:**
- `PersonnelGroup` - Group of pages for one employee
- `CompanyGroup` - Group of company-wide pages
- `GroupingResult` - Complete grouping result
- `GroupingStatistics` - Statistics from grouping

**Output Types:**
- `WrittenFile` - Information about written PDF file
- `WriteOptions` - Options for PDF writing

### Type Safety Benefits

- Full IDE autocomplete and IntelliSense support
- Compile-time type checking
- Safer refactoring
- Better documentation through types
- Catching errors before runtime

## Technical Details

### Dependencies

**Runtime:**
- **pdf-lib** (^1.17.1): PDF creation and manipulation
- **pdfjs-dist** (^4.7.76): Text extraction from PDFs (Mozilla's PDF.js)
- **commander** (^12.1.0): Command-line interface framework

**Development:**
- **typescript** (^5.9.3): TypeScript compiler
- **@types/node** (^24.8.1): Node.js type definitions
- **tsx** (^4.20.6): TypeScript execution and watch mode

### Architecture

The library follows a **three-layer architecture**:

1. **Core Extraction Layer** (Headless):
   - `PageExtractor`: Main extraction class that returns structured data
   - `FormDetector`: Stateless form type detection
   - `MetadataExtractor`: Stateless metadata extraction
   - **No file I/O or side effects** - completely reusable

2. **Grouping Layer**:
   - `PageGrouper`: Groups pages by personnel number or month
   - Handles company-wide documents separately
   - Supports custom grouping strategies

3. **Output Layer**:
   - `PDFWriter`: Creates PDF files from grouped pages
   - `CSVExporter`: Exports personnel data to CSV
   - `StatsExporter`: Exports statistics to JSON

The implementation uses a two-library approach:
- **pdf.js** for robust text extraction
- **pdf-lib** for efficient PDF page manipulation

### Regular Expressions

The tool uses German-specific regex patterns:

```javascript
// Personnel number patterns
/(?:Personalnummer|Personal-Nr\.|Pers\.Nr\.|PN)\s*:?\s*(\d{4,6})/i

// Date pattern (German months)
/(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s*(\d{4})/i

// Name pattern (German capitalization rules)
/(?:Name|Mitarbeiter)\s*:?\s*([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)*)/
```

## Development

### Project Structure

```
abinnovision-datev-lohn-extract/
├── src/
│   ├── core/              # Core extraction layer (headless)
│   │   ├── form-configs.ts       # Form type configurations
│   │   ├── form-detector.ts      # Form type detection
│   │   ├── metadata-extractor.ts # Metadata extraction
│   │   └── page-extractor.ts     # Main extraction class
│   ├── grouping/          # Grouping layer
│   │   └── page-grouper.ts       # Page grouping strategies
│   ├── output/            # Output layer
│   │   ├── pdf-writer.ts         # PDF file creation
│   │   ├── csv-exporter.ts       # CSV export
│   │   └── stats-exporter.ts     # Statistics export
│   ├── types.ts           # TypeScript type definitions
│   ├── cli.ts             # CLI orchestration
│   └── index.ts           # Library exports
├── dist/                  # Compiled JavaScript (generated)
├── tsconfig.json          # TypeScript configuration
├── package.json           # Dependencies and scripts
├── README.md             # Documentation
└── yarn.lock             # Dependency lock file
```

### Scripts

```bash
# Run the tool
yarn start <input.pdf>

# Development mode with auto-reload (Node 18+)
yarn dev <input.pdf>
```

### Testing

To test the implementation:

1. Prepare a sample DATEV PDF with multiple employees (can include mixed form types)
2. Run with debug mode to see form detection and extraction details:
   ```bash
   node datev-splitter.js -d -f stats.json -e personnel.csv -o test_output sample.pdf
   ```
3. Verify:
   - Form types are correctly detected (check console output)
   - All pages are assigned to correct personnel numbers
   - Output files have correct naming with form types
   - Multi-page employee documents stay together
   - CSV export contains all employees with form types
   - JSON statistics show correct form type breakdown

**Example debug output to look for:**
```
INFO: Page 1: Form type LOA313 (Lohnabrechnung Standard)
DEBUG: Detected form type from Form-Nr.: LOA313
DEBUG: Page 1: PN=00203, Date=Dezember 2022, Name=Max Mustermann, Form=LOA313
```

## Troubleshooting

### Form type not detected correctly
- **Symptom**: Pages show `UNKNOWN` form type or wrong type
- **Solution**:
  - Use `-d` (debug mode) to see form detection process
  - Check if the PDF has an explicit form number (`Form.-Nr.`)
  - If not, the tool uses content-based detection (keywords)
  - You can add custom form types by modifying `FORM_CONFIGS` in the code

### No personnel numbers found
- Ensure the PDF contains German DATEV salary statements
- Check if the personnel number format matches the form-specific patterns
- Use `-d` (debug mode) to see which pattern is being used
- Use `-t` (trace mode) to see raw extracted text
- Different form types use different field names (Personalnummer vs. Steuer-ID vs. Versicherungsnummer)

### Wrong personnel numbers extracted for specific form types
- **Symptom**: Numbers don't match expected values for LSB or SV forms
- **Solution**:
  - Check the form type detection (should show correct form in debug mode)
  - Each form type has its own personnel pattern
  - LSB accepts both Personalnummer and Steuer-Identifikationsnummer
  - SV uses Versicherungsnummer

### Incorrect page grouping
- The tool maintains context across pages without explicit personnel numbers
- First page of each employee MUST contain a personnel number
- Use `-d` (debug mode) to verify page assignments and form types
- Check if continuation pages are correctly assigned to the right employee

### Form statistics don't add up
- **Symptom**: JSON statistics show unexpected page counts
- **Solution**:
  - Each page is counted once under its detected form type
  - Pages without detected personnel numbers are not counted
  - Use `-d` mode to see which pages are assigned to which form types

### Memory issues with large PDFs
- The tool loads the entire PDF into memory
- For files > 100MB, consider splitting the input first
- Recommended: Process monthly batches separately

### Special characters in names
- German umlauts (ä, ö, ü) are supported
- Names must follow German capitalization (Title Case)
- Different form types may have different name formats
- LSB and SV patterns are more flexible with commas and spaces

## Performance

- **Text extraction**: ~10-50 pages/second (depends on PDF complexity)
- **PDF creation**: Very fast with pdf-lib
- **Memory usage**: Approximately 2-3x the input PDF size
- **Recommended**: Process files in monthly batches

## Comparison to Python Version

| Feature | Python (PyMuPDF) | Node.js (pdf.js + pdf-lib) |
|---------|------------------|---------------------------|
| Text extraction | PyMuPDF | PDF.js |
| PDF manipulation | PyMuPDF | pdf-lib |
| CLI framework | argparse | commander |
| Async operations | ❌ Sync | ✅ Async/await |
| License | AGPL (PyMuPDF) | Apache 2.0 + MIT |
| Performance | Slightly faster | Very good |

## License

MIT

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## Credits

This implementation is based on the Python [datev-splitter](https://github.com/tuergeist/datev-splitter) tool by tuergeist.

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing issues for similar problems
- Provide sample PDFs (with sensitive data removed) when reporting bugs
