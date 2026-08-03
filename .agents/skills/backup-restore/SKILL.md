---
name: backup-restore
description: Backup and disaster recovery. Covers automated backups, incremental backups, restoration procedures, off-site storage, testing backups.
---

# Backup & Restore

## When to Apply
Use this skill when setting up backup systems, creating disaster recovery plans, or restoring from backups. Apply for automated backup configuration, off-site storage, and backup testing.

## Core Concepts
- Backup Types: Full, incremental, differential
- Recovery Point Objective (RPO): Maximum acceptable data loss
- Recovery Time Objective (RTO): Target restoration time
- 3-2-1 Rule: 3 copies, 2 different media, 1 offsite
- Backup Rotation: Grandfather-father-son, round-robin
- Off-site Storage: Geographic distribution of backups
- Encryption: Protecting backup data at rest
- Verification: Testing backup integrity and restoration

## Implementation
```bash
# rsync incremental backup
rsync -avz --delete --backup --backup-dir=/backups/$(date +%Y-%m-%d) \
  /source/ /destination/

# Database backup (PostgreSQL)
pg_dump -U user -d dbname | gzip > backup_$(date +%Y%m%d).sql.gz

# Database backup (MySQL)
mysqldump -u user -p dbname | gzip > backup_$(date +%Y%m%d).sql.gz

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups"
SOURCE="/var/www"
DATE=$(date +%Y%m%d_%H%M%S)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $SOURCE

# Cron job for daily backups
0 2 * * * /path/to/backup_script.sh

# Restore from backup
tar -xzf backup_20240101.tar.gz -C /restore/path/

# Database restore
psql -U user -d dbname < backup.sql
gunzip < backup.sql.gz | psql -U user -d dbname

# Verify backup integrity
tar -tzf backup.tar.gz > /dev/null && echo "Backup valid"
```

## Best Practices
- Follow the 3-2-1 rule for backup redundancy
- Test backup restoration regularly (quarterly minimum)
- Encrypt sensitive backups, store encryption keys separately
- Automate backups with cron jobs or backup software
- Monitor backup job success/failure
- Keep multiple retention periods (daily, weekly, monthly)
- Document restoration procedures step-by-step
- Use incremental backups for large datasets
- Store backups in different geographic locations
- Version backup scripts and configurations
- Set up alerts for failed backup jobs
- Maintain offline copies for ransomware protection