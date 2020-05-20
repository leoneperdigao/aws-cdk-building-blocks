"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_sam_1 = require("@aws-cdk/aws-sam");
const aws_logs_1 = require("@aws-cdk/aws-logs");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const aws_events_1 = require("@aws-cdk/aws-events");
const resource_tags_1 = require("./resource-tags");
/**
 * Generate resources Lambda related
 */
class ResourceLambda {
    /**
     * Generates construct for the Lambda function.
     * @param scope The parent construct
     */
    constructor(scope, genericLambdaProperties) {
        this.scope = scope;
        /**
         * MRA standarnd naming for the role
         */
        this.FUNCTION_ROLE = 'arn:aws:iam::${AWS::AccountId}:role/rol-bnd-df-${Environment}-go-';
        /**
         * Default runtime for the lambda function
         */
        this.RUNTIME = 'nodejs12.x';
        /**
         * MRA alias name
         */
        this.PUBLISH_ALIAS = 'v1';
        /**
         * Default memory value to use for the lambda function if none is given
         */
        this.MEMORY = 512;
        /**
         * Default timeout for the function if none is given
         */
        this.TIMEOUT = 15;
        /**
         * Default tracing value for the function
         */
        this.TRACING = 'Active';
        /**
         * MRA standard naming for rules
         */
        this.RULE_NAME = 'rule-${Country}-${Account}-${Application}-${Project}-lambda-warmer-${Branch}-${Environment}';
        this.genericLambdaProperties = genericLambdaProperties;
        this.areResourcesCreated = false;
        this.lambdaPropertiesList = [];
        this.warmerList = {};
        this.outputFunctionList = {};
        this.generatedFunctionList = {};
        this.splunkLogGroupList = {};
    }
    /**
     * Adds a new function definition to the queue before resource creation
     * @param lambda Properies of the lambda to be created
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
            const logGroup = this.createLogGroupResource(props.resourceName, lambdaFunction);
            if ((this.genericLambdaProperties.withLambdaWarmer === true && props.withLambdaWarmer !== false) ||
                (this.genericLambdaProperties.withLambdaWarmer !== true && props.withLambdaWarmer === true)) {
                this.warmerList[props.resourceName] = props;
            }
            if (props.withOutput === true) {
                this.outputFunctionList[props.resourceName] = props;
            }
            if (props.withSplunkLogging !== false) {
                this.splunkLogGroupList[props.resourceName] = logGroup;
            }
            this.generatedFunctionList[props.resourceName] = { lambdaFunction, lambdaAlias };
        }
        this.prepareLambdaWarmers();
        this.createOutputResource();
        this.createSplunkResources();
        this.areResourcesCreated = true;
    }
    /**
     * Creates the resource of type CfnFunction
     * @param props with the definition of the function to be created
     * @returns the created function of type CfnFunction
     */
    createFunctionResource(props) {
        const lambdaFunction = new aws_sam_1.CfnFunction(this.scope, props.resourceName, this.getFunctionProperties(props));
        const functionVersion = new aws_lambda_1.CfnVersion(this.scope, `${props.resourceName}Version${Date.now()}`, {
            functionName: lambdaFunction.ref
        });
        const lambdaAlias = new aws_lambda_1.CfnAlias(this.scope, `${props.resourceName}Alias${this.getLambdaAlias(props)}`, {
            functionName: lambdaFunction.ref,
            name: this.getLambdaAlias(props),
            functionVersion: functionVersion.attrVersion,
        });
        return { lambdaFunction, lambdaAlias };
    }
    /**
     * Each Lambda function contains a set of configurable attributes, some are
     * predefined as MRA configuration, others are custome configurable
     * @param props: Lambda function definition with configuration for the function
     * @returns the interface of type CfnFunctionProps required for CfnFunction
     */
    getFunctionProperties(props) {
        const functionRole = `${this.FUNCTION_ROLE}\${${props.role || this.genericLambdaProperties.role}}`;
        const functionLayers = this.getFunctionLayers(props);
        const functionProperties = {
            codeUri: props.code,
            environment: (!props.environmentVariables && !this.genericLambdaProperties.environmentVariables) ? undefined : {
                variables: {
                    ...this.genericLambdaProperties.environmentVariables,
                    ...props.environmentVariables,
                },
            },
            functionName: props.functionName,
            handler: props.handler,
            layers: functionLayers.length ? functionLayers : undefined,
            memorySize: props.memory || this.MEMORY,
            role: core_1.Fn.sub(functionRole),
            runtime: this.RUNTIME,
            tags: this.getFunctionTags(props),
            timeout: props.timeout || this.genericLambdaProperties.timeout || this.TIMEOUT,
            tracing: this.TRACING,
            reservedConcurrentExecutions: props.reservedConcurrentExecutions,
            deadLetterQueue: props.deadLetterQueue,
            vpcConfig: this.getFunctionVpc(props),
        };
        return functionProperties;
    }
    /**
     * The layers are an optional attribute for a function. From MRA perspective,
     * there are two types of layers:
     *  1) Commons: available thru the layers RMA project
     *  2) Custom: generated as part ot the current template
     * Both types are optionan and this function aggregates them as a sinlge list
     * @param props with the definition of the function to be created
     * @returns an array with the list of layers to be added to the function
     */
    getFunctionLayers(props) {
        const layers = [];
        if (this.genericLambdaProperties.customLayers) {
            this.genericLambdaProperties.customLayers.forEach(resource => {
                layers.push(resource.ref);
            });
        }
        if (props.customLayers) {
            props.customLayers.forEach(resource => {
                layers.push(resource.ref);
            });
        }
        return layers;
    }
    /**
     * Resolve vpc property type to cast as expected property type
     * @param props with the definition of the function to be created
     * @returns CfnFunction.VpcConfigProperty | ICfnConditionExpression | undefined
     */
    getFunctionVpc(props) {
        if (props.vpcConfig && props.vpcConfig.hasOwnProperty('SubnetIds')) {
            const config = props.vpcConfig;
            return {
                subnetIds: config.SubnetIds,
                securityGroupIds: config.SecurityGroupIds,
            };
        }
        else {
            return props.vpcConfig ? props.vpcConfig : undefined;
        }
    }
    /**
     * Returns the RMA tags for each function
     * @param props with the definition of the function to be created
     * @returns a key/value object with the generated tags
     */
    getFunctionTags(props) {
        const { functionName, description } = props;
        const tags = new resource_tags_1.ResourceTags({
            name: functionName,
            description: description,
            technology: 'lambda',
        });
        return tags.getTagsAsMap();
    }
    /**
     * For each lambda function, a Log Group resource is also generated
     * @param props with the definition of the function to be created
     */
    createLogGroupResource(resourceName, lambda) {
        return new aws_logs_1.CfnLogGroup(this.scope, `${resourceName}LogGroup`, {
            retentionInDays: 7,
            logGroupName: core_1.Fn.join('', ['/aws/lambda/', lambda.ref]),
        });
    }
    /**
     * Due to a constrain of target properties per rule, we have to group all
     * lambda functions on groups of maximum 5 lambdas per fule. This function
     * groups the lambdas before the rules creation
     */
    prepareLambdaWarmers() {
        const groupedWarmers = [];
        const resourceNames = Object.keys(this.warmerList);
        const maxTargets = 5;
        while (resourceNames.length > 0) {
            groupedWarmers.push(resourceNames.splice(0, maxTargets));
        }
        this.createWarmerRules(groupedWarmers);
    }
    /**
     * Receives the lambda ressource names grouped by the number of rules to be
     * created (i.e. if only two functions then we get one rule, but if we have 12
     * functions then we get 3 rules)
     * @param groupedWarmers Array containing array of lambda resource names
     */
    createWarmerRules(groupedWarmers) {
        groupedWarmers.forEach((group, index) => {
            const rule = new aws_events_1.CfnRule(this.scope, `LambaWarmerRule${index}`, {
                description: 'Lambda warmer',
                name: core_1.Fn.sub(`${this.RULE_NAME}-${index}`),
                scheduleExpression: core_1.Fn.sub('${LambdaWarmerScheduleRate}'),
                targets: []
            });
            rule.targets = group.map(resource => {
                const props = this.warmerList[resource];
                this.createLambdaPermission(resource, props, rule);
                return {
                    id: core_1.Fn.join('', ['rule-', `${props.functionName}`]),
                    arn: `${core_1.Fn.getAtt(resource, 'Arn')}:${this.getLambdaAlias(props)}`,
                    input: '{ "warmer": true, "concurrency": 1, "cfg": { "log": false } }'
                };
            });
        });
    }
    /**
     * For each rule created, a new permission is required for this rule to be
     * able to invoke the given lambda function
     * @param resourceName resource name for the lambda
     * @param props Lambda function definition with configuration for the function
     * @param rule CfnRule resource to which is required the permission
     */
    createLambdaPermission(resourceName, props, rule) {
        new aws_lambda_1.CfnPermission(this.scope, `${resourceName}Permission`, {
            action: 'lambda:InvokeFunction',
            principal: 'events.amazonaws.com',
            functionName: `${core_1.Fn.getAtt(resourceName, 'Arn')}:${this.getLambdaAlias(props)}`,
            sourceArn: `${rule.getAtt('Arn')}`
        });
    }
    /**
     * Creates an output for all functions that requires one
     */
    createOutputResource() {
        for (const resourceName in this.outputFunctionList) {
            if (!this.outputFunctionList[resourceName])
                continue;
            const props = this.outputFunctionList[resourceName];
            const exportName = props.outputName || props.functionName + '-output';
            new core_1.CfnOutput(this.scope, `${resourceName}Output`, {
                exportName: exportName,
                value: `${core_1.Fn.getAtt(resourceName, 'Arn')}:${this.getLambdaAlias(props)}`,
                description: props.description
            });
        }
    }
    createSplunkLoggerFunction() {
        const splunkLogger = {
            resourceName: 'SplunkLogger',
            functionName: `${core_1.Fn.sub('lambda-${Country}-${Account}-${Application}-${Project}-splunk-logger-${Branch}-${Environment}')}`,
            description: 'Function to send cloudwatch logs to splunk',
            handler: 'splunkLogger.handler',
            code: './node_modules/codecommit-go-prd-mra-commons/lib/splunkLogger.js',
            environmentVariables: {
                SPLUNK_INDEX: `${core_1.Fn.conditionIf('isPrdDeployment', `${core_1.Fn.sub('df_${Application}_${Account}')}`, `${core_1.Fn.sub('df_${Application}_${Account}_${Environment}')}`)}`,
            },
            withLambdaWarmer: false,
        };
        const splunkResource = this.createFunctionResource(splunkLogger);
        this.createLogGroupResource('SplunkLogger', splunkResource.lambdaFunction);
        return splunkResource;
    }
    createSplunkResources() {
        const splunkResource = this.createSplunkLoggerFunction();
        for (const resourceName in this.splunkLogGroupList) {
            if (!this.splunkLogGroupList[resourceName])
                continue;
            const logGroup = this.splunkLogGroupList[resourceName];
            new aws_logs_1.CfnSubscriptionFilter(this.scope, `${resourceName}LogGroupSubscription`, {
                logGroupName: `${logGroup.logGroupName}`,
                destinationArn: splunkResource.lambdaAlias.ref,
                filterPattern: '[timestamp=*Z, request_id="*-*", event]',
            });
            new aws_lambda_1.CfnPermission(this.scope, `${resourceName}SplunkLoggerPermission`, {
                action: 'lambda:InvokeFunction',
                principal: 'logs.amazonaws.com',
                functionName: splunkResource.lambdaAlias.ref,
                sourceArn: `${logGroup.getAtt('Arn')}`
            });
        }
    }
    getLambdaAlias(props) {
        let aliasName = props.alias || this.genericLambdaProperties.alias || this.PUBLISH_ALIAS;
        if (process.env.BRANCH_PREFIX) {
            if (process.env.BRANCH_PREFIX === 'master') {
                aliasName = 'prd';
            }
            else {
                aliasName = 'dta';
            }
        }
        return aliasName;
    }
    /**
     * Returns the CfnFunction resource with the given resource name
     * @param resourceName Template resource name to find
     * @returns CfnFunction when found or exception when not
     */
    getFunctionByName(resourceName) {
        if (this.generatedFunctionList.hasOwnProperty(resourceName))
            return this.generatedFunctionList[resourceName].lambdaFunction;
        else
            throw new Error('No function was created with the given resource name');
    }
    /**
     * Returns the CfnAlias resource with the given function resource name
     * @param resourceName Template resource name to find
     * @returns CfnAlias when found or exception when not
     */
    getAliasByFunctionName(resourceName) {
        if (this.generatedFunctionList.hasOwnProperty(resourceName))
            return this.generatedFunctionList[resourceName].lambdaAlias;
        else
            throw new Error('No function was created with the given resource name');
    }
}
exports.ResourceLambda = ResourceLambda;
var DeadLetterQueueType;
(function (DeadLetterQueueType) {
    /**
     * Type SNS
     */
    DeadLetterQueueType["SNS"] = "SNS";
    /**
     * Type SQS
     */
    DeadLetterQueueType["SQS"] = "SQS";
})(DeadLetterQueueType = exports.DeadLetterQueueType || (exports.DeadLetterQueueType = {}));
