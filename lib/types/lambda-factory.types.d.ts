import { PolicyStatement } from '@aws-cdk/aws-iam';
import { IVpc, SelectedSubnets, ISecurityGroup } from '@aws-cdk/aws-ec2';
import { IQueue } from '@aws-cdk/aws-sqs';
import { LayerVersion, Code } from '@aws-cdk/aws-lambda';
export interface InvokePermissionProperties {
    /**
     * `AWS::Lambda::Permission.Principal`
     */
    readonly principal: string;
    /**
     * `AWS::Lambda::Permission.SourceArn`
     */
    readonly sourceArn: string;
}
export declare enum DeadLetterQueueType {
    /**
     * Type SNS
     */
    SNS = "SNS",
    /**
     * Type SQS
     */
    SQS = "SQS"
}
export interface LambdaFactoryProps {
    /**
     * Optional value for the function alias, default will be used if none provided
     */
    alias?: string;
    /**
     * Optional list of custom layers to be used in the function
     */
    customLayers?: LayerVersion[];
    /**
     * Optional environment variables to the function
     */
    environmentVariables?: {
        [key: string]: (string);
    };
    /**
     * Role to be used to execute the function
     */
    roleName: string;
    /**
     * Optional value for the function timeout, default will be used if none provided
     */
    timeout?: number;
    /**
   * Optional VPC configuration
   */
    vpc?: IVpc;
    /**
     * Optional VPC subnets
     */
    vpcSubnets?: SelectedSubnets;
    /**
     * Optional Security Group
     */
    securityGroup?: ISecurityGroup;
}
export interface LambdaDefinition {
    /**
     * Template given name for the resource
     */
    resourceName: string;
    /**
     * Name of lambda function
     */
    functionName: string;
    /**
     * Optional value for the function alias, default will be used if none provided
     */
    alias?: string;
    /**
     * Description given to the lambda function
     */
    description: string;
    /**
     * Function handler
     */
    handler: string;
    /**
     * Lambda's code asset
     */
    codeAsset: Code;
    /**
     * Role to be used to execute the function
     */
    invokePermission?: InvokePermissionProperties;
    /**
     * Role to be used to execute the function
     */
    roleName?: string;
    /**
     * Optional environment variables to the function
     */
    environmentVariables?: {
        [key: string]: (string);
    };
    /**
     * Optional value for the function memory, default will be used if none provided
     */
    memory?: number;
    /**
     * Optional value for the function timeout, default will be used if none provided
     */
    timeout?: number;
    /**
     * Optional value for the function concurrent executions
     */
    reservedConcurrentExecutions?: number;
    /**
     * Optional list of custom layers to be used in the function
     */
    customLayers?: LayerVersion[];
    /**
     * Optional: set to 'true' when the function needs to be an output
     */
    withOutput?: boolean;
    /**
     * Optional: set to 'false' when the function shouldn't log to Kibana, default is true
     */
    withKibanaLogging?: boolean;
    /**
     * Optional value for the function alias, default will be used if none provided
     */
    outputName?: string;
    /**
     * Optional dead letter queue object
     */
    deadLetterQueue?: IQueue;
    /**
     * Optional VPC configuration
     */
    vpc?: IVpc;
    /**
     * Optional VPC subnets
     */
    vpcSubnets?: SelectedSubnets;
    /**
     * Optional Security Group
     */
    securityGroup?: ISecurityGroup;
    /**
     * Optional SSM path for Kinesis Role ARN if withKibanaLogging is used
     */
    kinesisRoleArnSsmPath?: string;
    /**
     * Retention period for CloudWatch log groups
     * @default 7
     */
    logGroupsRetentionInDays?: number;
    /**
     * Optional statements to the IAM role assumed by the instance
     */
    executionRolePolicyStatements?: PolicyStatement[];
}
