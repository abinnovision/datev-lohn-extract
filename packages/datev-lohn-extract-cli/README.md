# @internal/datev-lohn-extract-cli

Command-line interface for processing DATEV PDF salary statements.

## Features

- Split multi-employee PDFs into individual files
- Generate company-wide document PDFs
- Export SEPA transfer CSV for salary payments
- Automatic personnel detection and grouping

## Installation

Build the CLI from the workspace root:

```bash
yarn workspace @internal/datev-lohn-extract-cli build
```

## Usage

### Basic Usage

```bash
datev-splitter input.pdf -o ./output
```

### Options

```
Usage: datev-splitter [options] <infile>

Process DATEV salary statements and generate employee documents with SEPA transfers

Arguments:
  infile                      DATEV PDF file to process

Options:
  -o, --output <directory>    Output directory (default: ".")
  -h, --help                 display help for command
```

### Example

```bash
datev-splitter salary-statements-2025-10.pdf -o ./output

# Output structure:
# ./output/
# ├── PERSONNEL-2025-Oktober-12345.pdf    # Employee 12345
# ├── PERSONNEL-2025-Oktober-67890.pdf    # Employee 67890
# ├── COMPANY-2025-Oktober.pdf            # Company-wide documents
# └── sepa-transfers.csv                  # SEPA transfer data
```

## Output Files

### Personnel PDFs

Individual employee PDFs are named:

```
PERSONNEL-{year}-{month}-{personnelNumber}.pdf
```

Example: `PERSONNEL-2025-Oktober-12345.pdf`

### Company PDFs

Company-wide documents are named:

```
COMPANY-{year}-{month}.pdf
```

Example: `COMPANY-2025-Oktober.pdf`

### SEPA Transfers CSV

The `sepa-transfers.csv` file contains:

```csv
beneficiary_name,iban,amount,currency,reference
"John Doe","DE89370400440532013000","2100.50","EUR","Gehalt Oktober 2025 (12345)"
```

## Dependencies

- `@internal/datev-lohn-extract-core` - Core extraction library
- `commander` - Command-line argument parsing

## Development

```bash
# Build
yarn build

# Lint
yarn lint:check
yarn lint:fix

# Test
yarn test-unit
yarn test-unit:watch
```

## License

MIT
