"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_kms_1 = require("@aws-cdk/aws-kms");
const resource_tags_1 = require("./resource-tags");
/**
 * Creates a new KMS key and its alias
*/
class ResourceKmsKey {
    /**
     * Generates a new key and alias
     * @param scope The parent construct
     * @param properties Key properties
     */
    constructor(scope, properties) {
        this.scope = scope;
        this.properties = properties;
        /**
         * Name for the key alias
         */
        this.KMS_KEY_ALIAS = 'alias/key-#NAME#-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}';
        /**
         * Policiy required for the key
         */
        this.KMS_KEY_POLICY = {
            Statement: [
                {
                    Sid: 'Enable IAM User Permissions',
                    Effect: 'Allow',
                    Principal: {
                        AWS: core_1.Fn.sub('arn:aws:iam::${AWS::AccountId}:root')
                    },
                    Action: 'kms:*',
                    Resource: '*'
                },
                {
                    Sid: 'Allow Amazon SNS to use this key',
                    Action: [
                        'kms:Decrypt',
                        'kms:GenerateDataKey*'
                    ],
                    Effect: 'Allow',
                    Principal: {
                        Service: 'sns.amazonaws.com'
                    },
                    Resource: '*'
                }
            ],
            Version: '2012-10-17',
        };
        this.aliasName = this.properties.alias
            ? this.KMS_KEY_ALIAS.replace('#NAME#', `${this.properties.alias}`)
            : this.KMS_KEY_ALIAS.replace('#NAME#-', '');
        this.createKmsKey();
        this.createKmsAlias();
    }
    /**
     * Creates a new key with given properties
     */
    createKmsKey() {
        this.kmsKey = new aws_kms_1.CfnKey(this.scope, this.properties.resouceName, {
            description: this.properties.description,
            keyPolicy: this.KMS_KEY_POLICY,
            tags: this.createTags(),
        });
    }
    /**
     * Generates an alias for the created key
     */
    createKmsAlias() {
        new aws_kms_1.CfnAlias(this.scope, `${this.properties.resouceName}Alias`, {
            aliasName: core_1.Fn.sub(this.aliasName),
            targetKeyId: this.kmsKey.ref,
        });
    }
    createTags() {
        const resourceTags = new resource_tags_1.ResourceTags({
            name: core_1.Fn.sub(this.aliasName),
            description: this.properties.description,
            technology: 'kms',
        });
        return resourceTags.getTagsAsCdkTags();
    }
    /**
     * Generated KMS key
     * @returns KMS key
     */
    getKey() {
        return this.kmsKey;
    }
}
exports.ResourceKmsKey = ResourceKmsKey;
