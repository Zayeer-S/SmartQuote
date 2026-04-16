import * as cdk from 'aws-cdk-lib/core';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { infraConfig } from './config';

export class CertificateStack extends cdk.Stack {
  /** CloudFront cert - must be in us-east-1, covers the main domain */
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // CloudFront requires its cert in us-east-1.
    // The WS ALB cert lives in AppStack (eu-west-2) since ALBs require a
    // regional cert and it has no dependency on this stack.
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: infraConfig.domain.hostname,
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
