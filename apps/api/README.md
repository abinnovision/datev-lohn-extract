# @internal/app-api

REST API service for DATEV PDF salary statement extraction.

## Quick Start

### Development

```bash
yarn workspace @internal/app-api start:dev
# Server runs on http://localhost:3000/api/v1
```

### Production

```bash
yarn turbo build --filter=@internal/app-api
yarn workspace @internal/app-api start
```

## API Endpoints

### `GET /health`

Health check endpoint.

```json
{ "status": "ok" }
```

### `POST /extract/bundle`

Upload a DATEV PDF and receive a ZIP bundle containing:

- Individual personnel PDFs (`PERSONNEL-YYYY-Month-XXXXX.pdf`)
- Company-wide PDFs (`COMPANY-YYYY-Month.pdf`)
- SEPA transfers CSV (`sepa-transfers.csv`)
- Metadata JSON (`metadata.json`)

**Request:**

- Content-Type: `multipart/form-data`
- Field: `file` (PDF file)

**Response:**

- Content-Type: `application/zip`

### OpenAPI Documentation

Full API specification: `GET /api/v1/openapi.json`

## Configuration

Environment variables (with defaults):

```bash
HTTP_PORT=3000                      # Server port
APP_BASE_URL=http://localhost:3000/api/v1
APP_MAX_FILE_SIZE=10485760          # 10MB
APP_PROCESSING_TIMEOUT=15000        # 15s
APP_MAX_PAGE_COUNT=1000
```

## License

MIT
