# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 4.x     | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

**No public issue.** Email [security@planty.app](mailto:security@planty.app).
Ack within 48h, status update within 5 business days.

## Architecture

- **Frontend**: Vanilla JS PWA, static files. No client-side secrets.
- **Backend**: FastAPI + SQLite (WAL mode). Single-user, no auth.
- **Data**: Local (localStorage + IndexedDB) → synced to server SQLite.
- **Weather**: Client-side fetch from Open-Meteo (no API key).

## Security Measures

### Input Validation
- All API inputs → Pydantic v2 validators
- HTML tags, script injection stripped from user text
- IDs: alphanumeric + dash/underscore only
- Event types, feedback values whitelist-checked

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
- Health endpoint excluded

### Data Integrity
- SQLite: WAL mode + foreign keys
- Pipeline audit log (`pipeline_runs` table) tracks all ETL ops
- Consistency check: `/api/health/consistency`

### Client-Side
- User text sanitized before DOM insertion (`textContent`-based sanitization)
- Service worker: API cache excluded (never caches `/api/*`)
- No third-party scripts or CDN deps

## Known Limitations

- **Single-user**: No auth, no multi-tenancy. Not for multi-user deploy.
- **No encryption at rest**: SQLite unencrypted. Deploy on trusted infra.
- **Client-side state**: Plant data in localStorage; no server-side ownership check.
- **Rate limiter**: In-memory, resets on restart. Fine for single-user scale.