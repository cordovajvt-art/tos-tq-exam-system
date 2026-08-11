# TOS–TQ Examination Printing Request System

A runnable replacement for submitting and tracking secure examination-printing requests.

## Included

- Responsive faculty dashboard and searchable request register
- Examination request submission with schedule and quantity validation
- Controlled workflow: Submitted → Under Review → Approved → Printing → Ready → Released
- Return-for-revision path and auditable status-history records
- Persistent SQLite database with a documented schema
- Health endpoint, automated tests, Docker image, Compose configuration, and GitHub Actions verification

## Start

```bash
npm run build
npm start
```

Visit <http://localhost:4173>. See `docs/SETUP.md` for production instructions.

## Scope

This is a replacement MVP created because the original repository contained manifests but no application source. Authentication, document uploads, PDF generation, email delivery, and institution-specific authorization should be added before handling confidential production examinations.
