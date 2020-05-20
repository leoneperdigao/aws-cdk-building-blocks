import { Construct, CfnRefElement } from '@aws-cdk/core';
import { CfnTopic, CfnTopicProps, CfnSubscription } from '@aws-cdk/aws-sns';

/**
 * Generates a new SNS Topic
 */
export class ResourceTopic {
  /**
   * Sns Topic generated
   */
  private topic: CfnTopic;

  /**
   * Creates a new SNS topic with the given properties
   * @param scope The parent construct
   * @param properties Topic properties
   */
  constructor(private scope: Construct, private properties: ResourceTopicProperties) {
    this.createTopic();
  }

  /**
   * Creates the new SNS Topic
   */
  private createTopic(): void {
    let topicProps: CfnTopicProps = {
      topicName: this.properties.topicName,
      displayName: this.properties.displayName || undefined,
      kmsMasterKeyId: (this.properties.kmsKey ? this.properties.kmsKey.ref : undefined),
    };

    if (this.properties.subscription) {
      topicProps = {
        ...topicProps,
        subscription:  [{
          protocol: this.properties.subscription.protocol,
          endpoint: this.properties.subscription.resourceArn,
        }]
      };
    }
    this.topic = new CfnTopic(this.scope, this.properties.resourceName, topicProps);
  }

  /**
   * Allows to generate a subscription from a resource to this topic
   * @param props Properties required for generating the subscription
   */
  public createTopicSubscription(props: ResourceTopicSubscriptionProperties): void {
    new CfnSubscription(this.scope, props.resourceName, {
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
  public getTopicResource(): CfnTopic {
    return this.topic;
  }

}

export interface ResourceTopicProperties {
  /**
   * Name in the template for this resource
   */
  resourceName: string,
  /**
   * Name for the topic
   */
  topicName: string,
  /**
   * Optional property for setting display name
   */
  displayName?: string,
  /**
   * Element reference with the KMS key
   */
  kmsKey?: CfnRefElement
  /**
   * Optional: Create subscription for topic
   */
  subscription?: ResourceTopicSubscriptionProperties
}

export interface ResourceTopicSubscriptionProperties {
  /**
   * Name in the template for this resource
   */
  resourceName: string,
  /**
   * Topic subscription protocol
   */
  protocol: string,
  /**
   * ARN for the resource being subscribed
   */
  resourceArn: string,
  /**
   * Optional property for setting raw message delivery
   */
  rawMessageDelivery?: boolean,
  /**
   * Optional property for setting filter policy
   */
  filterPolicy?: any
}
