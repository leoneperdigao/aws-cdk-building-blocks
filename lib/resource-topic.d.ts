import { Construct, CfnRefElement } from '@aws-cdk/core';
import { CfnTopic } from '@aws-cdk/aws-sns';
/**
 * Generates a new SNS Topic
 */
export declare class ResourceTopic {
    private scope;
    private properties;
    /**
     * Sns Topic generated
     */
    private topic;
    /**
     * Creates a new SNS topic with the given properties
     * @param scope The parent construct
     * @param properties Topic properties
     */
    constructor(scope: Construct, properties: ResourceTopicProperties);
    /**
     * Creates the new SNS Topic
     */
    private createTopic;
    /**
     * Allows to generate a subscription from a resource to this topic
     * @param props Properties required for generating the subscription
     */
    createTopicSubscription(props: ResourceTopicSubscriptionProperties): void;
    /**
     * Expose the topic resource
     * @returns current topic Cfn resource
     */
    getTopicResource(): CfnTopic;
}
export interface ResourceTopicProperties {
    /**
     * Name in the template for this resource
     */
    resourceName: string;
    /**
     * Name for the topic
     */
    topicName: string;
    /**
     * Optional property for setting display name
     */
    displayName?: string;
    /**
     * Element reference with the KMS key
     */
    kmsKey?: CfnRefElement;
    /**
     * Optional: Create subscription for topic
     */
    subscription?: ResourceTopicSubscriptionProperties;
}
export interface ResourceTopicSubscriptionProperties {
    /**
     * Name in the template for this resource
     */
    resourceName: string;
    /**
     * Topic subscription protocol
     */
    protocol: string;
    /**
     * ARN for the resource being subscribed
     */
    resourceArn: string;
    /**
     * Optional property for setting raw message delivery
     */
    rawMessageDelivery?: boolean;
    /**
     * Optional property for setting filter policy
     */
    filterPolicy?: any;
}
