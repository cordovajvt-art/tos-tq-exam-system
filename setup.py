from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent

GITIGNORE = """node_modules/
dist/
build/
.env
.env.local
.vscode/
.idea/
.DS_Store
*.log
coverage/
"""

README = """# TOS-TQ Examination Printing Request System

A web-based system for preparing Tables of Specifications (TOS),
test questionnaires (TQ), and examination printing requests.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ for local development without Docker
- PostgreSQL 15+ when running the database outside Docker

## Quick Start

```bash
cp .env.example .env
docker compose -f infra/docker/docker-compose.yml up --build
```

Once the services are running:

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:3000/api/v1>
- API documentation: <http://localhost:3000/api/docs>

See [`docs/SETUP.md`](docs/SETUP.md) for the complete local-development guide.
"""


def main() -> None:
    """Create the repository's basic configuration and README files."""
    (PROJECT_ROOT / ".gitignore").write_text(GITIGNORE, encoding="utf-8")
    (PROJECT_ROOT / "README.md").write_text(README, encoding="utf-8")
    print(f"Project files initialized in {PROJECT_ROOT}")


if __name__ == "__main__":
    main()
