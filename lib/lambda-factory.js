"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaFactory = void 0;
const core_1 = require("@aws-cdk/core");
const aws_iam_1 = require("@aws-cdk/aws-iam");
const aws_logs_1 = require("@aws-cdk/aws-logs");
const aws_ssm_1 = require("@aws-cdk/aws-ssm");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const resource_tags_1 = require("./resource-tags");
/**
 * @summary Generate resources Lambda related
 */
class LambdaFactory {
    /**
     * Generates construct for the Lambda function.
     * @param {Construct=} scope The parent construct
     * @param {LambdaFactoryProps=} genericLambdaProperties lambda properties
     */
    constructor(scope, genericLambdaProperties) {
        this.scope = scope;
        /**
         * Cache for Function role
         */
        this.functionRolesCache = new Map();
        this.genericLambdaProperties = genericLambdaProperties;
        this.areResourcesCreated = false;
        this.lambdaPropertiesList = [];
        this.generatedFunctionList = {};
    }
    /**
     * Adds a new function definition to the queue before resource creation
     * @param {LambdaDefinition=} lambda Properties of the lambda to be created
     */
    addFunctionResource(lambda) {
        this.lambdaPropertiesList.push(lambda);
    }
    /**
     * After function definitions were added to the queue. This function serves
     * as entry point to create all resources for each of the given definitions
     */
    createFunctionResources() {
        if (!this.lambdaPropertiesList.length) {
            throw new Error('No function definitions found for creation');
        }
        if (this.areResourcesCreated) {
            throw new Error('The resources were already created for this iteration');
        }
        for (const props of this.lambdaPropertiesList) {
            const { lambdaFunction, lambdaAlias } = this.createFunctionResource(props);
            const logGroup = this.createLogGroupResource(props.resourceName, lambdaFunction, props.logGroupsRetentionInDays);
            if (props.withOutput) {
                this.createOutputResource(props.resourceName, props);
            }
            if (props.withKibanaLogging) {
                this.createKibanaSubscription(props, props.resourceName, logGroup);
            }
            this.generatedFunctionList[props.resourceName] = { lambdaFunction, lambdaAlias };
        }
        this.areResourcesCreated = true;
    }
    /**
     * Creates the resource of type CfnFunction
     * @param {LambdaDefinition=} props with the definition of the function to be created
     * @return {{lambdaFunction: Function, lambdaAlias: CfnAlias }} the created function of type CfnFunction
     */
    createFunctionResource(props) {
        const lambdaFunction = new aws_lambda_1.Function(this.scope, props.resourceName, this.getFunctionProperties(props));
        if (props.executionRolePolicyStatements && props.executionRolePolicyStatements.length) {
            props.executionRolePolicyStatements.forEach((statement) => lambdaFunction.addToRolePolicy(statement));
        }
        const lambdaVersion = new aws_lambda_1.CfnVersion(this.scope, `${props.resourceName}Version${Date.now()}`, {
            functionName: lambdaFunction.functionName,
        });
        const lambdaAlias = new aws_lambda_1.CfnAlias(this.scope, `${props.resourceName}Alias${this.getLambdaAlias(props)}`, {
            functionName: lambdaFunction.functionName,
            name: this.getLambdaAlias(props),
            functionVersion: lambdaVersion.attrVersion,
        });
        if (props.invokePermission) {
            this.createInvokePermission(props.resourceName, lambdaFunction.functionArn, props.invokePermission);
        }
        this.getFunctionTags(props).forEach((tag) => core_1.Aspects.of(lambdaFunction).add(new core_1.Tag(tag.key, tag.value)));
        return { lambdaFunction, lambdaAlias };
    }
    /**
     * Each Lambda function contains a set of configurable attributes
     * @param {LambdaDefinition} props: Lambda function definition with configuration for the function
     * @return {CfnFunctionProps} the interface of type CfnFunctionProps required for CfnFunction
     */
    getFunctionProperties(props) {
        const functionLayers = this.getFunctionLayers(props);
        const functionProperties = {
            code: props.codeAsset,
            environment: (!props.environmentVariables && !this.genericLambdaProperties.environmentVariables) ? undefined : {
                ...this.genericLambdaProperties.environmentVariables,
                ...props.environmentVariables,
            },
            description: `${props.description} - genr. at ${new Date().toISOString()}`,
            vpc: this.getFunctionVpc(props),
            vpcSubnets: this.getFunctionVpcSubnets(props),
            securityGroup: this.getFunctionVpcSecurityGroup(props),
            role: this.getFunctionRole(props),
            functionName: core_1.Fn.sub(`\${Application}-\${Country}-\${Environment}-\${Project}-${props.functionName}-lambda`),
            handler: props.handler,
            layers: functionLayers.length ? functionLayers : undefined,
            memorySize: props.memory || LambdaFactory.MEMORY,
            runtime: LambdaFactory.RUNTIME,
            timeout: core_1.Duration.minutes(props.timeout || this.genericLambdaProperties.timeout || LambdaFactory.TIMEOUT),
            tracing: aws_lambda_1.Tracing.ACTIVE,
            reservedConcurrentExecutions: props.reservedConcurrentExecutions,
            deadLetterQueue: props.deadLetterQueue,
        };
        return functionProperties;
    }
    /**
     * The layers are an optional attribute for a function.
     * Both types are optional and this function aggregates them as a single list
     * @param {LambdaDefinition=} props with the definition of the function to be created
     * @return {LayerVersion[]} an array with the list of layers to be added to the function
     */
    getFunctionLayers(props) {
        const layers = [];
        if (this.genericLambdaProperties.customLayers) {
            this.genericLambdaProperties.customLayers.forEach((resource) => layers.push(resource));
        }
        if (props.customLayers) {
            props.customLayers.forEach((resource) => layers.push(resource));
        }
        return layers;
    }
    /**
     * @summary retrieve VPC based on generic properties, lambda definiton or CBSB Defaults
     * @param {LambdaDefinition=} props
     */
    getFunctionVpc(props) {
        return this.genericLambdaProperties.vpc || props.vpc;
    }
    /**
     * @summary retrieve Subnets based on generic properties, lambda definition
     * @param {LambdaDefinition=} props
     */
    getFunctionVpcSubnets(props) {
        return this.genericLambdaProperties.vpcSubnets || props.vpcSubnets;
    }
    /**
     * @summary retrieve Security Group based on generic properties, lambda definition
     * @param {LambdaDefinition=} props
     */
    getFunctionVpcSecurityGroup(props) {
        return this.genericLambdaProperties.securityGroup || props.securityGroup;
    }
    /**
     * @summary creates IAM role for this stack
     */
    getFunctionRole(props) {
        const roleName = props.roleName || this.genericLambdaProperties.roleName;
        if (this.functionRolesCache.has(roleName)) {
            return this.functionRolesCache.get(roleName);
        }
        const iamRole = new aws_iam_1.Role(this.scope, roleName, {
            assumedBy: new aws_iam_1.ServicePrincipal('lambda.amazonaws.com'),
        });
        iamRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'));
        if (props.vpc) {
            iamRole.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'));
        }
        this.functionRolesCache.set(roleName, iamRole);
        return iamRole;
    }
    /**
     * @summary creates invoke permission
     * @param {string=} resourceName
     * @param {string=} functionArn
     * @param {InvokePermissionProperties=} invokePermission
     */
    createInvokePermission(resourceName, functionArn, invokePermission) {
        new aws_lambda_1.CfnPermission(this.scope, `${resourceName}LambdaFunctionInvokePermission`, {
            action: 'lambda:InvokeFunction',
            principal: invokePermission.principal,
            functionName: `${functionArn}:${LambdaFactory.PUBLISH_ALIAS}`,
            sourceArn: invokePermission.sourceArn,
        });
    }
    /**
     * Returns the tags for each function
     * @param {LambdaDefinition=} props with the definition of the function to be created
     * @return a key/value object with the generated tags
     */
    getFunctionTags(props) {
        const { functionName, description } = props;
        const tags = new resource_tags_1.ResourceTags({
            name: functionName,
            description,
            technology: 'lambda',
        });
        return tags.getTagsAsCdkTags();
    }
    /**
     * For each lambda function, a Log Group resource is also generated
     * @param {string=} resourceName with the definition of the function to be created
     * @param {CfnFunction=} lambda resource
     * @return {CfnLogGroup} created log group
     */
    createLogGroupResource(resourceName, lambda, retentionPeriod) {
        return new aws_logs_1.CfnLogGroup(this.scope, `${resourceName}LogGroup`, {
            retentionInDays: retentionPeriod || 7,
            logGroupName: core_1.Fn.join('', ['/aws/lambda/', lambda.functionName]),
        });
    }
    /**
     * @summary Creates an output for all functions that requires one
     * @param {string=} resourceName
     * @param {LambdaDefinition=} props
     */
    createOutputResource(resourceName, props) {
        new core_1.CfnOutput(this.scope, `${resourceName}Output`, {
            exportName: props.outputName || `${props.functionName}-output`,
            value: `${core_1.Fn.getAtt(resourceName, 'Arn')}:${this.getLambdaAlias(props)}`,
            description: props.description,
        });
    }
    /**
     * @summary creates a subscription filter for Kibana
     * @param {LambdaDefinition=} props
     * @param {string=} resourceName
     * @param {CfnLogGroup=} logGroup
     */
    createKibanaSubscription(props, resourceName, logGroup) {
        const subscription = new aws_logs_1.CfnSubscriptionFilter(this.scope, `${resourceName}LogGroupSubscription`, {
            logGroupName: `${logGroup.logGroupName}`,
            destinationArn: core_1.Fn.sub('arn:aws:kinesis:${AWS::Region}:${AWS::AccountId}:stream/${Application}-${Country}-${Environment}-log-stream'),
            filterPattern: '',
            roleArn: aws_ssm_1.StringParameter.valueForStringParameter(this.scope, props.kinesisRoleArnSsmPath),
        });
        subscription.addDependsOn(logGroup);
    }
    /**
     *
     * @param {LambdaDefinition=} props
     * @return {string} lambda alias
     */
    getLambdaAlias(props) {
        return props.alias || this.genericLambdaProperties.alias || LambdaFactory.PUBLISH_ALIAS;
    }
    /**
     * Returns the CfnFunction resource with the given resource name
     * @param {string} resourceName Template resource name to find
     * @return {CfnFunction} CfnFunction when found or exception when not
     */
    getFunctionByName(resourceName) {
        if (Object.prototype.hasOwnProperty.call(this.generatedFunctionList, resourceName)) {
            return this.generatedFunctionList[resourceName].lambdaFunction;
        }
        throw new Error('No function was created with the given resource name');
    }
    /**
     * Returns the CfnAlias resource with the given function resource name
     * @param {string=} resourceName Template resource name to find
     * @return {CfnAlias} CfnAlias when found or exception when not
     */
    getAliasByFunctionName(resourceName) {
        if (Object.prototype.hasOwnProperty.call(this.generatedFunctionList, resourceName)) {
            return this.generatedFunctionList[resourceName].lambdaAlias;
        }
        throw new Error('No function was created with the given resource name');
    }
}
exports.LambdaFactory = LambdaFactory;
/**
 * Default runtime for the lambda function
 * @default 'nodejs12.x'
 */
LambdaFactory.RUNTIME = aws_lambda_1.Runtime.NODEJS_12_X;
/**
 * Standard alias name
 */
LambdaFactory.PUBLISH_ALIAS = 'vLatest';
/**
 * Default memory value to use for the lambda function if none is given
 * @default 512
 */
LambdaFactory.MEMORY = 512;
/**
 * Default timeout for the function if none is given in minutes
 * @default 15
 */
LambdaFactory.TIMEOUT = 15;
/**
 * Default tracing value for the function
 * @default 'Active'
 */
LambdaFactory.TRACING = aws_lambda_1.Tracing.ACTIVE;
