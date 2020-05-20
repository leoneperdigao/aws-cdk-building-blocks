import { Construct } from '@aws-cdk/core';
import { CfnQueue } from '@aws-cdk/aws-sqs';
/**
 * Takes properties and creates a new FIFO Queue with MRA characteristics
*/
export declare class ResourceFifo {
    private scope;
    private properties;
    /**
     * Queue resource being created
     */
    private queue;
    /**
     * Generates construct for the queue.
     * @param scope The parent construct
     * @param props Queue properties
     */
    constructor(scope: Construct, properties: ResourceFifoProperties);
    /**
     * Creates queue construct with the resource tags
     */
    createFifoQueue(): CfnQueue;
    /**
     * Generates a Queue policy for this queue
     */
    createFifoSendMessagePolicy(): void;
}
export interface ResourceFifoProperties {
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
     * Properties for the queue's policy
     */
    policy: ResourceFifoPolicyProperties;
}
export interface ResourceFifoPolicyProperties {
    /**
     * Service that will be granted access (i.e. lambda.amazonaws.com)
     */
    service: string;
    /**
     * Resource Ref value that will have access to the Queue
     */
    resourceRef: string;
}
