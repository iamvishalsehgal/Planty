# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 4.x     | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

**Do not open a public issue.** Email [security@planty.app](mailto:security@planty.app).
Expect acknowledgment within 48 hours and a status update within 5 business days.

## Architecture

- **Frontend**: Vanilla JS PWA, served as static files. No client-side secrets.
- **Backend**: FastAPI + SQLite (WAL mode). Single-user design, no authentication.
- **Data**: Stored locally (localStorage + IndexedDB) and synced to server SQLite.
- **Weather**: Fetched client-side from Open-Meteo (no API key required).

## Security Measures

### Input Validation
- All API inputs validated via Pydantic v2 with field validators
- HTML tags and script injection stripped from user text fields
- IDs restricted to alphanumeric + dash/underscore
- Event types and feedback values whitelist-checked

### HTTP Security Headers
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=self`
- `Strict-Transport-Security` (HTTPS only)
- Content-Security-Policy with restricted sources

### Rate Limiting
- Token bucket: 10 req/s per IP
- Health endpoint excluded from rate limits

### Data Integrity
- SQLite with WAL mode and foreign keys enabled
- Pipeline audit log (`pipeline_runs` table) tracks all ETL operations
- Consistency check endpoint at `/api/health/consistency`

### Client-Side
- User text sanitized before DOM insertion (`textContent`-based sanitization)
- Service worker with API cache exclusion (never caches `/api/*`)
- No third-party scripts or CDN dependencies

## Known Limitations

- **Single-user design**: No authentication or multi-tenancy. Not suitable for multi-user deployments.
- **No encryption at rest**: SQLite database is unencrypted. Deploy on trusted infrastructure.
- **Client-side state**: Plant data stored in localStorage; no server-side ownership verification.
- **Rate limiter**: In-memory, resets on restart. Sufficient for single-user scale.
