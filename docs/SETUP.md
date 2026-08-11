# Local and production setup

## Requirements

- Node.js 22.5 or newer, or Docker

No package download or external database is required. The application uses Node's built-in SQLite support and stores its database at `data/exam-system.db`.

The application automatically migrates existing request databases to add TOS fields and separate Area Coordinator and Dean approval records.

## Local run

```bash
cp .env.example .env
npm run build
npm start
```

Open <http://localhost:4173>. Run checks with `npm test`.

## Docker

```bash
docker compose up --build -d
```

The named `exam_data` volume preserves requests between container replacements. The health endpoint is `/api/health`.

## Production

Build the included Dockerfile on any container host, publish port `4173`, mount persistent storage at `/app/data`, and terminate TLS at the platform load balancer. The GitHub Actions workflow verifies every change and publishes the `latest` image to GitHub Container Registry after pushes to `main`.
