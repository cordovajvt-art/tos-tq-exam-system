import os
import subprocess

os.chdir(os.path.expanduser("~/tos-tq-exam-system"))

# .gitignore
with open(".gitignore", "w") as f:
    f.write("node_modules/\ndist/\nbuild/\n.env\n.env.local\n.vscode/\n.idea/\n.DS_Store\n*.log\ncoverage/\n")

# README.md
with open("README.md", "w") as f:
    f.write("""# TOS-TQ Examination Printing Request System

## Quick Start
```bash
cp .env.example .env
docker-compose -f infra/docker/docker-compose.yml up --build
