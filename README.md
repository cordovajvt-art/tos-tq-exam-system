# TOS–TQ Examination Printing Request System

A runnable replacement for submitting and tracking secure examination-printing requests.

## Included

- Responsive faculty dashboard and searchable request register
- Integrated Table of Specifications form with learning outcomes, coverage, total items, and Bloom's cognitive-level distribution
- Examination request submission with schedule, quantity, and 100% TOS-distribution validation
- Controlled approval workflow: Submitted → Area Coordinator Review → Dean Review → Approved → Printing → Ready → Released
- Named Area Coordinator and Dean approval records with notes and timestamps
- Separate dashboards for the Dean, Biology & Chemistry Area Coordinator, and Mathematics & Physics Area Coordinator
- Academic-area routing so coordinators see only their assigned faculty submissions
- Separate reviewer comments for the TOS and TQ, with required PNG/JPEG/WebP signature attachment on approval
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
