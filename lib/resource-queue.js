"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_sqs_1 = require("@aws-cdk/aws-sqs");
const resource_tags_1 = require("./resource-tags");
/**
 * Takes properties and creates a new Queue (Standard or FIFO) with MRA characteristics
*/
class ResourceQueue {
    /**
     * Generates construct for the queue.
     * @param scope The parent construct
     * @param properties Queue properties
     */
    constructor(scope, properties) {
        this.scope = scope;
        this.properties = properties;
        /**
         * Default queue visibility timeout
         */
        this.VISIBILITY_TIMEOUT = 300;
        /**
         * Default queue retention period
         */
        this.RETENTION = 43200;
        this.createQueue();
        this.createSendMessagePolicy();
        if (this.properties.withOutput === true) {
            this.createQueueOutput();
        }
    }
    /**
     * Creates queue construct with the resource tags
     */
    createQueue() {
        const queueName = (this.properties.isFifo === true)
            ? `${this.properties.queueName}.fifo`
            : this.properties.queueName;
        this.queue = new aws_sqs_1.CfnQueue(this.scope, this.properties.resourceName, {
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
    createQueueTags(queueName) {
        const resourceTags = new resource_tags_1.ResourceTags({
            name: queueName,
            description: this.properties.description,
            technology: 'sqs',
        });
        return resourceTags.getTagsAsCdkTags();
    }
    /**
     * Generates a Queue policy for this queue
     */
    createSendMessagePolicy() {
        new aws_sqs_1.CfnQueuePolicy(this.scope, `${this.properties.resourceName}SendPolicy`, {
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
    createQueueOutput() {
        let exportName = (this.properties.isFifo === true)
            ? `${this.properties.queueName}.fifo`
            : `${this.properties.queueName}`;
        if (this.properties.outputName) {
            exportName = this.properties.outputName;
        }
        new core_1.CfnOutput(this.scope, this.properties.outputResourceName || `${this.properties.resourceName}Output`, {
            exportName: exportName,
            value: this.queue.getAtt('Arn').toString(),
            description: this.properties.description,
        });
    }
    /**
     * Returns the Cfn queue for this resource
     * @returns curent Cfn queue
     */
    getQueueResource() {
        return this.queue;
    }
}
exports.ResourceQueue = ResourceQueue;
