# @internal/api

REST API service for DATEV Lohn extraction.

## Overview

This service provides HTTP endpoints for extracting structured data from DATEV PDF salary statements. It wraps the `@internal/datev-lohn-extract` library with a REST interface.

## Features

- **File Upload Support**: Accept PDF files via multipart/form-data
- **Multiple Extraction Modes**: Raw extraction, grouped data, or split PDFs
- **Health Checks**: Readiness and liveness probes for Kubernetes
- **Type-Safe**: Full TypeScript with Hono framework

## API Endpoints

### Health

#### `GET /health`

Basic health check.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-20T12:00:00.000Z",
  "service": "datev-lohn-extract-api"
}
```

#### `GET /health/ready`

Readiness probe for orchestration platforms.

### Extraction

#### `POST /extract`

Extract raw page data from DATEV PDF.

**Request:**

- Content-Type: `multipart/form-data`
- Field: `file` (PDF file)

**Response:**

```json
{
  "pages": [
    {
      "formType": "LOGN17",
      "personnelNumber": "12345",
      "employeeName": "John Doe",
      "brutto": "3500.00",
      "netto": "2100.50",
      "iban": "DE89370400440532013000",
      "year": "2025",
      "month": "Oktober"
    }
  ]
}
```

#### `POST /extract/grouped`

Extract and group data by employee.

**Request:**

- Content-Type: `multipart/form-data`
- Field: `file` (PDF file)

**Response:**

```json
{
  "personnelGroups": [
    {
      "personnelNumber": "12345",
      "employeeName": "John Doe",
      "pages": [...],
      "formTypes": ["LOGN17"],
      "dateInfo": {
        "month": "Oktober",
        "year": "2025"
      }
    }
  ],
  "companyGroups": [],
  "statistics": {
    "totalPages": 10,
    "uniquePersonnel": 5,
    "companyPages": 0,
    "skippedPages": 0,
    "formTypeBreakdown": {
      "LOGN17": 10,
      "LOMS05": 0,
      "UNKNOWN": 0
    }
  }
}
```

#### `POST /extract/split`

Extract, group, and return split PDFs as a ZIP archive.

**Request:**

- Content-Type: `multipart/form-data`
- Field: `file` (PDF file)

**Response:**

- Content-Type: `application/zip`
- Body: ZIP archive containing split PDFs organized by employee

## Development

### Start Development Server

```bash
yarn workspace @internal/api start:dev
```

The server will start on `http://localhost:3000` with hot-reload enabled.

### Build for Production

```bash
yarn turbo build --filter=@internal/api
```

### Run in Production

```bash
yarn workspace @internal/api start
```

## Environment Variables

- `PORT` - Server port (default: 3000)

## Testing

```bash
# Run unit tests
yarn workspace @internal/api test-unit

# Watch mode
yarn workspace @internal/api test-unit:watch
```

## Architecture

### Tech Stack

- **Framework**: Hono (ultrafast web framework)
- **Runtime**: Node.js with @hono/node-server
- **Language**: TypeScript
- **Testing**: Vitest

### Project Structure

```
src/
├── index.ts           # App entry point
├── routes/
│   ├── health.ts      # Health check endpoints
│   └── extract.ts     # Extraction endpoints (TODO)
├── middleware/        # Custom middleware (TODO)
└── lib/               # Utility functions (TODO)
```

## TODO

- [ ] Implement file upload middleware
- [ ] Implement `/extract` endpoint
- [ ] Implement `/extract/grouped` endpoint
- [ ] Implement `/extract/split` endpoint with ZIP creation
- [ ] Add request validation
- [ ] Add error handling middleware
- [ ] Add request size limits
- [ ] Add rate limiting
- [ ] Add API documentation (OpenAPI/Swagger)
- [ ] Add integration tests
- [ ] Add Docker support

## License

MIT
