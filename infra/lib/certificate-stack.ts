import * as cdk from 'aws-cdk-lib/core';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { infraConfig } from './config';

export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CloudFront requires ACM cert to be in us-east-1 regardless of where the rest of the infra is.
    // The ws subdomain is added as a SAN so the same cert covers both the CDN and the WS ALB.
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: infraConfig.domain.hostname,
      subjectAlternativeNames: [infraConfig.domain.wsHostname],
      // AWS will issue a CNAME per domain to add in Cloudflare for DNS validation
      validation: acm.CertificateValidation.fromDns(),
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
      exportName: 'AcmCertificateArn',
    });

    Object.entries(infraConfig.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
