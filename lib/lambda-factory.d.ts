import { Construct } from '@aws-cdk/core';
import { Function, CfnAlias, Tracing, Runtime } from '@aws-cdk/aws-lambda';
import { LambdaFactoryProps, LambdaDefinition } from './types/lambda-factory.types';
/**
 * @summary Generate resources Lambda related
 */
export declare class LambdaFactory {
    private readonly scope;
    /**
     * Default runtime for the lambda function
     * @default 'nodejs12.x'
     */
    static readonly RUNTIME: Runtime;
    /**
     * Standard alias name
     */
    static readonly PUBLISH_ALIAS = "vLatest";
    /**
     * Default memory value to use for the lambda function if none is given
     * @default 512
     */
    static readonly MEMORY = 512;
    /**
     * Default timeout for the function if none is given in minutes
     * @default 15
     */
    static readonly TIMEOUT = 15;
    /**
     * Default tracing value for the function
     * @default 'Active'
     */
    static readonly TRACING = Tracing.ACTIVE;
    /**
     * Cache for Function role
     */
    private readonly functionRolesCache;
    /**
     * The generic properties applicable to all lambdas
     */
    private genericLambdaProperties;
    /**
     * List with function definitions before creation of resources
     */
    private lambdaPropertiesList;
    /**
     * List of all CfnFunction resources generated
     */
    private generatedFunctionList;
    /**
     * Flag used to avoid re-creation of function resources
     */
    private areResourcesCreated;
    /**
     * Generates construct for the Lambda function.
     * @param {Construct=} scope The parent construct
     * @param {LambdaFactoryProps=} genericLambdaProperties lambda properties
     */
    constructor(scope: Construct, genericLambdaProperties: LambdaFactoryProps);
    /**
     * Adds a new function definition to the queue before resource creation
     * @param {LambdaDefinition=} lambda Properties of the lambda to be created
     */
    addFunctionResource(lambda: LambdaDefinition): void;
    /**
     * After function definitions were added to the queue. This function serves
     * as entry point to create all resources for each of the given definitions
     */
    createFunctionResources(): void;
    /**
     * Creates the resource of type CfnFunction
     * @param {LambdaDefinition=} props with the definition of the function to be created
     * @return {{lambdaFunction: Function, lambdaAlias: CfnAlias }} the created function of type CfnFunction
     */
    private createFunctionResource;
    /**
     * Each Lambda function contains a set of configurable attributes
     * @param {LambdaDefinition} props: Lambda function definition with configuration for the function
     * @return {CfnFunctionProps} the interface of type CfnFunctionProps required for CfnFunction
     */
    private getFunctionProperties;
    /**
     * The layers are an optional attribute for a function.
     * Both types are optional and this function aggregates them as a single list
     * @param {LambdaDefinition=} props with the definition of the function to be created
     * @return {LayerVersion[]} an array with the list of layers to be added to the function
     */
    private getFunctionLayers;
    /**
     * @summary retrieve VPC based on generic properties, lambda definiton or CBSB Defaults
     * @param {LambdaDefinition=} props
     */
    private getFunctionVpc;
    /**
     * @summary retrieve Subnets based on generic properties, lambda definition
     * @param {LambdaDefinition=} props
     */
    private getFunctionVpcSubnets;
    /**
     * @summary retrieve Security Group based on generic properties, lambda definition
     * @param {LambdaDefinition=} props
     */
    private getFunctionVpcSecurityGroup;
    /**
     * @summary creates IAM role for this stack
     */
    private getFunctionRole;
    /**
     * @summary creates invoke permission
     * @param {string=} resourceName
     * @param {string=} functionArn
     * @param {InvokePermissionProperties=} invokePermission
     */
    private createInvokePermission;
    /**
     * Returns the tags for each function
     * @param {LambdaDefinition=} props with the definition of the function to be created
     * @return a key/value object with the generated tags
     */
    private getFunctionTags;
    /**
     * For each lambda function, a Log Group resource is also generated
     * @param {string=} resourceName with the definition of the function to be created
     * @param {CfnFunction=} lambda resource
     * @return {CfnLogGroup} created log group
     */
    private createLogGroupResource;
    /**
     * @summary Creates an output for all functions that requires one
     * @param {string=} resourceName
     * @param {LambdaDefinition=} props
     */
    private createOutputResource;
    /**
     * @summary creates a subscription filter for Kibana
     * @param {LambdaDefinition=} props
     * @param {string=} resourceName
     * @param {CfnLogGroup=} logGroup
     */
    private createKibanaSubscription;
    /**
     *
     * @param {LambdaDefinition=} props
     * @return {string} lambda alias
     */
    private getLambdaAlias;
    /**
     * Returns the CfnFunction resource with the given resource name
     * @param {string} resourceName Template resource name to find
     * @return {CfnFunction} CfnFunction when found or exception when not
     */
    getFunctionByName(resourceName: string): Function;
    /**
     * Returns the CfnAlias resource with the given function resource name
     * @param {string=} resourceName Template resource name to find
     * @return {CfnAlias} CfnAlias when found or exception when not
     */
    getAliasByFunctionName(resourceName: string): CfnAlias;
}
