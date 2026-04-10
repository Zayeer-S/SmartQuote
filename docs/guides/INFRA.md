Production runs on AWS in `eu-west-2`. Deployment is managed by AWS CDK.

Note: due to Windows pathing issues, deployment only works on Linux. Please either use a Linux machine or setup WSL2 on your Windows machine: https://learn.microsoft.com/en-us/windows/wsl/install

# First-time setup

```bash
# Run all commands from project root

# Bootstrap CDK in your AWS account (one-time)
cd infra && npx cdk bootstrap && cd ..

# Build and deploy all stacks
npm run infra:setup && npm run infra:deploy-all

# Seed production database (TRUNCATES ALL TABLES - Only use for first time setup)
npm run infra:seed-reset
```

`infra:setup` runs git pull, installs dependencies, and builds server + client
`infra:deploy-all` deploys the CDK stacks, then immediately invokes the migrate Lambda to run any pending migrations returning migrate.json
`infra:seed-reset` truncates all tables and seeds database with seed data, returns seed.json
# Stacks

| Stack | Description |
|---|---|
| `SmartQuoteCertificateStack` | ACM certificate (must be in us-east-1 for CloudFront) |
| `SmartQuoteDatabaseStack` | VPC, RDS, security groups, VPC endpoints |
| `SmartQuoteAppStack` | Lambda, API Gateway, CloudFront, S3, ML Lambda |

# Manual operations

```bash
# Run migrations manually
aws lambda invoke --function-name smartquote-migrate --region eu-west-2 migrate.json

# Seed the database manually
aws lambda invoke --function-name smartquote-seed --region eu-west-2 seed.json

# Smoke test the ML Lambda directly
aws lambda invoke \
  --function-name smartquote-ml-quote \
  --region eu-west-2 \
  --payload '{"embedding":[...],"features":{"ticket_type_id":1,"ticket_severity_id":3,"business_impact_id":3,"users_impacted":50,"deadline_offset_days":2.5,"is_after_hours":0}}' \
  response.json
```

# Gotchas

**esbuild cache stale after source changes**

CDK uses esbuild to bundle the Lambda. esbuild caches aggressively -- if you fix a bug in server code and redeploy but the Lambda still exhibits the old behaviour, the cache may be serving a stale bundle.

Force a clean rebuild:
```bash
bashrm -rf ~/.cache/esbuild
touch src/server/bootstrap/lambda.handler.ts
npm run infra:deploy-all
```
`touch` updates the entry file's mtime, which is enough to invalidate the cache and force a fresh bundle.