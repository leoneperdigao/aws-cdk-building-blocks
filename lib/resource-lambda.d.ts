import { Construct, CfnResource, ICfnConditionExpression } from '@aws-cdk/core';
import { CfnFunction } from '@aws-cdk/aws-sam';
import { CfnAlias } from '@aws-cdk/aws-lambda';
/**
 * Generate resources Lambda related
 */
export declare class ResourceLambda {
    private scope;
    /**
     * The generic properties appicable to all lambdas
     */
    private genericLambdaProperties;
    /**
     * List with function definitions before creation of resources
     */
    private lambdaPropertiesList;
    /**
     * List of functions that requires lambda warmer creations
     */
    private warmerList;
    /**
     * List of functions that requires an output to be created
     */
    private outputFunctionList;
    /**
     * List of all CfnFunction resources generated
     */
    private generatedFunctionList;
    /**
     * List of logGroups that should be pushed to splunk
     */
    private splunkLogGroupList;
    /**
     * MRA standarnd naming for the role
     */
    readonly FUNCTION_ROLE = "arn:aws:iam::${AWS::AccountId}:role/rol-bnd-df-${Environment}-go-";
    /**
     * Default runtime for the lambda function
     */
    readonly RUNTIME = "nodejs12.x";
    /**
     * MRA alias name
     */
    readonly PUBLISH_ALIAS = "v1";
    /**
     * Default memory value to use for the lambda function if none is given
     */
    readonly MEMORY = 512;
    /**
     * Default timeout for the function if none is given
     */
    readonly TIMEOUT = 15;
    /**
     * Default tracing value for the function
     */
    readonly TRACING = "Active";
    /**
     * MRA standard naming for rules
     */
    readonly RULE_NAME = "rule-${Country}-${Account}-${Application}-${Project}-lambda-warmer-${Branch}-${Environment}";
    /**
     * Flag used to avoid re-creation of function resources
     */
    private areResourcesCreated;
    /**
     * Generates construct for the Lambda function.
     * @param scope The parent construct
     */
    constructor(scope: Construct, genericLambdaProperties: GenericLambdaProperties);
    /**
     * Adds a new function definition to the queue before resource creation
     * @param lambda Properies of the lambda to be created
     */
    addFunctionResource(lambda: LambdaDefinition): void;
    /**
     * After function definitions were added to the queue. This function serves
     * as entry point to create all resources for each of the given definitions
     */
    createFunctionResources(): void;
    /**
     * Creates the resource of type CfnFunction
     * @param props with the definition of the function to be created
     * @returns the created function of type CfnFunction
     */
    private createFunctionResource;
    /**
     * Each Lambda function contains a set of configurable attributes, some are
     * predefined as MRA configuration, others are custome configurable
     * @param props: Lambda function definition with configuration for the function
     * @returns the interface of type CfnFunctionProps required for CfnFunction
     */
    private getFunctionProperties;
    /**
     * The layers are an optional attribute for a function. From MRA perspective,
     * there are two types of layers:
     *  1) Commons: available thru the layers RMA project
     *  2) Custom: generated as part ot the current template
     * Both types are optionan and this function aggregates them as a sinlge list
     * @param props with the definition of the function to be created
     * @returns an array with the list of layers to be added to the function
     */
    private getFunctionLayers;
    /**
     * Resolve vpc property type to cast as expected property type
     * @param props with the definition of the function to be created
     * @returns CfnFunction.VpcConfigProperty | ICfnConditionExpression | undefined
     */
    private getFunctionVpc;
    /**
     * Returns the RMA tags for each function
     * @param props with the definition of the function to be created
     * @returns a key/value object with the generated tags
     */
    private getFunctionTags;
    /**
     * For each lambda function, a Log Group resource is also generated
     * @param props with the definition of the function to be created
     */
    private createLogGroupResource;
    /**
     * Due to a constrain of target properties per rule, we have to group all
     * lambda functions on groups of maximum 5 lambdas per fule. This function
     * groups the lambdas before the rules creation
     */
    private prepareLambdaWarmers;
    /**
     * Receives the lambda ressource names grouped by the number of rules to be
     * created (i.e. if only two functions then we get one rule, but if we have 12
     * functions then we get 3 rules)
     * @param groupedWarmers Array containing array of lambda resource names
     */
    private createWarmerRules;
    /**
     * For each rule created, a new permission is required for this rule to be
     * able to invoke the given lambda function
     * @param resourceName resource name for the lambda
     * @param props Lambda function definition with configuration for the function
     * @param rule CfnRule resource to which is required the permission
     */
    private createLambdaPermission;
    /**
     * Creates an output for all functions that requires one
     */
    private createOutputResource;
    private createSplunkLoggerFunction;
    private createSplunkResources;
    private getLambdaAlias;
    /**
     * Returns the CfnFunction resource with the given resource name
     * @param resourceName Template resource name to find
     * @returns CfnFunction when found or exception when not
     */
    getFunctionByName(resourceName: string): CfnFunction;
    /**
     * Returns the CfnAlias resource with the given function resource name
     * @param resourceName Template resource name to find
     * @returns CfnAlias when found or exception when not
     */
    getAliasByFunctionName(resourceName: string): CfnAlias;
}
export interface GenericLambdaProperties {
    /**
     * Optional value for the function alias, default will be used if none provided
     */
    alias?: string;
    /**
     * Optional list of custom layers to be used in the function
     */
    customLayers?: CfnResource[];
    /**
     * Optional environment variables to the function
     */
    environmentVariables?: {
        [key: string]: (string);
    };
    /**
     * Role to be used to execute the function
     */
    role: string;
    /**
     * Optional value for the function timeout, default will be used if none provided
     */
    timeout?: number;
    /**
     * Optional: set to 'true' when a lambda warmed should be created for this function
     */
    withLambdaWarmer?: boolean;
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
     * Function URI to the code
     */
    code: string;
    /**
     * Role to be used to execute the function
     */
    role?: string;
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
    customLayers?: CfnResource[];
    /**
     * Optional: set to 'true' when a lambda warmed should be created for this function
     */
    withLambdaWarmer?: boolean;
    /**
     * Optional: set to 'true' when the function needs to be an output
     */
    withOutput?: boolean;
    /**
     * Optional: set to 'false' when the function shouldn't log to splunk, default is true
     */
    withSplunkLogging?: boolean;
    /**
     * Optional value for the function alias, default will be used if none provided
     */
    outputName?: string;
    /**
     * Optional dead letter queue object
     */
    deadLetterQueue?: DeadLetterQueue;
    /**
     * Optional configuration of VPC
     */
    vpcConfig?: VpcConfiguration | ICfnConditionExpression;
}
export interface DeadLetterQueue {
    /**
     * Type of dead letter queue
     */
    type: DeadLetterQueueType;
    /**
     * Target Arn of dead letter queue
     */
    targetArn: string;
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
export interface VpcConfiguration {
    /**
     * List of security groups
     */
    SecurityGroupIds: string[];
    /**
     * List of subnet ids
     */
    SubnetIds: string[];
}
