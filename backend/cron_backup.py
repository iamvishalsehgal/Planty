"""Standalone backup script for Render cron jobs. Calls backup directly."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("PLANTY_DB_PATH", "/var/data/planty.db")
os.environ.setdefault("PLANTY_BACKUP_DIR", "/var/data/backups")

from backup import run_backup
import json

result = run_backup()
print(json.dumps(result, indent=2))
sys.exit(0 if result["success"] else 1)
