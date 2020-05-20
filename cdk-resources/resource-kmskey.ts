import { Construct, Fn, Tag } from '@aws-cdk/core';
import { CfnKey, CfnAlias } from '@aws-cdk/aws-kms';

import { ResourceTags } from './resource-tags';

/**
 * Creates a new KMS key and its alias
*/
export class ResourceKmsKey {
  /**
   * Kms key generated
   */
  private kmsKey: CfnKey;
  /**
   * Name for the key alias
   */
  private readonly KMS_KEY_ALIAS: string = 'alias/key-#NAME#-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}';
  /**
   * Kms alias generated
   */
  private readonly aliasName: string;
  /**
   * Policiy required for the key
   */
  private readonly KMS_KEY_POLICY = {
    Statement: [
      {
        Sid: 'Enable IAM User Permissions',
        Effect: 'Allow',
        Principal: {
          AWS: Fn.sub('arn:aws:iam::${AWS::AccountId}:root')
        },
        Action: 'kms:*',
        Resource: '*'
      },
      {
        Sid: 'Allow Amazon SNS to use this key',
        Action: [
          'kms:Decrypt',
          'kms:GenerateDataKey*'
        ],
        Effect: 'Allow',
        Principal: {
          Service: 'sns.amazonaws.com'
        },
        Resource: '*'
      }
    ],
    Version: '2012-10-17',
  };

  /**
   * Generates a new key and alias
   * @param scope The parent construct
   * @param properties Key properties
   */
  constructor(private scope: Construct, private properties: ResourceKmsProperties) {
    this.aliasName = this.properties.alias
      ? this.KMS_KEY_ALIAS.replace('#NAME#', `${this.properties.alias}`)
      : this.KMS_KEY_ALIAS.replace('#NAME#-', '');
    this.createKmsKey();
    this.createKmsAlias();
  }

  /**
   * Creates a new key with given properties
   */
  private createKmsKey(): void {
    this.kmsKey = new CfnKey(this.scope, this.properties.resouceName, {
      description: this.properties.description,
      keyPolicy: this.KMS_KEY_POLICY,
      tags: this.createTags(),
    });
  }

  /**
   * Generates an alias for the created key
   */
  private createKmsAlias(): void {
    new CfnAlias(this.scope, `${this.properties.resouceName}Alias`, {
      aliasName: Fn.sub(this.aliasName),
      targetKeyId: this.kmsKey.ref,
    });
  }

  private createTags(): Tag[] {
    const resourceTags = new ResourceTags({
      name: Fn.sub(this.aliasName),
      description: this.properties.description,
      technology: 'kms',
    })

    return resourceTags.getTagsAsCdkTags();
  }

  /**
   * Generated KMS key
   * @returns KMS key
   */
  public getKey(): CfnKey {
    return this.kmsKey;
  }
}

export interface ResourceKmsProperties {
  /**
   * Name in the template for this resource
   */
  resouceName: string,
  /**
   * Given name for the key alias
   */
  alias?: string,
  /**
   * Alias description
   */
  description: string,
}
