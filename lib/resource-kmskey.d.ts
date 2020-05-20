import { Construct } from '@aws-cdk/core';
import { CfnKey } from '@aws-cdk/aws-kms';
/**
 * Creates a new KMS key and its alias
*/
export declare class ResourceKmsKey {
    private scope;
    private properties;
    /**
     * Kms key generated
     */
    private kmsKey;
    /**
     * Name for the key alias
     */
    private readonly KMS_KEY_ALIAS;
    /**
     * Kms alias generated
     */
    private readonly aliasName;
    /**
     * Policiy required for the key
     */
    private readonly KMS_KEY_POLICY;
    /**
     * Generates a new key and alias
     * @param scope The parent construct
     * @param properties Key properties
     */
    constructor(scope: Construct, properties: ResourceKmsProperties);
    /**
     * Creates a new key with given properties
     */
    private createKmsKey;
    /**
     * Generates an alias for the created key
     */
    private createKmsAlias;
    private createTags;
    /**
     * Generated KMS key
     * @returns KMS key
     */
    getKey(): CfnKey;
}
export interface ResourceKmsProperties {
    /**
     * Name in the template for this resource
     */
    resouceName: string;
    /**
     * Given name for the key alias
     */
    alias?: string;
    /**
     * Alias description
     */
    description: string;
}
