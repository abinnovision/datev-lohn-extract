# DATEV Lohn Extract - Monorepo

A monorepo containing a core extraction library and REST API service for processing DATEV PDF salary statements.

## Overview

This monorepo uses **Yarn Workspaces + Turborepo** to manage multiple packages:

- **`packages/datev-lohn-extract-core`** - Core extraction library (headless)
- **`packages/datev-lohn-extract-cli`** - Command-line interface for PDF processing
- **`apps/api`** - REST API service (Hono-based) for PDF processing

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- Yarn 4.10.3 (managed via Corepack)

### Installation

```bash
# Enable Corepack (if not already enabled)
corepack enable

# Install all dependencies
yarn install
```

### Development

```bash
# Build all packages (includes type checking)
yarn build

# Start development servers with hot-reload
yarn dev

# Run linting
yarn lint:check
yarn lint:fix

# Run tests
yarn test
yarn test:watch

# Format code
yarn format:check
yarn format:fix
```

### Working with Specific Workspaces

```bash
# Build only the core package
yarn turbo build --filter=@internal/datev-lohn-extract-core

# Build the CLI
yarn turbo build --filter=@internal/datev-lohn-extract-cli

# Start only the API in dev mode
yarn workspace @internal/app-api start:dev

# Run tests for a specific package
yarn workspace @internal/datev-lohn-extract-core test-unit
```

## Repository Structure

```
.
├── apps/
│   └── api/                      # REST API service (Hono)
│       ├── src/
│       │   ├── index.ts         # Server entry point
│       │   ├── routes/          # API endpoints
│       │   ├── middleware/      # Upload validation & security
│       │   ├── schemas/         # OpenAPI schemas
│       │   └── utils/           # Error handling
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── vitest.config.ts
│       └── eslint.config.js
│
├── packages/
│   ├── datev-lohn-extract-core/ # Core extraction library
│   │   ├── src/
│   │   │   ├── core/            # Extraction logic
│   │   │   ├── grouping/        # Page grouping
│   │   │   ├── output/          # Export utilities
│   │   │   ├── index.ts         # Public API
│   │   │   └── types.ts         # TypeScript types
│   │   ├── dist/                # Build output
│   │   ├── package.json
│   │   └── ...configs
│   │
│   └── datev-lohn-extract-cli/  # CLI tool
│       ├── src/
│       │   └── cli.ts           # CLI implementation
│       ├── dist/                # Build output
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── vitest.config.ts
│       └── eslint.config.js
│
├── .husky/                       # Git hooks
│   ├── pre-commit               # Runs lint-staged
│   └── commit-msg               # Runs commitlint
│
├── package.json                  # Root workspace config
├── turbo.json                    # Turborepo pipeline
├── vitest.config.mts            # Root test config
├── .yarnrc.yml                  # Yarn configuration
└── .gitignore                   # Git ignore patterns
```

## Technology Stack

### Build & Package Management

- **Yarn 4.x** (Berry) with `nodeLinker: node-modules`
- **Turborepo 2.x** - Build orchestration and caching
- **TypeScript 5.x** - Type-safe development

### Code Quality

- **ESLint 9.x** (flat config) - Linting
- **Prettier 3.x** - Code formatting
- **Husky 9.x** - Git hooks
- **lint-staged** - Pre-commit checks
- **Commitlint** - Conventional commit messages

### Testing

- **Vitest 3.x** - Fast unit testing
- **@vitest/coverage-v8** - Code coverage

### Core Dependencies

- **pdf-lib** - PDF manipulation
- **pdfjs-dist** - PDF parsing
- **Hono** - Web framework (apps/api)

## Workspaces

### @internal/datev-lohn-extract-core (Package)

Core library for extracting structured data from DATEV PDF documents. Headless library for programmatic use.

**Key Features:**

- Form detection (LOGN17, LOMS05, Unknown)
- Data extraction (personnel, financial, dates)
- Page grouping by employee
- Export utilities (PDF generation, SEPA CSV)

**Usage:**

```typescript
import { PageExtractor, PageGrouper } from "@internal/datev-lohn-extract-core";

const extractor = new PageExtractor();
const pages = await extractor.extractPages(pdfBuffer);

const grouper = new PageGrouper();
const result = grouper.groupByPersonnel(pages);
```

See [packages/datev-lohn-extract-core/README.md](packages/datev-lohn-extract-core/README.md) for details.

### @internal/datev-lohn-extract-cli (Package)

Command-line interface for processing DATEV PDF salary statements.

**Binary:** `datev-splitter`

**Usage:**

```bash
datev-splitter input.pdf -o ./output
```

**Features:**

- Split PDFs by employee
- Generate SEPA transfer CSV
- Handle company-wide documents

See [packages/datev-lohn-extract-cli/README.md](packages/datev-lohn-extract-cli/README.md) for details.

### @internal/app-api (App)

REST API service for DATEV PDF processing.

**Endpoints:**

- `GET /health` - Health check
- `POST /extract/bundle` - Extract and return ZIP bundle with PDFs and SEPA CSV

**Start Development:**

```bash
yarn workspace @internal/app-api start:dev
# Server runs on http://localhost:3000/api/v1
```

