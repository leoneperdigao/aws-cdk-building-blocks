import { Construct, Tag, CfnOutput, CfnRefElement } from '@aws-cdk/core';
import { CfnQueue, CfnQueuePolicy } from '@aws-cdk/aws-sqs';

import { ResourceTags } from './resource-tags';

/**
 * Takes properties and creates a new Queue (Standard or FIFO) with MRA characteristics
*/
export class ResourceQueue {
  /**
   * Queue resource being created
   */
  private queue: CfnQueue;
  /**
   * Default queue visibility timeout
   */
  private readonly VISIBILITY_TIMEOUT = 300;
  /**
   * Default queue retention period
   */
  private readonly RETENTION = 43200;

  /**
   * Generates construct for the queue.
   * @param scope The parent construct
   * @param properties Queue properties
   */
  constructor(private scope: Construct, private properties: ResourceQueueProperties) {
    this.createQueue();
    this.createSendMessagePolicy();
    if (this.properties.withOutput === true) {
      this.createQueueOutput();
    }
  }

  /**
   * Creates queue construct with the resource tags
   */
  private createQueue(): void {
    const queueName = (this.properties.isFifo === true)
      ? `${this.properties.queueName}.fifo`
      : this.properties.queueName;

    this.queue = new CfnQueue(this.scope, this.properties.resourceName, {
      queueName: queueName,
      fifoQueue: this.properties.isFifo,
      tags: this.createQueueTags(queueName),
      kmsMasterKeyId: (this.properties.kmsKey ? this.properties.kmsKey.ref : undefined),
      visibilityTimeout: this.properties.visibilityTimeout || this.VISIBILITY_TIMEOUT,
      messageRetentionPeriod: this.properties.messageRetentionPeriod || this.RETENTION,
    });
  }

  /**
   * Returns the Queue resource tags
   * @param queueName Given queue name
   * @returns array of CDK tags
   */
  private createQueueTags(queueName: string): Tag[] {
    const resourceTags = new ResourceTags({
      name: queueName,
      description: this.properties.description,
      technology: 'sqs',
    })

    return resourceTags.getTagsAsCdkTags();
  }

  /**
   * Generates a Queue policy for this queue
   */
  private createSendMessagePolicy() {
    new CfnQueuePolicy(this.scope, `${this.properties.resourceName}SendPolicy`, {
      policyDocument: {
        Statement: [{
          Action: 'sqs:SendMessage',
          Condition: {
            ArnEquals: {
              'aws:SourceArn': this.properties.policy.resourceRef.ref
            }
          },
          Effect: 'Allow',
          Principal: {
            Service: this.properties.policy.service
          },
          Resource: this.queue.getAtt('Arn')
        }],
        Version: '2012-10-17',
      },
      queues: [this.queue.ref],
    });
  }

  /**
   * Generates an Cfn Output for the current queue
   */
  private createQueueOutput(): void {
    let exportName = (this.properties.isFifo === true)
      ? `${this.properties.queueName}.fifo`
      : `${this.properties.queueName}`;

    if (this.properties.outputName) {
      exportName = this.properties.outputName;
    }

    new CfnOutput(this.scope, this.properties.outputResourceName || `${this.properties.resourceName}Output`, {
      exportName: exportName,
      value: this.queue.getAtt('Arn').toString(),
      description: this.properties.description,
    });
  }

  /**
   * Returns the Cfn queue for this resource
   * @returns curent Cfn queue
   */
  public getQueueResource(): CfnQueue {
    return this.queue;
  }

}

export interface ResourceQueueProperties {
  /**
   * Name in the template for this resource
   */
  resourceName: string,
  /**
   * Name given to the queue
   */
  queueName: string,
  /**
   * Description given to the queue
   */
  description: string,
  /**
   * Optional value for KMS key
   */
  kmsKey?: CfnRefElement,
  /**
   * Optional property to define a queue as FIFO. Defaults to false/standard
   */
  isFifo?: boolean,
  /**
   * Properties for the queue's policy
   */
  policy: ResourceQueuePolicyProperties,
  /**
   * Optional property to define if queue should have an output. Defaults to false
   */
  withOutput?: boolean,
  /**
   * Optional property to define output name for queue. Defaults to queue name
   */
  outputName?: string,
  /**
   * Optional property to define output resource name for queue. Defaults to queue name plus Output
   */
  outputResourceName?: string,
  /**
   * Optional value for queue message visibility timeout. Defaults to 300
   */
  visibilityTimeout?: number,
  /**
   * Optional message retention period. Defaults to 43200
   */
  messageRetentionPeriod?: number,
}

export interface ResourceQueuePolicyProperties {
  /**
   * Service that will be granted access (i.e. lambda.amazonaws.com)
   */
  service: string,
  /**
   * Resource Ref value that will have access to the Queue
   */
  resourceRef: CfnRefElement,
}
