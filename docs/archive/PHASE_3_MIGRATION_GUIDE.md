# Phase 3: Database Migration Guide

## Overview

Phase 3 introduces MongoDB schema enhancements to support SYMBI principle scores and weight metadata in trust receipts. This migration:

- ✅ Is **idempotent** (safe to run multiple times)
- ✅ Is **backward compatible** (existing receipts unaffected)
- ✅ Creates efficient **database indexes**
- ✅ Includes **verification** and **rollback** procedures

## What Gets Changed

### New Receipt Fields

The following fields are added to the `telemetry` object in all future trust receipts:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `sonate_principles` | Object | 6 SONATE principle scores (0-10 each) | `{CONSENT: 9, INSPECTION: 8, ...}` |
| `overall_trust_score` | Number | Weighted trust result (0-100) | `85` |
| `trust_status` | String | Constitutional compliance status | `"PASS"` \| `"PARTIAL"` \| `"FAIL"` |
| `principle_weights` | Object | Weight distribution applied | `{CONSENT: 0.25, ...}` |
| `weight_source` | String | Policy identifier (indexed) | `"standard"` \| `"healthcare"` \| `"finance"` |
| `weight_policy_id` | String | Policy reference ID (indexed) | `"base-standard"` \| `"policy-healthcare"` |

### New Indexes

```javascript
// Single-field indexes (for filtering by policy)
db.trust_receipts.createIndex({ "telemetry.weight_source": 1 })
db.trust_receipts.createIndex({ "telemetry.weight_policy_id": 1 })

// Compound index (for queries combining weight source and status)
db.trust_receipts.createIndex({
  "telemetry.weight_source": 1,
  "telemetry.trust_status": 1
})
```

### Collection Metadata

Migration metadata is stored in a new `collection_metadata` collection:

```javascript
{
  collection: "trust_receipts",
  version: "2.2",
  lastMigration: "phase-3",
  timestamp: ISODate("2026-02-22T..."),
  fields: {
    "telemetry.sonate_principles": { ... },
    "telemetry.overall_trust_score": { ... },
    // ... etc
  }
}
```

## Pre-Migration Checklist

Before running the migration:

- [ ] **Backup MongoDB**: `mongodump --uri "mongodb://..." --out backup/`
- [ ] **Stop all services**: Ensure no active connections to the database
- [ ] **Review current data**: Check what receipts already exist
- [ ] **Test in staging**: Run migration on staging first
- [ ] **Communicate**: Notify team of maintenance window (if needed)

```bash
# Backup MongoDB (example)
mongodump --uri "mongodb://user:pass@host:27017/yseeku-platform" \
  --out ./backup/phase-3-$(date +%Y%m%d)

# List backups
ls -la ./backup/
```

## Running the Migration

### Option 1: Development Environment (Default)

```bash
npm run migrate:phase-3
```

### Option 2: Production Environment (Requires Confirmation)

```bash
NODE_ENV=production npm run migrate:phase-3 -- --force
```

### Option 3: Dry Run (No Changes)

Preview what would be migrated without making changes:

```bash
npm run migrate:phase-3 -- --noop
```

### Option 4: Verification Only

Check if migration has already been applied:

```bash
npm run migrate:phase-3 -- --verify
```

## Understanding the Output

The migration produces detailed logs:

```
═══════════════════════════════════════════════════════════
  PHASE 3: SYMBI Scoring Database Migration
═══════════════════════════════════════════════════════════

[PHASE 3] Starting database migration...
[PHASE 3] Creating indexes for weight_source and weight_policy_id
[PHASE 3] Created index on telemetry.weight_source
[PHASE 3] Created index on telemetry.weight_policy_id
[PHASE 3] Created compound index on weight_source + trust_status

[PHASE 3] Current state of receipts collection
  total: 1,234
  withPrinciples: 456
  withWeightSource: 456
  readyForPhase3: 778

[PHASE 3] Updated collection metadata...
[PHASE 3] New schema fields ready...

═══════════════════════════════════════════════════════════
Migration Statistics:
  Receipts processed: 1,234
  Indexes created: 3
  Duration: 245ms

✓ Phase 3 Migration SUCCESSFUL
═══════════════════════════════════════════════════════════
```

