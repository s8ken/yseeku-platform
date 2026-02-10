# SONATE CLI Tools

Command-line utilities for verifying and exporting SONATE Trust Receipts. These tools allow auditors and compliance officers to inspect receipts offline without backend access.

## Installation

The CLI is installed as part of the `@sonate/cli` workspace package.

```bash
npm install --workspace=@sonate/cli
npm run build --workspace=@sonate/cli
```

## Commands

### `sonate-verify <receipt.json>`

Verify the signature and cryptographic chain integrity of a receipt.

#### Usage

```bash
sonate-verify receipt.json
sonate-verify receipt.json --detailed
sonate-verify receipt.json --public-key key.pub
```

#### Options

- `--public-key <key>`: Public key (base64) for verifying the Ed25519 signature
- `--previous-hash <hash>`: Expected previous chain hash for continuity verification
- `--detailed`: Display detailed receipt information after verification

#### Output

Displays a verification report showing:

- Overall validity status (✓ VALID or ✗ INVALID)
- Individual checks:
  - Schema validation (JSON Schema compliance)
  - Receipt ID verification (SHA-256 hash match)
  - Signature verification (Ed25519 cryptographic proof)
  - Chain hash verification (immutability proof)
- Detailed errors if any checks fail

#### Example

```bash
$ sonate-verify receipt.json

═══ SONATE Receipt Verification ═══

✓ RECEIPT VALID

Verification Checks:
────────────────────
✓ Schema Valid
✓ Receipt Id Valid
✓ Signature Valid
✓ Chain Valid
✓ Chain Hash Valid

═══════════════════════════════════
```

### `sonate-export <receipts.json>`

Export receipts to various SIEM (Security Information and Event Management) formats for integration with existing monitoring systems.

#### Usage

```bash
# Export to JSON
sonate-export receipts.json --format json

# Export to Splunk
sonate-export receipts.json --format splunk

# Export to Datadog
sonate-export receipts.json --format datadog --output receipts.log

# Export to Elastic/Kibana
sonate-export receipts.json --format elastic

# Export to CSV for spreadsheets
sonate-export receipts.json --format csv

# Export to JSONL (line-delimited)
sonate-export receipts.json --format jsonl

# Export with filtering
sonate-export receipts.json --format splunk --filter "minResonanceScore:0.8,sessionId:abc"
```

#### Options

- `--format <format>`: Output format (default: `json`)
  - `json`: Standard JSON with metadata
  - `jsonl`: Line-delimited JSON (streaming)
  - `csv`: Comma-separated values for spreadsheets
  - `splunk`: Key=value pairs (Splunk HEC format)
  - `datadog`: JSON with Datadog tags
  - `elastic`: NDJSON for Elasticsearch bulk ingest
- `--output <file>`: Write to file instead of stdout
- `--filter <filter>`: Filter receipts (comma-separated key:value pairs)

#### Filters

Supported filter keys:

- `minResonanceScore`: Minimum resonance score (0-1)
- `maxTruthDebt`: Maximum truth debt threshold
- `sessionId`: Specific session ID
- `agentDid`: Specific agent DID
- `tag`: Specific policy tag
- `minTimestamp`: Earliest timestamp (ISO 8601)
- `maxTimestamp`: Latest timestamp (ISO 8601)

#### Example: Splunk Export

```bash
$ sonate-export receipts.json --format splunk

timestamp=2026-02-09T19:40:00Z session_id=session_001 agent_did=did:sonate:...
  resonance_score=0.85 truth_debt=0.08 mode=constitutional
timestamp=2026-02-09T19:41:00Z session_id=session_001 agent_did=did:sonate:...
  resonance_score=0.79 truth_debt=0.12 mode=constitutional
```

#### Example: CSV Export

```bash
$ sonate-export receipts.json --format csv

Receipt ID,Timestamp,Session,Agent,Mode,Model,Resonance Score,Truth Debt
abcdef...,2026-02-09T19:40:00Z,session_001,did:sonate:...,constitutional,claude-3,0.85,0.08
fedcba...,2026-02-09T19:41:00Z,session_001,did:sonate:...,constitutional,claude-3,0.79,0.12
```

## Receipt File Format

Receipts can be provided as:

1. **Single JSON object** - Single receipt
2. **JSON array** - Multiple receipts `[{ ... }, { ... }]`
3. **JSONL** - Line-delimited JSON `{ ... }\n{ ... }`

## Use Cases

### Audit Trail Verification

Verify that all receipts in a session have valid signatures and form an unbroken chain:

```bash
sonate-verify session_receipts.json --detailed
```

### Compliance Export for Splunk

Export receipts to your organization's Splunk instance:

```bash
sonate-export compliant_receipts.json --format splunk --output /tmp/compliant.log
# Then ingest to Splunk via HTTP Event Collector or forwarder
```

### Data Analysis in CSV

Export to CSV for analysis in Excel or data tools:

```bash
sonate-export receipts.json --format csv --output receipts.csv
```

### SIEM Integration

Export to Elastic for visualization in Kibana:

```bash
sonate-export receipts.json --format elastic --output receipts.ndjson
# Then ingest via:
# curl -X POST "localhost:9200/_bulk" --data-binary @receipts.ndjson
```

### Filtered Export

Export only high-confidence interactions:

```bash
sonate-export receipts.json --format json \
  --filter "minResonanceScore:0.85,maxTruthDebt:0.1" \
  --output high_confidence.json
```

## Architecture

### Verification Process

The `sonate-verify` command performs these checks in order:

1. **Schema Validation** - Ensures the receipt conforms to the SONATE Receipt JSON Schema (Draft-07)
2. **Receipt ID Verification** - Verifies the receipt ID matches the SHA-256 hash of the canonical content
3. **Signature Verification** - Uses the Ed25519 algorithm to verify cryptographic authenticity
4. **Chain Verification** - Confirms the chain_hash is correctly formed from the receipt content and previous hash

All four checks must pass for the receipt to be marked as VALID.

### Export Format Support

- **JSON/JSONL**: Direct serialization for processing
- **CSV**: Flattened key-value pairs for spreadsheet tools
- **Splunk**: Key=value format compatible with HTTP Event Collector
- **Datadog**: JSON with `dd_tags` for Datadog ingestion
- **Elastic**: NDJSON format for Elasticsearch bulk API

## Error Handling

If verification fails, the CLI provides detailed error messages:

```
✗ RECEIPT INVALID

Errors:
────────
  • Schema validation failed
  • root: must match pattern "^[a-z0-9]{64}$"

Warnings:
──────────
  • No metadata present (optional)
```

## Performance

- **Verification**: ~1-5ms per receipt (in-memory operations only)
- **Export**: ~10-50ms per receipt (depending on format)
- Suitable for batch processing thousands of receipts

## Security Considerations

- All verification is **offline** - no network calls
- Keys and signatures **never leave the receipt** - not stored separately
- Suitable for processing sensitive audit logs in restricted environments
- Can be run in air-gapped networks

## Future Enhancements

- Batch verification with progress reporting
- Integration with external key management systems
- Support for additional SIEM formats (Sumo Logic, Datadog, etc.)
- Key rotation verification
- Chain continuity validation across multiple files
