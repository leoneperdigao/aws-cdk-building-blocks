import { expect as awsExpect, haveResource } from '@aws-cdk/assert';
import { CfnQueue } from '@aws-cdk/aws-sqs';
import { Stack } from '@aws-cdk/core';

import {
  ResourceKmsKey,
} from '../cdk-resources/resource-kmskey';
import {
  ResourceTopic,
  ResourceTopicProperties,
  ResourceTopicSubscriptionProperties
} from '../cdk-resources/resource-topic';

describe('Resource Topic', () => {
  test('should be able to create a basic topic with minimal fields', () => {
    const stack = new Stack();
    const props: ResourceTopicProperties = {
      resourceName: 'TestTopic',
      topicName: 'sns-${C}-${A}-${App}-${P}-${B}-${E}-testing',
    }

    new ResourceTopic(stack, props);

    awsExpect(stack).to(haveResource('AWS::SNS::Topic', {
      TopicName: 'sns-${C}-${A}-${App}-${P}-${B}-${E}-testing'
    }));
  });

  test('should be able to create a topic with KMS ', () => {
    const stack = new Stack();
    const kmsKey = getKmsKey(stack);
    const props: ResourceTopicProperties = {
      resourceName: 'TestTopic',
      topicName: 'sns-${C}-${A}-${App}-${P}-${B}-${E}-testing',
      kmsKey: kmsKey
    }

    new ResourceTopic(stack, props);

    awsExpect(stack).to(haveResource('AWS::SNS::Topic', {
      KmsMasterKeyId: { 'Ref': 'TestKmsKey' },
      TopicName: 'sns-${C}-${A}-${App}-${P}-${B}-${E}-testing'
    }));
  });

  test('should be able to create a basic topic with embedded subscription', () => {
    const stack = new Stack();
    const queue = new CfnQueue(stack, 'TestQueue', {});
    const props: ResourceTopicProperties = {
      resourceName: 'TestTopic',
      topicName: 'sns-${C}-${A}-${App}-${P}-${B}-${E}-testing',
      subscription: {
        resourceName: '',
        protocol: 'sqs',
        resourceArn: queue.ref,
      }
    }

    new ResourceTopic(stack, props);

    awsExpect(stack).to(haveResource('AWS::SNS::Topic', {
      TopicName: 'sns-${C}-${A}-${App}-${P}-${B}-${E}-testing',
      Subscription: [{
        Protocol: 'sqs',
        Endpoint: { 'Ref': 'TestQueue' }
      }]
    }));
  });

  test('should be able to generate a topic subscription resource', () => {
    const stack = new Stack();
    const kmsKey = getKmsKey(stack);
    const queue = new CfnQueue(stack, 'TestQueue', {});
    const props: ResourceTopicProperties = {
      resourceName: 'TestTopic',
      topicName: 'sns-${C}-${A}-${App}-${P}-${B}-${E}-testing',
      kmsKey: kmsKey
    }
    const subscriptionProps: ResourceTopicSubscriptionProperties = {
      resourceName: 'TestTopicSubscription',
      protocol: 'sqs',
      resourceArn: queue.getAtt('Arn').toString(),
      rawMessageDelivery: true,
      filterPolicy: {
        someField: ['value1', 'value2'],
      }
    }
    const topicResource = new ResourceTopic(stack, props);

    topicResource.createTopicSubscription(subscriptionProps);

    awsExpect(stack).to(haveResource('AWS::SNS::Subscription', {
      Protocol: 'sqs',
      TopicArn: { 'Ref': 'TestTopic' },
      Endpoint: {
        'Fn::GetAtt': ['TestQueue', 'Arn']
      },
      RawMessageDelivery: true,
      FilterPolicy: {
        someField: [
          'value1',
          'value2',
        ],
      },
    }));
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
