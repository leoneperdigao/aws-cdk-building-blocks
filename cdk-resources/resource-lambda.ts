import { Construct, Fn, CfnResource, CfnOutput, ICfnConditionExpression } from '@aws-cdk/core';
import { CfnFunction, CfnFunctionProps } from '@aws-cdk/aws-sam';
import { CfnLogGroup, CfnSubscriptionFilter } from '@aws-cdk/aws-logs';
import { CfnPermission, CfnAlias, CfnVersion } from '@aws-cdk/aws-lambda';
import { CfnRule } from '@aws-cdk/aws-events';

import { ResourceTags } from './resource-tags';

/**
 * Generate resources Lambda related
 */
export class ResourceLambda {

  /**
   * The generic properties appicable to all lambdas
   */
  private genericLambdaProperties: GenericLambdaProperties;
  /**
   * List with function definitions before creation of resources
   */
  private lambdaPropertiesList: LambdaDefinition[];
  /**
   * List of functions that requires lambda warmer creations
   */
  private warmerList: { [key: string]: LambdaDefinition };
  /**
   * List of functions that requires an output to be created
   */
  private outputFunctionList: { [key: string]: LambdaDefinition };
  /**
   * List of all CfnFunction resources generated
   */
  private generatedFunctionList: { [key: string]: { lambdaFunction: CfnFunction, lambdaAlias: CfnAlias } };
  /**
   * List of logGroups that should be pushed to splunk
   */
  private splunkLogGroupList: { [key: string]: CfnLogGroup };
  /**
   * MRA standarnd naming for the role
   */
  readonly FUNCTION_ROLE = 'arn:aws:iam::${AWS::AccountId}:role/rol-bnd-df-${Environment}-go-';
  /**
   * Default runtime for the lambda function
   */
  readonly RUNTIME = 'nodejs12.x';
  /**
   * MRA alias name
   */
  readonly PUBLISH_ALIAS = 'v1'
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
  readonly TRACING = 'Active';
  /**
   * MRA standard naming for rules
   */
  readonly RULE_NAME = 'rule-${Country}-${Account}-${Application}-${Project}-lambda-warmer-${Branch}-${Environment}';
  /**
   * Flag used to avoid re-creation of function resources
   */
  private areResourcesCreated: boolean;

