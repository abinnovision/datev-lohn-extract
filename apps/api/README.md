# @internal/app-api

REST API service for DATEV PDF salary statement extraction.

## Features

- PDF upload and extraction via REST API
- ZIP bundle output with individual PDFs and SEPA CSV
- File validation and security checks
- OpenAPI documentation
- Health check endpoints

## API Endpoints

### Health Check

#### `GET /health`

Basic health check.

**Response:**

```json
{
  "status": "ok"
}
```

### Extraction

#### `POST /extract/bundle`

Upload a DATEV PDF and receive a ZIP bundle containing:
- Individual personnel PDFs (`PERSONNEL-YYYY-Month-XXXXX.pdf`)
- Company-wide PDFs (`COMPANY-YYYY-Month.pdf`)
- SEPA transfers CSV (`sepa-transfers.csv`)
- Metadata JSON (`metadata.json`)

**Request:**

- Content-Type: `multipart/form-data`
- Field: `file` (PDF file, max 10MB)

**Response:**

- Content-Type: `application/zip`
- Body: ZIP archive containing all files

**Security Features:**

- File size validation (max 10MB, configurable)
- PDF signature validation
- Page count limits (max 1000 pages, configurable)
- Processing timeout (15s, configurable)
- Path traversal prevention

## Development

### Start Development Server

```bash
yarn workspace @internal/app-api start:dev
```

The server will start on `http://localhost:3000/api/v1` with hot-reload enabled.

### Build for Production

```bash
yarn turbo build --filter=@internal/app-api
```

### Run in Production

```bash
yarn workspace @internal/app-api start
```

## Environment Variables

- `HTTP_PORT` - Server port (default: 3000)
- `APP_BASE_URL` - Base URL for API (default: `http://localhost:3000/api/v1`)
- `APP_MAX_FILE_SIZE` - Maximum upload size in bytes (default: 10485760 / 10MB)
- `APP_PROCESSING_TIMEOUT` - Processing timeout in ms (default: 15000 / 15s)
- `APP_MAX_PAGE_COUNT` - Maximum page count (default: 1000)

## OpenAPI Documentation

OpenAPI specification available at: `GET /api/v1/openapi.json`

## Architecture

### Tech Stack

- **Framework**: Hono (ultrafast web framework)
- **Runtime**: Node.js with @hono/node-server
- **Language**: TypeScript
- **Validation**: Zod with OpenAPI integration
- **Testing**: Vitest

### Project Structure

```
src/
├── index.ts                      # App entry point
├── env.ts                        # Environment validation
├── routes/
│   ├── health.ts                 # Health check endpoints
│   └── extract.ts                # Extraction endpoints
├── middleware/
│   └── upload-validation.ts      # Upload validation & security
├── schemas/
│   └── common.ts                 # OpenAPI schemas
└── utils/
    └── errors.ts                 # Error handling
```

## Testing

```bash
# Run unit tests
yarn workspace @internal/app-api test-unit

# Watch mode
yarn workspace @internal/app-api test-unit:watch
```

## Dependencies

- `@internal/datev-lohn-extract-core` - Core extraction library
- `hono` - Web framework
- `archiver` - ZIP creation
- `zod` - Schema validation
- `hono-openapi` - OpenAPI documentation

## License

MIT