## Backward Compatibility

### Existing Receipts

- ✅ Existing receipts are **NOT modified**
- ✅ Old receipt format continues to work
- ✅ New fields are **optional** in legacy receipts
- ✅ Queries can filter by presence of new fields

### Queries

**Find receipts with new principle scores:**
```javascript
db.trust_receipts.find({ "telemetry.sonate_principles": { $exists: true } })
```

**Find receipts with specific weight policy:**
```javascript
db.trust_receipts.find({ "telemetry.weight_source": "healthcare" })
```

**Find low-trust receipts with weight metadata:**
```javascript
db.trust_receipts.find({
  "telemetry.weight_source": { $exists: true },
  "telemetry.overall_trust_score": { $lt: 50 }
})
```

## Verification

After running the migration, verify it succeeded:

```bash
# Automatic verification (built into migration)
npm run migrate:phase-3 -- --verify

# Manual verification
mongo
> use yseeku-platform
> db.trust_receipts.getIndexes()
> db.collection_metadata.findOne({ collection: "trust_receipts" })
```

### What Gets Verified

✅ Indexes exist and are functional  
✅ Collection metadata is recorded  
✅ New schema fields are documented  
✅ No data corruption detected  

## Troubleshooting

### "Connection refused" Error

```bash
# Check MongoDB is running
mongo --version

# Check MongoDB is listening
netstat -an | grep 27017

# Start MongoDB
mongod --dbpath /data/db
```

### "Index already exists" Warning

This is **normal** and not an error — it means the migration has already been partially applied. The migration is idempotent and safe to re-run.

### Migration Fails Verification

If verification fails:

1. Check the logs for specific errors
2. Manually verify database state:
   ```bash
   mongo
   > use yseeku-platform
   > db.trust_receipts.getIndexes()
   > db.collection_metadata.find()
   ```
3. If corrupt: Restore from backup and retry

## Rollback (If Needed)

To rollback the migration:

```bash
# Restore from backup
mongorestore --uri "mongodb://..." --dir ./backup/phase-3-20260222

# Or manually drop indexes
mongo
> use yseeku-platform
> db.trust_receipts.dropIndex("telemetry.weight_source_1")
> db.trust_receipts.dropIndex("telemetry.weight_policy_id_1")
> db.collection_metadata.deleteOne({ collection: "trust_receipts" })
```

## Performance Impact

### Index Creation Time

- Typical: **< 1 second** for small collections (< 100k documents)
- Large: **5-30 seconds** for large collections (> 1M documents)
- No downtime required

### Query Performance

**Before Phase 3:**
```javascript
// Slow: Full collection scan
db.trust_receipts.find({ "telemetry.weight_source": "healthcare" }).explain("executionStats")
// executionStages.stage: "COLLSCAN"
```

**After Phase 3:**
```javascript
// Fast: Index scan
db.trust_receipts.find({ "telemetry.weight_source": "healthcare" }).explain("executionStats")
// executionStages.stage: "IXSCAN"
```

## Next Steps

After Phase 3 migration completes:

1. **Phase 4**: Deploy frontend display updates to show principle scores
2. **Phase 5**: Update documentation with new receipt format
3. **Phase 6**: Run full test suite with new fields
4. **Phase 7**: Deploy to production

## Questions?

Refer to:
- [SYMBI_SCORING_REMEDIATION_PLAN_COMPLETE.md](../../SYMBI_SCORING_REMEDIATION_PLAN_COMPLETE.md)
- [Full technical spec](../../SONATE_SPECIFICATION_v2.2.md)
- [Troubleshooting guide](./MIGRATION_TROUBLESHOOTING.md)

---

**Migration Created**: February 22, 2026  
**Schema Version**: 2.2.0  
**Status**: Ready for Phase 3 deployment
