# Trust Receipt Example

## cURL

```bash
curl -X POST http://localhost:3000/api/receipts \
  -H 'content-type: application/json' \
  -d '{
    "version": "1.0",
    "session_id": "example-session",
    "timestamp": 1734300000000,
    "mode": "constitutional",
    "ciq_metrics": { "clarity": 0.9, "integrity": 0.9, "quality": 0.9 },
    "previous_hash": null,
    "signature": ""
  }'
```

## Node Script

Run `node examples/trust-receipt/generate.js` after starting the web app.
