# @internal/datev-lohn-extract-cli

Command-line interface for processing DATEV PDF salary statements.

## Overview

This CLI tool provides a simple command-line interface for splitting DATEV PDF salary statements into individual employee documents and generating SEPA transfer files.

## Features

- **PDF Splitting**: Automatically splits multi-employee PDFs into individual files
- **Personnel Detection**: Extracts personnel numbers from each document
- **SEPA Export**: Generates CSV files with SEPA transfer information
- **Company Documents**: Handles company-wide documents separately

## Installation

This is an internal workspace package. To use it:

```bash
# Build the CLI
yarn workspace @internal/datev-lohn-extract-cli build

# Link for local development (from root)
cd packages/datev-lohn-extract-cli
yarn link
```

## Usage

### Basic Usage

```bash
datev-splitter input.pdf -o ./output
```

### Command-Line Options

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
# Process a DATEV PDF and output to ./output directory
datev-splitter salary-statements-2025-10.pdf -o ./output

# Output structure:
# ./output/
# ├── 12345-2025-Oktober-LOGN17.pdf    # Employee 12345
# ├── 67890-2025-Oktober-LOGN17.pdf    # Employee 67890
# └── sepa-transfers.csv               # SEPA transfer data
```

## Output Files

### Employee PDFs

Individual PDFs are named with the pattern:

```
{personnelNumber}-{year}-{month}-{formType}.pdf
```

Example: `12345-2025-Oktober-LOGN17.pdf`

### SEPA Transfers CSV

The `sepa-transfers.csv` file contains:

- Personnel Number
- Employee Name
- IBAN
- Net Amount (Netto)
- Month
- Year

## Dependencies

This CLI depends on:

- **@internal/datev-lohn-extract-core** - Core extraction library
- **commander** - Command-line argument parsing

## Architecture

The CLI is a thin orchestration layer that:

1. Reads PDF files from disk
2. Passes data to the core library for processing
3. Writes output files back to disk
4. Provides user-friendly console output

All extraction logic is in the core library, making it reusable by other applications (like the REST API).

## Development

```bash
# Build
yarn build

# Lint
yarn lint:check
yarn lint:fix

# Format
yarn format:check
yarn format:fix

# Test
yarn test-unit
yarn test-unit:watch
```

## Related Packages

- **@internal/datev-lohn-extract-core** - Core extraction library (used by this CLI)
- **@internal/api** - REST API service (also uses the core library)

## License

MIT
