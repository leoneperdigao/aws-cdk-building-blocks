"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sns_1 = require("@aws-cdk/aws-sns");
/**
 * Generates a new SNS Topic
 */
class ResourceTopic {
    /**
     * Creates a new SNS topic with the given properties
     * @param scope The parent construct
     * @param properties Topic properties
     */
    constructor(scope, properties) {
        this.scope = scope;
        this.properties = properties;
        this.createTopic();
    }
    /**
     * Creates the new SNS Topic
     */
    createTopic() {
        let topicProps = {
            topicName: this.properties.topicName,
            displayName: this.properties.displayName || undefined,
            kmsMasterKeyId: (this.properties.kmsKey ? this.properties.kmsKey.ref : undefined),
        };
        if (this.properties.subscription) {
            topicProps = {
                ...topicProps,
                subscription: [{
                        protocol: this.properties.subscription.protocol,
                        endpoint: this.properties.subscription.resourceArn,
                    }]
            };
        }
        this.topic = new aws_sns_1.CfnTopic(this.scope, this.properties.resourceName, topicProps);
    }
    /**
     * Allows to generate a subscription from a resource to this topic
     * @param props Properties required for generating the subscription
     */
    createTopicSubscription(props) {
        new aws_sns_1.CfnSubscription(this.scope, props.resourceName, {
            protocol: props.protocol,
            topicArn: this.topic.ref,
            endpoint: props.resourceArn,
            rawMessageDelivery: props.rawMessageDelivery,
            filterPolicy: props.filterPolicy,
        });
    }
    /**
     * Expose the topic resource
     * @returns current topic Cfn resource
     */
    getTopicResource() {
        return this.topic;
    }
}
exports.ResourceTopic = ResourceTopic;
