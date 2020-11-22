import { expect as awsExpect, haveResource } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { CfnQueue } from '@aws-cdk/aws-sqs';
import { CfnFunction } from '@aws-cdk/aws-sam';
import { ResourceTags } from '../src';
import { ResourceTagProps } from '../src/types';

describe('Resource Tags', () => {
  it('should be able to generate tags in the form of Tag[]', () => {
    const stack = new Stack();
    const props: ResourceTagProps = {
      name: 'resource name',
      description: 'resource description',
      technology: 'sqs',
    };
    new CfnQueue(stack, 'dummyQueue', {
      tags: new ResourceTags(props).getTagsAsCdkTags(),
    });
    awsExpect(stack).to(haveResource('AWS::SQS::Queue', {
      Tags: [
        {
          Key: 'Application',
          Value: {
            'Fn::Sub': '${Application}',
          },
        },
        {
          Key: 'Description',
          Value: 'resource description',
        },
        {
          Key: 'Environment',
          Value: {
            'Fn::Sub': '${Environment}',
          },
        },
        {
          Key: 'Name',
          Value: 'resource name',
        },
        {
          Key: 'Technology',
          Value: 'sqs',
        },
      ],
    }));
  });

  it('should be able to generate tags in the form of { [key: string]: string }', () => {
    const stack = new Stack();
    const props: ResourceTagProps = {
      name: 'resource name',
      description: 'resource description',
      technology: 'sqs',
    };
    new CfnFunction(stack, 'dummyFunction', {
      codeUri: 'src/index.js',
      handler: 'index.handler',
      runtime: 'nodejs',
      tags: new ResourceTags(props).getTagsAsMap(),
    });
    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      Tags: {
        Application: {
          'Fn::Sub': '${Application}',
        },
        Description: 'resource description',
        Environment: {
          'Fn::Sub': '${Environment}',
        },
        Name: 'resource name',
        Technology: 'sqs',
      },
    }));
  });
});
