# Local and production setup

## Requirements

- Node.js 22.5 or newer, or Docker

No package download or external database is required. The application uses Node's built-in SQLite support and stores its database at `data/exam-system.db`.

The application automatically migrates existing request databases to add TOS fields and separate Area Coordinator and Dean approval records.

Use the review-workspace links in the sidebar to preview the Biology & Chemistry coordinator, Mathematics & Physics coordinator, and Dean dashboards. Coordinator queues are filtered by the academic area selected on the faculty request. Signed approvals store separate TOS and TQ comments plus an image signature of no more than 1 MB.

The TOS editor follows the supplied landscape template: Topic/Objectives, hours, hours percentage, type of test, Remembering, Understanding, Applying, Analyzing, Evaluating, Creating, number of items, number of points, and points percentage. Faculty enter hours, points, and item counts; all percentages and totals are calculated in real time and recalculated by the API on submission.

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
