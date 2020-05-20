import { expect as awsExpect, haveResource } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';

import {
  ResourceKmsKey,
  ResourceKmsProperties
} from '../cdk-resources/resource-kmskey';

describe('KMS Key Resource', () => {
  test('should create a KMS key and its alias', () => {
    const stack = new Stack();
    const props: ResourceKmsProperties = {
      resouceName: 'TestKmsKey',
      alias: 'test',
      description: 'This is a test key'
    }
    new ResourceKmsKey(stack, props);

    awsExpect(stack).to(haveResource('AWS::KMS::Key', {
      Description: 'This is a test key',
      KeyPolicy: {
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root' }
            },
            Action: 'kms:*',
            Resource: '*'
          },
          {
            Sid: 'Allow Amazon SNS to use this key',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey*'],
            Effect: 'Allow',
            Principal: { Service: 'sns.amazonaws.com' },
            Resource: '*'
          }
        ],
        Version: '2012-10-17'
      },
      Tags: [{
        Key: 'OpCo',
        Value: 'df'
      }, {
        Key: 'Owner',
        Value: 'df-operations@company.com'
      }, {
        Key: 'Dtap',
        Value: { 'Fn::Sub': '${Account}' }
      }, {
        Key: 'Creator',
        Value: 'df-operations@company.com'
      }, {
        Key: 'Technology',
        Value: 'kms'
      }, {
        Key: 'Application',
        Value: { 'Fn::Sub': '${Application}' }
      }, {
        Key: 'Ec2ctl',
        Value: 'n/a'
      }, {
        Key: 'Description',
        Value: 'This is a test key'
      }, {
        Key: 'Name',
        Value: {
          'Fn::Sub': 'alias/key-test-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}'
        }
      }],
    }));
    awsExpect(stack).to(haveResource('AWS::KMS::Alias', {
      AliasName: { 'Fn::Sub': 'alias/key-test-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}' },
      TargetKeyId: { 'Ref': 'TestKmsKey' },
    }));
  });

});
