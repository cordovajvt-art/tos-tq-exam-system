# Local Development Setup

## Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development without Docker)
- PostgreSQL 15+ (if not using Docker)

## Quick Start (Docker)

```bash
# 1. Clone the repository
git clone &lt;repo-url&gt;
cd tos-tq-exam-system

# 2. Create environment file
cp .env.example .env

# 3. Start all services
docker-compose -f infra/docker/docker-compose.yml up --build

# 4. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3000/api/v1
# API Docs: http://localhost:3000/api/docs
