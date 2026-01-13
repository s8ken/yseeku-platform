# Backup and Disaster Recovery Procedures

## Overview

This document provides comprehensive backup and disaster recovery (DR) procedures for the YSEEKU Platform, ensuring business continuity and data protection for the AI governance infrastructure.

## Recovery Objectives

| Objective | Target | Notes |
|-----------|--------|-------|
| **RTO** (Recovery Time Objective) | 4 hours | Time to restore service |
| **RPO** (Recovery Point Objective) | 1 hour | Maximum data loss window |
| **MTTR** (Mean Time To Recovery) | 2 hours | Average recovery time |

## Data Classification

| Data Type | Criticality | Backup Frequency | Retention |
|-----------|-------------|------------------|-----------|
| Trust Receipts | Critical | Continuous (oplog) | 7 years |
| Alerts | High | Hourly | 90 days |
| Agent Configurations | High | Hourly | 1 year |
| Tenant Settings | High | Hourly | 1 year |
| Conversations | Medium | Daily | 30 days |
| Audit Logs | Critical | Continuous | 7 years |
| Metrics/Telemetry | Low | Daily | 30 days |

## Backup Strategy

### MongoDB Atlas (Managed)

If using MongoDB Atlas, continuous backups are automatic:

```yaml
# Atlas cluster configuration
backupEnabled: true
pointInTimeRecoveryEnabled: true
snapshotBackupPolicy:
  reference_hour: 3  # 3 AM UTC
  reference_minute: 0
  snapshot_interval_hours: 6
  snapshot_retention_days: 7
  on_demand_policy:
    retention_unit: "weeks"
    retention_value: 2
```

### Self-Managed MongoDB

#### Automated Backup Script

```bash
#!/bin/bash
# /opt/scripts/mongodb-backup.sh

set -euo pipefail

BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="yseeku_${DATE}"
RETENTION_DAYS=7

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Perform backup with oplog for point-in-time recovery
mongodump \
  --uri="${MONGODB_URI}" \
  --out="${BACKUP_DIR}/${BACKUP_NAME}" \
  --oplog \
  --gzip

# Calculate checksum
cd "${BACKUP_DIR}"
sha256sum -b "${BACKUP_NAME}"/*.gz > "${BACKUP_NAME}/checksums.sha256"

# Upload to S3/GCS
aws s3 sync "${BACKUP_DIR}/${BACKUP_NAME}" \
  "s3://yseeku-backups/mongodb/${BACKUP_NAME}/" \
  --storage-class STANDARD_IA

# Cleanup old local backups
find "${BACKUP_DIR}" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} +

# Log completion
echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Backup completed: ${BACKUP_NAME}" >> /var/log/backup.log
```

#### Cron Schedule

```cron
# /etc/cron.d/mongodb-backup
# Hourly backups at minute 15
15 * * * * root /opt/scripts/mongodb-backup.sh >> /var/log/backup.log 2>&1

# Daily full backup at 3 AM UTC
0 3 * * * root /opt/scripts/mongodb-backup.sh --full >> /var/log/backup.log 2>&1
```

### Redis Backup (Sessions/Cache)

```bash
#!/bin/bash
# /opt/scripts/redis-backup.sh

BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Trigger RDB snapshot
redis-cli BGSAVE
sleep 5

# Copy RDB file
cp /var/lib/redis/dump.rdb "${BACKUP_DIR}/dump_${DATE}.rdb"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/dump_${DATE}.rdb" \
  "s3://yseeku-backups/redis/dump_${DATE}.rdb"
```

## Disaster Recovery Procedures

### Scenario 1: Database Corruption

**Symptoms:**
- Application errors with database read/write failures
- Inconsistent data reported by users
- MongoDB logs showing corruption errors

**Recovery Steps:**

1. **Assess Damage**
   ```bash
   # Check MongoDB logs
   kubectl logs -l app=mongodb --tail=1000 | grep -i error

   # Validate database integrity
   mongosh --eval "db.runCommand({dbStats: 1})"
   ```

2. **Isolate Affected Service**
   ```bash
   # Scale down application to prevent further writes
   kubectl scale deployment yseeku-backend --replicas=0
   ```