See [apps/api/README.md](apps/api/README.md) for details.

## Development Workflow

### 1. Making Changes

```bash
# Create a feature branch
git checkout -b feat/your-feature

# Make changes to packages or apps
# Edit files in packages/datev-lohn-extract-core, packages/datev-lohn-extract-cli, or apps/api

# Build (includes type checking)
yarn build

# Lint and format
yarn lint:fix
yarn format:fix

# Test
yarn test
```

### 2. Committing Changes

The repository uses **Conventional Commits** enforced by commitlint:

```bash
# Stage changes
git add .

# Commit (lint-staged will auto-fix on pre-commit)
git commit -m "feat: add new extraction feature"

# Valid commit types: feat, fix, docs, style, refactor, test, chore
```

**Pre-commit checks:**

- Runs lint-staged on changed files
- Auto-fixes ESLint and Prettier issues
- Sorts package.json files

### 3. Building for Production

```bash
# Clean all build artifacts
yarn clean

# Build all packages (uses Turbo cache)
yarn build

# Verify builds
ls packages/datev-lohn-extract-core/dist
ls packages/datev-lohn-extract-cli/dist
ls apps/api/dist
```

## Turborepo Tasks

Turborepo orchestrates tasks across workspaces with caching and parallelization:

```bash
# Build all packages with type checking (cached)
yarn turbo build

# Run all linting checks (cached)
yarn turbo lint:check

# Run all unit tests (cached)
yarn turbo test-unit

# Clear Turbo cache
rm -rf .turbo
```

**Cache Benefits:**

- Skips tasks if inputs haven't changed
- Dramatically speeds up CI/CD
- Local cache stored in `.turbo/`
- Can be configured for remote caching

## Testing

### Unit Tests

```bash
# Run all unit tests with coverage
yarn test

# Watch mode (interactive)
yarn test:watch

# Run tests for specific workspace
yarn workspace @internal/datev-lohn-extract-core test-unit
```

### Coverage

Coverage is aggregated across all workspaces:

```bash
yarn test
# See coverage/ directory for reports
```

## Code Quality

### Linting

ESLint is configured per workspace with shared @abinnovision configs:

```bash
# Check all workspaces
yarn lint:check

# Auto-fix issues
yarn lint:fix

# Lint specific workspace
yarn workspace @internal/app-api lint:check
```

### Formatting

Prettier uses @abinnovision/prettier-config:

```bash
# Check formatting
yarn format:check

# Fix formatting
yarn format:fix
```

## Adding New Packages

### 1. Create Package Directory

```bash
mkdir packages/new-package
cd packages/new-package
```

### 2. Create package.json

```json
{
  "name": "@internal/new-package",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.build.json"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.9.3"
  }
}
```

### 3. Add TypeScript Configs

Create `tsconfig.json` and `tsconfig.build.json` (see existing packages).

### 4. Reference from Other Workspaces

```json
{
  "dependencies": {
    "@internal/new-package": "workspace:^"
  }
}
```

### 5. Install and Build

```bash
yarn install
yarn turbo build
```

## Adding New Apps

Similar to packages, but:

- Place in `apps/` directory
- Set `"private": true` in package.json
- No need to export types
- Can depend on workspace packages

## CI/CD Integration

### GitHub Actions Example

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "18"

      - name: Enable Corepack
        run: corepack enable

      - name: Install dependencies
        run: yarn install

      - name: Lint
        run: yarn lint:check

      - name: Test
        run: yarn test

      - name: Build (includes type checking)
        run: yarn build
```

### Cache Optimization

Cache these directories for faster CI:

- `.turbo/` - Turborepo cache
- `node_modules/` - Dependencies
- `.yarn/cache/` - Yarn cache (if using Zero-Installs)

## Environment Variables

### apps/api

- `HTTP_PORT` - Server port (default: 3000)
- `APP_BASE_URL` - Base URL for API (default: `http://localhost:3000/api/v1`)
- `APP_MAX_FILE_SIZE` - Maximum upload size in bytes (default: 10485760 / 10MB)
- `APP_PROCESSING_TIMEOUT` - Processing timeout in ms (default: 15000 / 15s)
- `APP_MAX_PAGE_COUNT` - Maximum page count (default: 1000)

Add `.env` files to workspace roots (gitignored by default).

## Troubleshooting

### Workspace not found

```bash
# Rebuild workspace links
yarn install --force
```

### Build cache issues

```bash
# Clear Turbo cache
yarn turbo build --force

# Clean all builds
yarn clean
```

### Type errors after adding dependencies

```bash
# Rebuild packages
yarn turbo build

# Restart TypeScript server in your IDE
```

### Git hooks not running

```bash
# Reinstall Husky
yarn install
chmod +x .husky/pre-commit .husky/commit-msg
```

## Contributing

1. Fork the repository
2. Create a feature branch (`feat/your-feature`)
3. Make changes following code quality standards
4. Commit using Conventional Commits
5. Push and create a pull request

## License

MIT

## Resources

- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Yarn Workspaces](https://yarnpkg.com/features/workspaces)
- [Hono Documentation](https://hono.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [Original README](README.old.md) (previous single-package documentation)
