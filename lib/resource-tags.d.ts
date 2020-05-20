import { Tag } from '@aws-cdk/core';
/**
 * Takes properties defined the resource and create MRA resource tags
 */
export declare class ResourceTags {
    private properties;
    private tags;
    /**
     * Creates a new Resource of type Tags
     * @param properties Resource to be tagged properties
     */
    constructor(properties: ResourceTagsProps);
    private buildTags;
    /**
     * Takes the list of resource tags previously created and returns them as
     * a Map being both Key and Value of type String
     * @returns Map with tags in the form of key-value of type String
     */
    getTagsAsMap(): {
        [key: string]: string;
    };
    /**
     * Takes the list of resource tags previously created and returns them as
     * an array of type CDK Tag
     * @returns array of CDK Tag
     */
    getTagsAsCdkTags(): Tag[];
}
export interface ResourceTagsProps {
    /**
     * Name of the resource being tagged
     */
    readonly name: string;
    /**
     * Short description of the resource being tagged
     */
    readonly description: string;
    /**
     * Which AWS technology it is (i.e. SNS, Lambda, DynamoDB)
     */
    readonly technology: string;
}