3. **Restore from Backup**
   ```bash
   # List available backups
   aws s3 ls s3://yseeku-backups/mongodb/ --recursive | tail -20

   # Download latest backup
   aws s3 sync s3://yseeku-backups/mongodb/<backup-name>/ /tmp/restore/

   # Restore
   mongorestore \
     --uri="${MONGODB_URI}" \
     --gzip \
     --drop \
     /tmp/restore/
   ```

4. **Validate Restoration**
   ```bash
   # Check collection counts
   mongosh --eval "
     db.getCollectionNames().forEach(c => {
       print(c + ': ' + db[c].countDocuments({}));
     });
   "
   ```

5. **Resume Service**
   ```bash
   kubectl scale deployment yseeku-backend --replicas=3
   ```

### Scenario 2: Complete Cluster Loss

**Symptoms:**
- All pods in CrashLoopBackOff
- Infrastructure provider outage
- Data center unavailability

**Recovery Steps:**

1. **Activate DR Cluster**
   ```bash
   # Switch DNS to DR region
   aws route53 change-resource-record-sets \
     --hosted-zone-id <zone-id> \
     --change-batch '{
       "Changes": [{
         "Action": "UPSERT",
         "ResourceRecordSet": {
           "Name": "api.yseeku.com",
           "Type": "A",
           "AliasTarget": {
             "HostedZoneId": "<dr-lb-zone>",
             "DNSName": "<dr-load-balancer>",
             "EvaluateTargetHealth": true
           }
         }
       }]
     }'
   ```

2. **Restore Data to DR Cluster**
   ```bash
   # Restore latest backup to DR MongoDB
   mongorestore \
     --uri="${DR_MONGODB_URI}" \
     --gzip \
     s3://yseeku-backups/mongodb/<latest-backup>/
   ```

3. **Verify DR Service**
   ```bash
   # Health check
   curl -f https://api-dr.yseeku.com/healthz

   # Functional test
   curl https://api-dr.yseeku.com/api/dashboard/kpis \
     -H "Authorization: Bearer <test-token>"
   ```

4. **Notify Stakeholders**
   ```bash
   # Send status update
   ./scripts/notify-stakeholders.sh \
     --incident="cluster_failover" \
     --status="dr_active"
   ```

### Scenario 3: Ransomware/Security Breach

**Immediate Actions:**

1. **Isolate Affected Systems**
   ```bash
   # Revoke all network access
   kubectl apply -f k8s/emergency/network-isolation.yaml

   # Disable external access
   kubectl patch ingress yseeku-ingress -p '{"spec":{"rules":[]}}'
   ```

2. **Preserve Evidence**
   ```bash
   # Snapshot current state before cleanup
   kubectl get all -A -o yaml > incident-state-$(date +%s).yaml

   # Export logs
   kubectl logs -l app=yseeku-backend --all-containers > incident-logs.txt
   ```

3. **Clean Restore**
   - Use backup from BEFORE compromise (verify backup integrity)
   - Rotate ALL secrets and credentials (see key-rotation.md)
   - Deploy fresh infrastructure

4. **Post-Incident**
   - Conduct forensic analysis
   - Update security controls
   - File incident report

## Point-in-Time Recovery (PITR)

For MongoDB with oplog:

```bash
# Restore to specific timestamp
mongorestore \
  --uri="${MONGODB_URI}" \
  --oplogReplay \
  --oplogLimit="<timestamp>" \
  /path/to/backup/

# Example: Restore to 10 minutes ago
TIMESTAMP=$(date -d '10 minutes ago' +%s)
mongorestore \
  --uri="${MONGODB_URI}" \
  --oplogReplay \
  --oplogLimit="${TIMESTAMP}:1" \
  /backups/latest/
```

## Backup Verification

### Weekly Restore Test

