import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { infraConfig } from './config';

export class DatabaseStack extends cdk.Stack {
  /** Exported for AppStack to place Lambda in the same VPC */
  public readonly vpc: ec2.Vpc;
  /** Exported for AppStack to grant Lambda inbound access */
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  /** Exported for AppStack to pass DB_HOST to Lambda */
  public readonly dbEndpoint: string;
  /** Exported for AppStack to inject credentials into Lambda env */
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── VPC ────────────────────────────────────────────────────────────────
    // 2 AZs, public subnets for Lambda (no NAT Gateway cost), isolated
    // subnets for RDS (no internet access)
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // ── Security groups ────────────────────────────────────────────────────
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSg', {
      vpc: this.vpc,
      description: 'Attached to Lambda — allows outbound to RDS',
      allowAllOutbound: true,
    });

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: this.vpc,
      description: 'RDS Postgres — only accepts connections from Lambda',
      allowAllOutbound: false,
    });

    this.dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(infraConfig.db.port),
      'Allow Postgres from Lambda'
    );

    // Export Lambda SG so AppStack can attach it to the function
    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      exportName: 'LambdaSecurityGroupId',
    });

    // ── RDS credentials ────────────────────────────────────────────────────
    this.dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: infraConfig.db.secretName,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'smartquote_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        passwordLength: 32,
      },
    });

    // ── RDS instance ───────────────────────────────────────────────────────
    const dbInstance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(this.dbSecret),
      databaseName: infraConfig.db.databaseName,
      instanceIdentifier: infraConfig.db.instanceIdentifier,
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [this.dbSecurityGroup],
      allocatedStorage: infraConfig.db.allocatedStorageGb,
      backupRetention: cdk.Duration.days(infraConfig.db.backupRetentionDays),
      deletionProtection: infraConfig.db.deletionProtection,
      // Prevent accidental replacement on config changes
      applyImmediately: false,
      // Don't create a public endpoint — Lambda reaches it via VPC
      publiclyAccessible: false,
    });

    this.dbEndpoint = dbInstance.dbInstanceEndpointAddress;

    // ── Outputs ────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbEndpoint,
      exportName: 'DbEndpoint',
    });

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.dbSecret.secretArn,
      exportName: 'DbSecretArn',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: 'VpcId',
    });

    // ── Tags ───────────────────────────────────────────────────────────────
    Object.entries(infraConfig.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
