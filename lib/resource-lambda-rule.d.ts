import { Construct } from '@aws-cdk/core';
export declare class ResourceLambdaRule {
    private scope;
    private properties;
    private rule;
    constructor(scope: Construct, properties: ResourceLambdaRuleProperties);
    private createRule;
    private createPermission;
}
export interface ResourceLambdaRuleProperties {
    resourceName: string;
    ruleName: string;
    description: string;
    schedule: string;
    targetArn: string;
}
