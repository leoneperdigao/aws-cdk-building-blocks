import {
  Construct, Fn, CfnOutput, Duration, Tag, Aspects,
} from '@aws-cdk/core';
import {
  Role, ServicePrincipal, ManagedPolicy,
} from '@aws-cdk/aws-iam';
import { IVpc, SelectedSubnets, ISecurityGroup } from '@aws-cdk/aws-ec2';
import { CfnLogGroup, CfnSubscriptionFilter } from '@aws-cdk/aws-logs';
import { StringParameter } from '@aws-cdk/aws-ssm';
import {
  Function, CfnAlias, CfnVersion, FunctionProps, Tracing, Runtime, LayerVersion, CfnPermission,
} from '@aws-cdk/aws-lambda';
import { LambdaFactoryProps, LambdaDefinition, InvokePermissionProperties } from './types/lambda-factory.types';
import { ResourceTags } from './resource-tags';

/**
 * @summary Generate resources Lambda related
 */
export class LambdaFactory {
  /**
   * Default runtime for the lambda function
   * @default 'nodejs12.x'
   */
  public static readonly RUNTIME = Runtime.NODEJS_12_X;
  /**
   * Standard alias name
   */
  public static readonly PUBLISH_ALIAS = 'vLatest';
  /**
   * Default memory value to use for the lambda function if none is given
   * @default 512
   */
  public static readonly MEMORY = 512;
  /**
   * Default timeout for the function if none is given in minutes
   * @default 15
   */
  public static readonly TIMEOUT = 15;
  /**
   * Default tracing value for the function
   * @default 'Active'
   */
  public static readonly TRACING = Tracing.ACTIVE;
  /**
   * Cache for Function role
   */
  private readonly functionRolesCache: Map<string, Role> = new Map();
  /**
   * The generic properties applicable to all lambdas
   */
  private genericLambdaProperties: LambdaFactoryProps;
  /**
   * List with function definitions before creation of resources
   */
  private lambdaPropertiesList: LambdaDefinition[];
  /**
   * List of all CfnFunction resources generated
   */
  private generatedFunctionList: { [key: string]: { lambdaFunction: Function, lambdaAlias: CfnAlias } };
  /**
   * Flag used to avoid re-creation of function resources
   */
  private areResourcesCreated: boolean;

  /**
   * Generates construct for the Lambda function.
   * @param {Construct=} scope The parent construct
   * @param {LambdaFactoryProps=} genericLambdaProperties lambda properties
   */
  constructor(private readonly scope: Construct, genericLambdaProperties: LambdaFactoryProps) {
    this.genericLambdaProperties = genericLambdaProperties;
    this.areResourcesCreated = false;
    this.lambdaPropertiesList = [];
    this.generatedFunctionList = {};
  }

