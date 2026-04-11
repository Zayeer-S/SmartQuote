# First Deployment Guide

This guide covers a complete fresh deployment of SmartQuote to AWS from scratch.
For subsequent deploys, use `npm run infra:setup && npm run infra:deploy-all`.

**All commands run from the repo root unless stated otherwise.**

> Note: deployment only works on Linux. On Windows, use WSL2:
> https://learn.microsoft.com/en-us/windows/wsl/install

---

## Prerequisites

- AWS CLI installed and configured with credentials for the target AWS account
- Node.js 22
- Docker (for building the ML container image)
- Access to the DNS provider managing the target domain

---

## Step 1 -- Update infra config

Before running any CDK commands, update `infra/lib/config.ts` with the target
account and domain:

```typescript
export const infraConfig = {
  account: '<AWS_ACCOUNT_ID>',   // 12-digit AWS account ID
  region: 'eu-west-2',

  domain: {
    hostname: '<your.domain.com>',
  },

  cors: {
    origin: 'https://<your.domain.com>',
  },
  // ...
}
```

All other config values (Lambda memory, timeouts, DB settings) are already set to
sensible production defaults and do not need to change for a standard deployment.

---

## Step 2 -- Bootstrap CDK (one-time per AWS account)
cd infra && npx cdk bootstrap aws://<AWS_ACCOUNT_ID>/eu-west-2
npx cdk bootstrap aws://<AWS_ACCOUNT_ID>/us-east-1
cd ..
```

Both regions must be bootstrapped. The certificate stack deploys to `us-east-1`
(CloudFront requirement); everything else deploys to `eu-west-2`.

---

## Step 3 -- Deploy the Certificate Stack

```bash
cd infra && npx cdk deploy SmartQuoteCertificateStack && cd ..
```

After this completes, AWS will output a CNAME record for DNS validation.
**The deploy will hang on the next step until this is done.**

Add the CNAME to Cloudflare:
1. Open the AWS Console -> Certificate Manager -> find the pending cert
2. Copy the CNAME name and value from the "Domains" panel
3. In Cloudflare DNS, add a CNAME record with those values, set to "DNS only" (grey cloud -- not proxied)
4. Wait for the cert status to change to "Issued" (usually 1-5 minutes)

---

## Step 4 -- Deploy the Database Stack

```bash
cd infra && npx cdk deploy SmartQuoteDatabaseStack && cd ..
```

This creates the VPC, RDS instance, security groups, and all VPC endpoints.
RDS runs in `PRIVATE_ISOLATED` subnets with no public access.

---

## Step 5 -- Create manual AWS resources

These three resources are not managed by CDK and must exist before the App Stack deploys.

### 5a -- Attachments S3 bucket

```bash
aws s3api create-bucket \
  --bucket smartquote-attachments \
  --region eu-west-2 \
  --create-bucket-configuration LocationConstraint=eu-west-2

aws s3api put-public-access-block \
  --bucket smartquote-attachments \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 5b -- App Secrets Manager secret

The API Lambda fetches this secret at cold start. It must exist with exactly these keys
before the App Stack deploys:

```bash
aws secretsmanager create-secret \
  --name smartquote/app-secrets \
  --region eu-west-2 \
  --secret-string '{
    "SESSION_SECRET": "<min 32 character random string>",
    "JWT_SECRET": "<min 32 character random string>",
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "465",
    "SMTP_SECURE": "true",
    "SMTP_USER": "<smtp email address>",
    "SMTP_PASSWORD": "<smtp password or app password>"
  }'
```

> For Gmail, use an App Password rather than your account password:
> https://support.google.com/accounts/answer/185833

### 5c -- ECR repository + initial ML image

The App Stack references the ECR repo by name and will fail if the repository is
empty or does not exist.

Create the repository:

```bash
aws ecr create-repository \
  --repository-name smartquote-ml-quote \
  --region eu-west-2
```

Build and push the initial image:

```bash
aws ecr get-login-password --region eu-west-2 | \
  docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com

docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --output type=docker \
  -t smartquote-ml-quote \
  ./models/handler/

docker tag smartquote-ml-quote:latest \
  <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com/smartquote-ml-quote:latest

docker push \
  <AWS_ACCOUNT_ID>.dkr.ecr.eu-west-2.amazonaws.com/smartquote-ml-quote:latest
```

> **Important:** Always build with `--platform linux/amd64 --provenance=false
> --output type=docker`. Omitting these flags on Windows/WSL2 produces an OCI
> manifest that Lambda rejects.

Refer to [ML.md](docs/guides/ML.md) for details on retraining and updating the model.

---

## Step 6 -- Build and deploy the App Stack

```bash
npm run infra:setup && npm run infra:deploy-all
```

`infra:setup` pulls latest, installs dependencies, and builds all targets (server,
client, and DB migrations).

`infra:deploy-all` deploys `SmartQuoteAppStack` and then immediately invokes the
migrate Lambda to run all pending migrations, returning `migrate.json`.

After this completes, note two outputs from the CDK deploy:

- `CloudFrontDomain` -- the `*.cloudfront.net` domain (e.g. `d1abc123.cloudfront.net`)
- `CloudFrontUrl` -- the configured hostname (e.g. `https://smartquote.yourdomain.com`)

---

## Step 7 -- Point the domain at CloudFront

In your DNS provider, add a CNAME record pointing your configured hostname at the
CloudFront distribution. For example, if using Cloudflare:

| Type | Name | Target | Proxy status |
|---|---|---|---|
| CNAME | `smartquote` | `<CloudFrontDomain output>` | Proxied (orange cloud) |

---

## Step 8 -- Seed the database

```bash
npm run infra:seed-reset
```

> **Warning:** This truncates all tables. Only run on a fresh deployment.

This seeds default users, organisations, lookup data, and sample tickets.
Refer to [DB.md](docs/guides/DB.md) for default login credentials.

---

## Step 9 -- Verify

1. Open the `CloudFrontUrl` from the deploy output -- the login page should load
2. Log in as `admin@smartquote.dev` / `password`
3. Submit a test ticket and confirm quote generation works end-to-end
4. If anything is failing, tail the API Lambda logs:

```bash
aws logs tail /aws/lambda/smartquote-api --region eu-west-2 --follow
```

---

## Stack dependency order

```
SmartQuoteCertificateStack (us-east-1) -->|
                                          |--> SmartQuoteAppStack (eu-west-2)
SmartQuoteDatabaseStack    (eu-west-2) -->|
```

`AppStack` has explicit `addDependency` calls on both stacks and will not deploy
until both are complete.

---

## Troubleshooting

**ACM cert stuck in "Pending validation"**
The DNS validation CNAME was not added to Cloudflare, or it was added as proxied.
Validation CNAMEs must be "DNS only" (grey cloud).

**App Stack deploy fails with "ImageNotFoundException"**
The ECR repository is empty. Complete step 5c before retrying.

**App Stack deploy fails with "ResourceNotFoundException"**
The `smartquote/app-secrets` secret does not exist. Complete step 5b before retrying.

**Lambda invocations hang then timeout**
A VPC endpoint is missing. The Lambda runs in `PRIVATE_ISOLATED` subnets with no
NAT gateway -- all AWS SDK calls (Secrets Manager, S3, Bedrock, Lambda) must route
through VPC endpoints. Verify `SmartQuoteDatabaseStack` deployed cleanly and all
four endpoints are present in the VPC.

**Source fix not reflected after redeploy**
The esbuild bundle cache may be stale. See the Gotchas section in [INFRA.md](docs/guides/INFRA.md).