# Disaster Recovery

- Backups: schedule Mongo dumps and store in object storage; verify restores monthly
- Restore: redeploy `mongo` and import latest dump; re-run backend migrations `npm run migrate`
- Configs: keep infra Terraform state and k8s manifests versioned; document endpoints
- Drill: run a quarterly DR drill with restore time objectives and checklist