```bash
#!/bin/bash
# /opt/scripts/backup-verification.sh

# Create isolated test database
TEST_DB_URI="mongodb://localhost:27018/yseeku_restore_test"

# Download and restore latest backup
aws s3 sync s3://yseeku-backups/mongodb/$(aws s3 ls s3://yseeku-backups/mongodb/ | tail -1 | awk '{print $2}') /tmp/verify/

mongorestore \
  --uri="${TEST_DB_URI}" \
  --gzip \
  --drop \
  /tmp/verify/

# Run verification queries
RESULT=$(mongosh "${TEST_DB_URI}" --quiet --eval "
  const checks = {
    tenants: db.tenants.countDocuments({}),
    agents: db.agents.countDocuments({}),
    receipts: db.trustreceipts.countDocuments({}),
    alerts: db.alerts.countDocuments({})
  };
  printjson(checks);
")

echo "Backup verification completed: ${RESULT}"

# Cleanup
mongosh "${TEST_DB_URI}" --eval "db.dropDatabase()"

# Alert if verification failed
if echo "${RESULT}" | grep -q '"tenants": 0'; then
  ./scripts/alert-ops.sh "Backup verification failed - no tenants found"
fi
```

### Verification Checklist

- [ ] Backup files exist in remote storage
- [ ] Checksums match
- [ ] Restore completes without errors
- [ ] Key collections have expected record counts
- [ ] Application can connect and serve requests
- [ ] Trust receipts are verifiable

## Monitoring and Alerting

### Prometheus Alerts

```yaml
groups:
  - name: backup-alerts
    rules:
      - alert: BackupFailed
        expr: backup_last_success_timestamp < (time() - 7200)
        for: 15m
        labels:
          severity: critical
        annotations:
          summary: "Database backup has not succeeded in 2 hours"

      - alert: BackupSizeAnomaly
        expr: |
          abs(backup_size_bytes - backup_size_bytes offset 1d) / backup_size_bytes offset 1d > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Backup size changed by more than 50%"

      - alert: NoRecentBackups
        expr: absent(backup_last_success_timestamp)
        for: 1h
        labels:
          severity: critical
        annotations:
          summary: "No backup metrics available"
```

### Backup Metrics

```typescript
// apps/backend/src/observability/backup-metrics.ts
import { Gauge, Counter } from 'prom-client';

export const backupLastSuccess = new Gauge({
  name: 'backup_last_success_timestamp',
  help: 'Unix timestamp of last successful backup',
  labelNames: ['type']
});

export const backupSizeBytes = new Gauge({
  name: 'backup_size_bytes',
  help: 'Size of last backup in bytes',
  labelNames: ['type']
});

export const backupDurationSeconds = new Gauge({
  name: 'backup_duration_seconds',
  help: 'Duration of last backup in seconds',
  labelNames: ['type']
});

export const restoreTestsTotal = new Counter({
  name: 'backup_restore_tests_total',
  help: 'Total number of restore tests performed',
  labelNames: ['result']
});
```

## DR Contacts

| Role | Contact | Escalation |
|------|---------|------------|
| On-Call SRE | PagerDuty rotation | Immediate |
| Platform Lead | @platform-lead | 15 min |
| Security Lead | @security-lead | For breaches |
| VP Engineering | @vp-eng | 1 hour |

## Appendix: Recovery Runbooks

### A. MongoDB Replica Set Recovery

```bash
# If primary fails, force reconfiguration
mongosh --eval "
  rs.reconfig({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'mongo-0:27017', priority: 2 },
      { _id: 1, host: 'mongo-1:27017', priority: 1 },
      { _id: 2, host: 'mongo-2:27017', priority: 1, arbiterOnly: true }
    ]
  }, { force: true })
"
```

### B. Application Recovery Checklist

1. [ ] Database connectivity verified
2. [ ] Redis/cache connectivity verified
3. [ ] Environment variables loaded
4. [ ] Health endpoint responding
5. [ ] Authentication working
6. [ ] Trust receipt signing working
7. [ ] Alerts service operational
8. [ ] System Brain cycle executing

### C. Communication Templates

**Internal Status Update:**
```
INCIDENT: [Brief description]
STATUS: [Investigating/Identified/Monitoring/Resolved]
IMPACT: [Affected services/users]
NEXT UPDATE: [Time]
ACTIONS: [Current actions being taken]
```

**External Customer Notice:**
```
We are currently experiencing [brief description].
Impact: [What customers may notice]
We are actively working to resolve this and will provide updates.
For urgent matters, contact support@yseeku.com.
```
