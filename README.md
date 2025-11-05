# DATEV Lohn Extract - Monorepo

Monorepo for DATEV PDF salary statement processing.

## Packages

- **[@internal/datev-lohn-extract-core](packages/datev-lohn-extract-core)** - Core extraction library
- **[@internal/datev-lohn-extract-cli](packages/datev-lohn-extract-cli)** - Command-line interface
- **[@internal/app-api](apps/api)** - REST API service

## Setup

### Prerequisites

- Node.js >= 18.0.0
- Yarn 4.10.3 (managed via Corepack)

### Installation

```bash
corepack enable
yarn install
```

## Development

```bash
# Build all packages
yarn build

# Start development servers
yarn dev

# Run tests
yarn test

# Lint and format
yarn lint:check
yarn format:check
```

### Working with Specific Packages

```bash
# Build specific package
yarn turbo build --filter=@internal/datev-lohn-extract-core

# Start API in dev mode
yarn workspace @internal/app-api start:dev

# Run tests for specific package
yarn workspace @internal/datev-lohn-extract-core test-unit
```

## Commits

This repository uses [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update documentation"
```

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## License

MIT
