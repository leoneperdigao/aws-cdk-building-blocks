import { expect, haveResource } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { CfnQueue } from '@aws-cdk/aws-sqs';
import { CfnFunction } from '@aws-cdk/aws-sam';

import { ResourceTags, ResourceTagsProps } from '../cdk-resources/resource-tags';

describe('Resource Tags', () => {

  test('should be able to generate tags in the form of Tag[]', () => {
    const stack = new Stack();
    const props: ResourceTagsProps = {
      name: 'resource name',
      description: 'resource description',
      technology: 'sqs',
    };
    new CfnQueue(stack, 'dummyQueue', {
      tags: new ResourceTags(props).getTagsAsCdkTags()
    });
    expect(stack).to(haveResource('AWS::SQS::Queue', {
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
        Value: 'sqs'
      }, {
        Key: 'Application',
        Value: { 'Fn::Sub': '${Application}' }
      }, {
        Key: 'Ec2ctl',
        Value: 'n/a'
      }, {
        Key: 'Description',
        Value: 'resource description'
      }, {
        Key: 'Name',
        Value: 'resource name'
      }]
    }));
  });

  test('should be able to generate tags in the form of { [key: string]: string }', () => {
    const stack = new Stack();
    const props: ResourceTagsProps = {
      name: 'resource name',
      description: 'resource description',
      technology: 'sqs',
    };
    new CfnFunction(stack, 'dummyFunction', {
      codeUri: 'src/index.js',
      handler: 'index.handler',
      runtime: 'nodejs',
      tags: new ResourceTags(props).getTagsAsMap()
    });
    expect(stack).to(haveResource('AWS::Serverless::Function', {
      Tags: {
        OpCo: 'df',
        Owner: 'df-operations@company.com',
        Dtap: {
          'Fn::Sub': '${Account}'
        },
        Creator: 'df-operations@company.com',
        Technology: 'sqs',
        Application: {
          'Fn::Sub': '${Application}'
        },
        Ec2ctl: 'n/a',
        Description: 'resource description',
        Name: 'resource name'
      }
    }));
  });
});
