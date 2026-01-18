## Response Time Guarantees

| Issue Type | MTTD | MTTR | Definition |
| ----------- | ------ | ------ | ----------- |
| Security | 1h | 4h | Auth/crypto bugs |
| Production | 4h | 24h | API down/data loss |
| High | 8h | 48h | Major features broken |
| Medium | 24h | 72h | Feature degradation |
| Low | 48h | 1wk | Non-critical bugs |

Current baseline (Q4 2025):
- Security: 0.5h MTTD, 2h MTTR ✅
- Production: 2h MTTD, 8h MTTR ✅
- High: 4h MTTD, 12h MTTR ✅

Investor impact: "We commit to <4h incident response" = enterprise credibility.
