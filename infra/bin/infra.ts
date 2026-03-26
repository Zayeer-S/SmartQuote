#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CertificateStack } from '../lib/certificate-stack';
import { DatabaseStack } from '../lib/database-stack';
import { AppStack } from '../lib/app-stack';
import { infraConfig } from '../lib/config';

const app = new cdk.App();

const euWest2 = {
  account: infraConfig.account,
  region: infraConfig.region,
};

// Must be in us-east-1 — CloudFront only accepts certs from this region
const certificateStack = new CertificateStack(app, 'SmartQuoteCertificateStack', {
  env: { account: infraConfig.account, region: 'us-east-1' },
  crossRegionReferences: true,
});

const databaseStack = new DatabaseStack(app, 'SmartQuoteDatabaseStack', {
  env: euWest2,
});

const appStack = new AppStack(app, 'SmartQuoteAppStack', {
  env: euWest2,
  crossRegionReferences: true,
  databaseStack,
  certificateStack,
});

appStack.addDependency(databaseStack);
appStack.addDependency(certificateStack);