  /**
   * Adds a new function definition to the queue before resource creation
   * @param {LambdaDefinition=} lambda Properties of the lambda to be created
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
  private createFunctionResource(props: LambdaDefinition): { lambdaFunction: Function, lambdaAlias: CfnAlias } {
    const lambdaFunction: Function = new Function(
      this.scope,
      props.resourceName,
      this.getFunctionProperties(props),
    );

    if (props.executionRolePolicyStatements && props.executionRolePolicyStatements.length) {
      props.executionRolePolicyStatements.forEach((statement) => lambdaFunction.addToRolePolicy(statement));
    }

    const lambdaVersion = new CfnVersion(this.scope, `${props.resourceName}Version${Date.now()}`, {
      functionName: lambdaFunction.functionName,
    });

    const lambdaAlias = new CfnAlias(this.scope, `${props.resourceName}Alias${this.getLambdaAlias(props)}`, {
      functionName: lambdaFunction.functionName,
      name: this.getLambdaAlias(props),
      functionVersion: lambdaVersion.attrVersion,
    });

    if (props.invokePermission) {
      this.createInvokePermission(props.resourceName, lambdaFunction.functionArn, props.invokePermission);
    }

    this.getFunctionTags(props).forEach((tag) => Aspects.of(lambdaFunction).add(new Tag(tag.key, tag.value)));
    return { lambdaFunction, lambdaAlias };
  }

  /**
   * Each Lambda function contains a set of configurable attributes
   * @param {LambdaDefinition} props: Lambda function definition with configuration for the function
   * @return {CfnFunctionProps} the interface of type CfnFunctionProps required for CfnFunction
   */
  private getFunctionProperties(props: LambdaDefinition): FunctionProps {
    const functionLayers = this.getFunctionLayers(props);
    const functionProperties: FunctionProps = {
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
      functionName: Fn.sub(`\${Application}-\${Country}-\${Environment}-\${Project}-${props.functionName}-lambda`),
      handler: props.handler,
      layers: functionLayers.length ? functionLayers : undefined,
      memorySize: props.memory || LambdaFactory.MEMORY,
      runtime: LambdaFactory.RUNTIME,
      timeout: Duration.minutes(props.timeout || this.genericLambdaProperties.timeout || LambdaFactory.TIMEOUT),
      tracing: Tracing.ACTIVE,
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
  private getFunctionLayers(props: LambdaDefinition): LayerVersion[] {
    const layers: LayerVersion[] = [];
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
  private getFunctionVpc(props: LambdaDefinition): IVpc | undefined {
    return this.genericLambdaProperties.vpc || props.vpc;
  }

  /**
   * @summary retrieve Subnets based on generic properties, lambda definition
   * @param {LambdaDefinition=} props
   */
  private getFunctionVpcSubnets(props: LambdaDefinition): SelectedSubnets | undefined {
    return this.genericLambdaProperties.vpcSubnets || props.vpcSubnets;
  }

  /**
   * @summary retrieve Security Group based on generic properties, lambda definition
   * @param {LambdaDefinition=} props
   */
  private getFunctionVpcSecurityGroup(props: LambdaDefinition): ISecurityGroup | undefined {
    return this.genericLambdaProperties.securityGroup || props.securityGroup;
  }

  /**
   * @summary creates IAM role for this stack
   */
  private getFunctionRole(props: LambdaDefinition): Role {
    const roleName = props.roleName || this.genericLambdaProperties.roleName;
    if (this.functionRolesCache.has(roleName)) {
      return this.functionRolesCache.get(roleName)!;
    }
    const iamRole = new Role(this.scope, roleName, {
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
    });
    iamRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
    );
    if (props.vpc) {
      iamRole.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      );
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
  private createInvokePermission(
    resourceName: string, functionArn: string, invokePermission: InvokePermissionProperties,
  ) {
    new CfnPermission(
      this.scope,
      `${resourceName}LambdaFunctionInvokePermission`,
      {
        action: 'lambda:InvokeFunction',
        principal: invokePermission.principal,
        functionName: `${functionArn}:${LambdaFactory.PUBLISH_ALIAS}`,
        sourceArn: invokePermission.sourceArn,
      },
    );
  }

  /**
   * Returns the tags for each function
   * @param {LambdaDefinition=} props with the definition of the function to be created
   * @return a key/value object with the generated tags
   */
  private getFunctionTags(props: LambdaDefinition): Tag[] {
    const { functionName, description } = props;
    const tags = new ResourceTags({
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
  private createLogGroupResource(resourceName: string, lambda: Function, retentionPeriod?: number): CfnLogGroup {
    return new CfnLogGroup(
      this.scope,
      `${resourceName}LogGroup`,
      {
        retentionInDays: retentionPeriod || 7,
        logGroupName: Fn.join('', ['/aws/lambda/', lambda.functionName]),
      },
    );
  }

  /**
   * @summary Creates an output for all functions that requires one
   * @param {string=} resourceName
   * @param {LambdaDefinition=} props
   */
  private createOutputResource(resourceName: string, props: LambdaDefinition): void {
    new CfnOutput(this.scope, `${resourceName}Output`, {
      exportName: props.outputName || `${props.functionName}-output`,
      value: `${Fn.getAtt(resourceName, 'Arn')}:${this.getLambdaAlias(props)}`,
      description: props.description,
    });
  }

  /**
   * @summary creates a subscription filter for Kibana
   * @param {LambdaDefinition=} props
   * @param {string=} resourceName
   * @param {CfnLogGroup=} logGroup
   */
  private createKibanaSubscription(
    props: LambdaDefinition,
    resourceName: string,
    logGroup: CfnLogGroup,
  ): void {
    const subscription = new CfnSubscriptionFilter(
      this.scope,
      `${resourceName}LogGroupSubscription`,
      {
        logGroupName: `${logGroup.logGroupName}`,
        destinationArn: Fn.sub(
          'arn:aws:kinesis:${AWS::Region}:${AWS::AccountId}:stream/${Application}-${Country}-${Environment}-log-stream',
        ),
        filterPattern: '',
        roleArn: StringParameter.valueForStringParameter(
          this.scope, props.kinesisRoleArnSsmPath!,
        ),
      },
    );
    subscription.addDependsOn(logGroup);
  }

  /**
   *
   * @param {LambdaDefinition=} props
   * @return {string} lambda alias
   */
  private getLambdaAlias(props: LambdaDefinition): string {
    return props.alias || this.genericLambdaProperties.alias || LambdaFactory.PUBLISH_ALIAS;
  }
  /**
   * Returns the CfnFunction resource with the given resource name
   * @param {string} resourceName Template resource name to find
   * @return {CfnFunction} CfnFunction when found or exception when not
   */
  public getFunctionByName(resourceName: string): Function {
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
  public getAliasByFunctionName(resourceName: string): CfnAlias {
    if (Object.prototype.hasOwnProperty.call(this.generatedFunctionList, resourceName)) {
      return this.generatedFunctionList[resourceName].lambdaAlias;
    }
    throw new Error('No function was created with the given resource name');
  }
}
