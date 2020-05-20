import { Construct, CfnRefElement } from '@aws-cdk/core';
import { CfnQueue } from '@aws-cdk/aws-sqs';
/**
 * Takes properties and creates a new Queue (Standard or FIFO) with MRA characteristics
*/
export declare class ResourceQueue {
    private scope;
    private properties;
    /**
     * Queue resource being created
     */
    private queue;
    /**
     * Default queue visibility timeout
     */
    private readonly VISIBILITY_TIMEOUT;
    /**
     * Default queue retention period
     */
    private readonly RETENTION;
    /**
     * Generates construct for the queue.
     * @param scope The parent construct
     * @param properties Queue properties
     */
    constructor(scope: Construct, properties: ResourceQueueProperties);
    /**
     * Creates queue construct with the resource tags
     */
    private createQueue;
    /**
     * Returns the Queue resource tags
     * @param queueName Given queue name
     * @returns array of CDK tags
     */
    private createQueueTags;
    /**
     * Generates a Queue policy for this queue
     */
    private createSendMessagePolicy;
    /**
     * Generates an Cfn Output for the current queue
     */
    private createQueueOutput;
    /**
     * Returns the Cfn queue for this resource
     * @returns curent Cfn queue
     */
    getQueueResource(): CfnQueue;
}
export interface ResourceQueueProperties {
    /**
     * Name in the template for this resource
     */
    resourceName: string;
    /**
     * Name given to the queue
     */
    queueName: string;
    /**
     * Description given to the queue
     */
    description: string;
    /**
     * Optional value for KMS key
     */
    kmsKey?: CfnRefElement;
    /**
     * Optional property to define a queue as FIFO. Defaults to false/standard
     */
    isFifo?: boolean;
    /**
     * Properties for the queue's policy
     */
    policy: ResourceQueuePolicyProperties;
    /**
     * Optional property to define if queue should have an output. Defaults to false
     */
    withOutput?: boolean;
    /**
     * Optional property to define output name for queue. Defaults to queue name
     */
    outputName?: string;
    /**
     * Optional property to define output resource name for queue. Defaults to queue name plus Output
     */
    outputResourceName?: string;
    /**
     * Optional value for queue message visibility timeout. Defaults to 300
     */
    visibilityTimeout?: number;
    /**
     * Optional message retention period. Defaults to 43200
     */
    messageRetentionPeriod?: number;
}
export interface ResourceQueuePolicyProperties {
    /**
     * Service that will be granted access (i.e. lambda.amazonaws.com)
     */
    service: string;
    /**
     * Resource Ref value that will have access to the Queue
     */
    resourceRef: CfnRefElement;
}