  /**
   * Generates construct for the Lambda function.
   * @param scope The parent construct
   */
  constructor(private scope: Construct, genericLambdaProperties: GenericLambdaProperties) {
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
  public addFunctionResource(lambda: LambdaDefinition): void {
    this.lambdaPropertiesList.push(lambda);
  }

  /**
   * After function definitions were added to the queue. This function serves
   * as entry point to create all resources for each of the given definitions
   */
  public createFunctionResources(): void {
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
  private createFunctionResource(props: LambdaDefinition): { lambdaFunction: CfnFunction, lambdaAlias: CfnAlias } {
    const lambdaFunction: CfnFunction = new CfnFunction(
      this.scope,
      props.resourceName,
      this.getFunctionProperties(props)
    );

    const functionVersion = new CfnVersion(this.scope, `${props.resourceName}Version${Date.now()}`, {
      functionName: lambdaFunction.ref
    });

    const lambdaAlias = new CfnAlias(this.scope, `${props.resourceName}Alias${this.getLambdaAlias(props)}`, {
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
  private getFunctionProperties(props: LambdaDefinition): CfnFunctionProps {
    const functionRole = `${this.FUNCTION_ROLE}\${${props.role || this.genericLambdaProperties.role}}`;
    const functionLayers = this.getFunctionLayers(props);
    const functionProperties: CfnFunctionProps = {
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
      role: Fn.sub(functionRole),
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
  private getFunctionLayers(props: LambdaDefinition): string[] {
    const layers: string[] = [];

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
  private getFunctionVpc(props: LambdaDefinition): FunctionVpcType {
    if (props.vpcConfig && props.vpcConfig.hasOwnProperty('SubnetIds')) {
      const config = props.vpcConfig as VpcConfiguration;
      return {
        subnetIds: config.SubnetIds,
        securityGroupIds: config.SecurityGroupIds,
      } as CfnFunction.VpcConfigProperty;
    } else {
      return props.vpcConfig ? (props.vpcConfig as ICfnConditionExpression) : undefined;
    }
  }

  /**
   * Returns the RMA tags for each function
   * @param props with the definition of the function to be created
   * @returns a key/value object with the generated tags
   */
  private getFunctionTags(props: LambdaDefinition): { [key: string]: string } {
    const { functionName, description } = props;
    const tags = new ResourceTags({
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
  private createLogGroupResource(resourceName: string, lambda: CfnFunction): CfnLogGroup {
    return new CfnLogGroup(
      this.scope,
      `${resourceName}LogGroup`,
      {
        retentionInDays: 7,
        logGroupName: Fn.join('', ['/aws/lambda/', lambda.ref]),
      }
    );
  }

  /**
   * Due to a constrain of target properties per rule, we have to group all
   * lambda functions on groups of maximum 5 lambdas per fule. This function 
   * groups the lambdas before the rules creation
   */
  private prepareLambdaWarmers() {
    const groupedWarmers: Array<Array<string>> = [];
    const resourceNames: string[] = Object.keys(this.warmerList);
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
  private createWarmerRules(groupedWarmers: Array<Array<string>>): void {
    groupedWarmers.forEach((group, index) => {
      const rule = new CfnRule(this.scope, `LambaWarmerRule${index}`, {
        description: 'Lambda warmer',
        name: Fn.sub(`${this.RULE_NAME}-${index}`),
        scheduleExpression: Fn.sub('${LambdaWarmerScheduleRate}'),
        targets: []
      });
      rule.targets = group.map(resource => {
        const props: LambdaDefinition = this.warmerList[resource];
        this.createLambdaPermission(resource, props, rule);
        return {
          id: Fn.join('', ['rule-', `${props.functionName}`]),
          arn: `${Fn.getAtt(resource, 'Arn')}:${this.getLambdaAlias(props)}`,
          input: '{ "warmer": true, "concurrency": 1, "cfg": { "log": false } }'
        }
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
  private createLambdaPermission(resourceName: string, props: LambdaDefinition, rule: CfnRule): void {
    new CfnPermission(
      this.scope,
      `${resourceName}Permission`,
      {
        action: 'lambda:InvokeFunction',
        principal: 'events.amazonaws.com',
        functionName: `${Fn.getAtt(resourceName, 'Arn')}:${this.getLambdaAlias(props)}`,
        sourceArn: `${rule.getAtt('Arn')}`
      }
    );
  }

  /**
   * Creates an output for all functions that requires one
   */
  private createOutputResource(): void {
    for (const resourceName in this.outputFunctionList) {
      if (!this.outputFunctionList[resourceName]) continue;
      const props: LambdaDefinition = this.outputFunctionList[resourceName];
      const exportName = props.outputName || props.functionName + '-output';
      new CfnOutput(this.scope, `${resourceName}Output`, {
        exportName: exportName,
        value: `${Fn.getAtt(resourceName, 'Arn')}:${this.getLambdaAlias(props)}`,
        description: props.description
      });
    }
  }

  private createSplunkLoggerFunction(): { lambdaFunction: CfnFunction, lambdaAlias: CfnAlias } {
    const splunkLogger: LambdaDefinition = {
      resourceName: 'SplunkLogger',
      functionName: `${Fn.sub('lambda-${Country}-${Account}-${Application}-${Project}-splunk-logger-${Branch}-${Environment}')}`,
      description: 'Function to send cloudwatch logs to splunk',
      handler: 'splunkLogger.handler',
      code: './node_modules/codecommit-go-prd-mra-commons/lib/splunkLogger.js',
      environmentVariables: {
        SPLUNK_INDEX: `${Fn.conditionIf(
          'isPrdDeployment',
          `${Fn.sub('df_${Application}_${Account}')}`,
          `${Fn.sub('df_${Application}_${Account}_${Environment}')}`,
        )}`,
      },
      withLambdaWarmer: false,
    };
    const splunkResource = this.createFunctionResource(splunkLogger);
    this.createLogGroupResource('SplunkLogger', splunkResource.lambdaFunction);
    return splunkResource;
  }

  private createSplunkResources(): void {
    const splunkResource = this.createSplunkLoggerFunction();

    for (const resourceName in this.splunkLogGroupList) {
      if (!this.splunkLogGroupList[resourceName]) continue;
      const logGroup = this.splunkLogGroupList[resourceName];

      new CfnSubscriptionFilter(
        this.scope,
        `${resourceName}LogGroupSubscription`,
        {
          logGroupName: `${logGroup.logGroupName}`,
          destinationArn: splunkResource.lambdaAlias.ref,
          filterPattern: '[timestamp=*Z, request_id="*-*", event]',
        }
      )

      new CfnPermission(
        this.scope,
        `${resourceName}SplunkLoggerPermission`,
        {
          action: 'lambda:InvokeFunction',
          principal: 'logs.amazonaws.com',
          functionName: splunkResource.lambdaAlias.ref,
          sourceArn: `${logGroup.getAtt('Arn')}`
        }
      );
    }
  }

  private getLambdaAlias(props: LambdaDefinition): string {
    let aliasName = props.alias || this.genericLambdaProperties.alias || this.PUBLISH_ALIAS;
    if (process.env.BRANCH_PREFIX) {
      if (process.env.BRANCH_PREFIX === 'master') {
        aliasName = 'prd';
      } else {
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
  public getFunctionByName(resourceName: string): CfnFunction {
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
  public getAliasByFunctionName(resourceName: string): CfnAlias {
    if (this.generatedFunctionList.hasOwnProperty(resourceName))
      return this.generatedFunctionList[resourceName].lambdaAlias;
    else
      throw new Error('No function was created with the given resource name');
  }
}

export interface GenericLambdaProperties {
  /**
   * Optional value for the function alias, default will be used if none provided
   */
  alias?: string,
  /**
   * Optional list of custom layers to be used in the function
   */
  customLayers?: CfnResource[],
  /**
   * Optional environment variables to the function
   */
  environmentVariables?: { [key: string]: (string) },
  /**
   * Role to be used to execute the function
   */
  role: string
  /**
   * Optional value for the function timeout, default will be used if none provided
   */
  timeout?: number,
  /**
   * Optional: set to 'true' when a lambda warmed should be created for this function
   */
  withLambdaWarmer?: boolean,
}

export interface LambdaDefinition {
  /**
   * Template given name for the resource
   */
  resourceName: string,
  /**
   * Name of lambda function
   */
  functionName: string,
  /**
   * Optional value for the function alias, default will be used if none provided
   */
  alias?: string,
  /**
   * Description given to the lambda function
   */
  description: string,
  /**
   * Function handler
   */
  handler: string,
  /**
   * Function URI to the code
   */
  code: string,
  /**
   * Role to be used to execute the function
   */
  role?: string
  /**
   * Optional environment variables to the function
   */
  environmentVariables?: { [key: string]: (string) },
  /**
   * Optional value for the function memory, default will be used if none provided
   */
  memory?: number,
  /**
   * Optional value for the function timeout, default will be used if none provided
   */
  timeout?: number,
  /**
   * Optional value for the function concurrent executions
   */
  reservedConcurrentExecutions?: number,
  /**
   * Optional list of custom layers to be used in the function
   */
  customLayers?: CfnResource[],
  /**
   * Optional: set to 'true' when a lambda warmed should be created for this function
   */
  withLambdaWarmer?: boolean,
  /**
   * Optional: set to 'true' when the function needs to be an output
   */
  withOutput?: boolean,
  /**
   * Optional: set to 'false' when the function shouldn't log to splunk, default is true
   */
  withSplunkLogging?: boolean,
  /**
   * Optional value for the function alias, default will be used if none provided
   */
  outputName?: string,
  /**
   * Optional dead letter queue object
   */
  deadLetterQueue?: DeadLetterQueue,
  /**
   * Optional configuration of VPC
   */
  vpcConfig?: VpcConfiguration | ICfnConditionExpression,
}

export interface DeadLetterQueue {
  /**
   * Type of dead letter queue
   */
  type: DeadLetterQueueType,
  /**
   * Target Arn of dead letter queue
   */
  targetArn: string
}

export enum DeadLetterQueueType {
  /**
   * Type SNS
   */
  SNS = 'SNS',
  /**
   * Type SQS
   */
  SQS = 'SQS'
}

export interface VpcConfiguration {
  /**
   * List of security groups
   */
  SecurityGroupIds: string[],
  /**
   * List of subnet ids
   */
  SubnetIds: string[],
}

type FunctionVpcType = CfnFunction.VpcConfigProperty | ICfnConditionExpression | undefined;
