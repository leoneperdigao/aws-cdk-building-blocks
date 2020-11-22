import { Tag } from '@aws-cdk/core';
import { ResourceTagProps } from './types/resource-tag-types';
/**
 * Takes properties defined the resource and create resource tags
 */
export declare class ResourceTags {
    private readonly properties;
    private tags;
    /**
     * Creates a new Resource of type Tags
     * @param {ResourceTagProps=} properties Resource to be tagged properties
     */
    constructor(properties: ResourceTagProps);
    /**
     * @summary Builds default tags
     */
    private buildTags;
    /**
     * Takes the list of resource tags previously created and returns them as
     * a Map being both Key and Value of type String
     * @return Map with tags in the form of key-value of type String
     */
    getTagsAsMap(): {
        [key: string]: string;
    };
    /**
     * Takes the list of resource tags previously created and returns them as
     * an array of type CDK Tag
     * @return {Tag[]} array of CDK Tag
     */
    getTagsAsCdkTags(): Tag[];
}
