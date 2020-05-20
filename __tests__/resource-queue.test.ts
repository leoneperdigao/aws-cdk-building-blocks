import {
  expect as awsExpect,
  haveResource,
  matchTemplate,
  MatchStyle
} from '@aws-cdk/assert';
import { CfnTopic } from '@aws-cdk/aws-sns';
import { Stack } from '@aws-cdk/core';

import {
  ResourceKmsKey,
} from '../cdk-resources/resource-kmskey';
import {
  ResourceQueue,
  ResourceQueueProperties,
  ResourceQueuePolicyProperties
} from '../cdk-resources/resource-queue';

describe('Resource Queue', () => {

  test('should properly create a standard minimal fields queue', () => {
    const stack = new Stack();
    const policy: ResourceQueuePolicyProperties = {
      service: 'sns.amazonaws.com',
      resourceRef: new CfnTopic(stack, 'TestTopic', {})
    }
    const props: ResourceQueueProperties = {
      resourceName: 'QueueResource',
      queueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test',
      description: 'some description',
      policy,
    }

    new ResourceQueue(stack, props);

    awsExpect(stack).to(haveResource('AWS::SQS::Queue', {
      QueueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test',
      MessageRetentionPeriod: 43200,
      VisibilityTimeout: 300,
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
        Value: 'some description'
      }, {
        Key: 'Name',
        Value: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test'
      }]
    }));
    awsExpect(stack).to(haveResource('AWS::SQS::QueuePolicy', {
      Queues: [{
        'Ref': 'QueueResource'
      }],
      PolicyDocument: {
        Statement: [{
          Action: 'sqs:SendMessage',
          Condition: {
            ArnEquals: {
              'aws:SourceArn': { 'Ref': 'TestTopic' }
            }
          },
          Effect: 'Allow',
          Principal: { Service: 'sns.amazonaws.com' },
          Resource: { 'Fn::GetAtt': ['QueueResource', 'Arn'] }
        }],
        Version: '2012-10-17'
      }
    }));
  });

  test('should properly create queue with custom fields', () => {
    const stack = new Stack();
    const policy: ResourceQueuePolicyProperties = {
      service: 'sns.amazonaws.com',
      resourceRef: new CfnTopic(stack, 'TestTopic', {})
    }
    const props: ResourceQueueProperties = {
      resourceName: 'QueueResource',
      queueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test',
      description: 'some description',
      policy,
      messageRetentionPeriod: 86400,
      visibilityTimeout: 600,
      kmsKey: getKmsKey(stack)
    }

    new ResourceQueue(stack, props);

    awsExpect(stack).to(haveResource('AWS::SQS::Queue', {
      QueueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test',
      MessageRetentionPeriod: 86400,
      VisibilityTimeout: 600,
      KmsMasterKeyId: { 'Ref': 'TestKmsKey' }
    }));
    awsExpect(stack).to(haveResource('AWS::SQS::QueuePolicy', {
      Queues: [{
        'Ref': 'QueueResource'
      }]
    }));
  });

  test('should properly create a queue of type fifo', () => {
    const stack = new Stack();
    const topic = new CfnTopic(stack, 'TestTopic', {});
    const policy: ResourceQueuePolicyProperties = {
      service: 'sns.amazonaws.com',
      resourceRef: topic
    }
    const props: ResourceQueueProperties = {
      resourceName: 'QueueResource',
      queueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test',
      description: 'some description',
      isFifo: true,
      policy,
    }

    new ResourceQueue(stack, props);

    awsExpect(stack).to(haveResource('AWS::SQS::Queue', {
      FifoQueue: true,
      QueueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test.fifo'
    }));
    awsExpect(stack).to(haveResource('AWS::SQS::QueuePolicy', {
      Queues: [{
        'Ref': 'QueueResource'
      }]
    }));
  });

  test('should properly create a fifo queue with an output', () => {
    const stack = new Stack();
    const topic = new CfnTopic(stack, 'TestTopic', {});
    const policy: ResourceQueuePolicyProperties = {
      service: 'sns.amazonaws.com',
      resourceRef: topic
    }
    const props: ResourceQueueProperties = {
      resourceName: 'QueueResource',
      queueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test',
      description: 'some description',
      isFifo: true,
      policy,
      withOutput: true,
    }

    new ResourceQueue(stack, props);

    awsExpect(stack).to(matchTemplate({
      Resources: {
        TestTopic: {
          Type: 'AWS::SNS::Topic'
        },
        QueueResource: {
          Type: 'AWS::SQS::Queue',
          Properties: {
            FifoQueue: true,
            MessageRetentionPeriod: 43200,
            QueueName: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test.fifo',
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
              Value: 'some description'
            }, {
              Key: 'Name',
              Value: 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test.fifo'
            }],
            VisibilityTimeout: 300
          }
        },
        QueueResourceSendPolicy: {
          Type: 'AWS::SQS::QueuePolicy',
          Properties: {
            Queues: [{
              'Ref': 'QueueResource'
            }],
            PolicyDocument: {
              Statement: [{
                Action: 'sqs:SendMessage',
                Condition: {
                  ArnEquals: {
                    'aws:SourceArn': { 'Ref': 'TestTopic' }
                  }
                },
                Effect: 'Allow',
                Principal: { Service: 'sns.amazonaws.com' },
                Resource: { 'Fn::GetAtt': ['QueueResource', 'Arn'] }
              }],
              Version: '2012-10-17'
            }
          }
        }
      },
      Outputs: {
        QueueResourceOutput: {
          Description: 'some description',
          Value: { 'Fn::GetAtt': ['QueueResource', 'Arn'] },
          Export: {
            'Name': 'sqs-${C}-${A}-${App}-${P}-${B}-${E}-test.fifo'
          }
        }
      }
    }, MatchStyle.EXACT));
  });

});

function getKmsKey(stack: Stack) {
  const kmsResource = new ResourceKmsKey(stack, {
    resouceName: 'TestKmsKey',
    alias: 'test',
    description: 'This is a test key'
  });

  return kmsResource.getKey();
}
