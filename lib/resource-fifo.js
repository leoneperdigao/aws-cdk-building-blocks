"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_sqs_1 = require("@aws-cdk/aws-sqs");
const resource_tags_1 = require("./resource-tags");
/**
 * Takes properties and creates a new FIFO Queue with MRA characteristics
*/
class ResourceFifo {
    /**
     * Generates construct for the queue.
     * @param scope The parent construct
     * @param props Queue properties
     */
    constructor(scope, properties) {
        this.scope = scope;
        this.properties = properties;
    }
    /**
     * Creates queue construct with the resource tags
     */
    createFifoQueue() {
        const queueName = `${this.properties.queueName}.fifo`;
        const resourceTags = new resource_tags_1.ResourceTags({
            name: queueName,
            description: this.properties.description,
            technology: 'sqs',
        }).getTagsAsCdkTags();
        this.queue = new aws_sqs_1.CfnQueue(this.scope, this.properties.resourceName, {
            queueName: core_1.Fn.sub(queueName),
            fifoQueue: true,
            tags: resourceTags,
        });
        return this.queue;
    }
    /**
     * Generates a Queue policy for this queue
     */
    createFifoSendMessagePolicy() {
        new aws_sqs_1.CfnQueuePolicy(this.scope, `${this.properties.resourceName}SendPolicy`, {
            policyDocument: {
                Statement: [{
                        Action: 'sqs:SendMessage',
                        Condition: {
                            ArnEquals: {
                                'aws:SourceArn': this.properties.policy.resourceRef
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
}
exports.ResourceFifo = ResourceFifo;
