import {
  Construct, Duration, Fn, Tag,
} from '@aws-cdk/core';
import { Dashboard, GraphWidget, Metric } from '@aws-cdk/aws-cloudwatch';
import {
  CfnRestApi, CfnDeployment, CfnStage, CfnBasePathMapping, CfnDomainName,
} from '@aws-cdk/aws-apigateway';
import { StringParameter } from '@aws-cdk/aws-ssm';
import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';
import { ResourceTags } from './resource-tags';
import { SpecRestApiGatewayProps, DashboardProperties, SwaggerContent } from './types/spec-rest-api-gateway.types';

/**
 * Generate resources related to the API
 */
export class SpecRestApiGateway {
  /**
   * Rest API resource
   */
  private api: CfnRestApi;
  /**
   * API deployment resource
   */
  private deployment: CfnDeployment;
  /**
   * API stage resource
   */
  private stage: CfnStage;
  /**
   * Base mapping resource
   */
  private baseMapping: CfnBasePathMapping;
  /**
   * Api dashboard resource
   */
  private dashboard: Dashboard;
  /**
   * Api Gateway resource name
   */
  private readonly apiName: string = '${Application}-${Country}-${Environment}-${Project}-api';
  /**
   * Api dashboard name
   */
  private readonly dashboardName: string = '${Application}-${Country}-${Environment}-${Project}-dashboard';
  /**
   * Swagger file path in S3
   */
  private swagger: string = 's3://#BUCKET/${Application}/${Project}/api-gateway-swagger/${Environment}/#FILE';

  /**
  * Generates constructs for the API
  * @param scope The parent construct
  * @param props Properties for defining the API
  */
  constructor(private readonly scope: Construct, private readonly props: SpecRestApiGatewayProps) {
    this.buildApiResources();
  }

  /**
  * Expose the api resource
  * @returns {CfnRestApi} current api Cfn resource
  */
  public getApi(): CfnRestApi {
    return this.api;
  }

  /**
   * Expose the api stage resource
   * @returns {CfnStage} current api stage Cfn resource
   */
  public getApiStage(): CfnStage {
    return this.stage;
  }

  /**
   * Creates resource for RestAPI
   */
  private createApi() {
    this.swagger = this.swagger
      .replace('#BUCKET', this.props.swagger.bucket)
      .replace('#FILE', this.props.swagger.file);

    this.api = new CfnRestApi(this.scope, this.props.resourceName, {
      name: Fn.sub(this.apiName),
      body: {
        'Fn::Transform': {
          Name: 'AWS::Include',
          Parameters: {
            Location: Fn.sub(this.swagger),
          },
        },
      },
      endpointConfiguration: {
        types: this.props.endpointConfigurationType || ['REGIONAL'],
      },
      tags: this.createTags(),
    });
  }

  /**
   * Creates resource for API deployment
   */
  private createDeployment() {
    this.deployment = new CfnDeployment(
      this.scope,
      `${this.props.resourceName}Deployment${Date.now()}`,
      {
        restApiId: this.api.ref,
      },
    );
  }

  /**
   * Creates resource for API Stage
   */
  private createStage() {
    this.stage = new CfnStage(
      this.scope,
      `${this.props.resourceName}Stage`,
      {
        restApiId: this.api.ref,
        deploymentId: this.deployment.ref,
        stageName: this.props.stageName,
        tracingEnabled: true,
        variables: this.props.variables,
        methodSettings: [{
          metricsEnabled: true,
          resourcePath: '/*',
          httpMethod: '*',
        }],
        tags: this.createTags('API Stage'),
      },
    );
  }

  /**
   * Creates resource for the base path mapping
   */
  private createBaseMapping() {
    this.baseMapping = new CfnBasePathMapping(
      this.scope,
      `${this.props.resourceName}BasePathMapping`,
      {
        restApiId: this.api.ref,
        stage: this.props.stageName,
        basePath: this.props.basePath,
        domainName: this.props.domainName!,
      },
    );
    this.baseMapping.addDependsOn(this.stage);
  }

  private createTags(description?: string): Tag[] {
    const resourceTags = new ResourceTags({
      name: `${Fn.sub(this.apiName)}:${this.props.stageName}`,
      description: description || 'API Gateway',
      technology: 'api-gateway',
    });

    return resourceTags.getTagsAsCdkTags();
  }

  /**
   * @summary Creates resource for API Gateway Dashboard
   */
  private createDashboard() {
    this.dashboard = new Dashboard(this.scope, `${this.props.resourceName}Dashboard`, {
      dashboardName: Fn.sub(this.dashboardName),
    });

    const genericWidgetRowProps: any = {
      name: `${this.api.name}`,
      stage: `${this.stage.stageName}`,
    };
    this.addApiGatewayWidgetRow({
      ...genericWidgetRowProps,
    });

    const swaggerContent = safeLoad(
      readFileSync(`api-gateway-swagger/${this.props.swagger.file}`, 'utf8'),
    ) as SwaggerContent;

    /* istanbul ignore next */
    for (const path of Object.keys(swaggerContent?.paths)) {
      for (const method of Object.keys(swaggerContent.paths[path])) {
        this.addApiGatewayWidgetRow({
          ...genericWidgetRowProps,
          titlePrefix: swaggerContent.paths[path][method].description,
          resource: path,
          method: method.toUpperCase(),
        });
      }
    }
  }

  /**
   * @param {DashboardProperties=} dashboardProps
   */
  private addApiGatewayWidgetRow(dashboardProps: DashboardProperties): void {
    this.dashboard.addWidgets(
      SpecRestApiGateway.createApiGatewayRequestsWidget(dashboardProps),
      SpecRestApiGateway.createApiGatewayLatencyWidget(dashboardProps),
    );
  }

  private static createApiGatewayRequestsWidget(dashboardProps: DashboardProperties) {
    return new GraphWidget(
      {
        title: dashboardProps.titlePrefix ? `${dashboardProps.titlePrefix} - Requests` : 'Requests',
        left: [
          SpecRestApiGateway.createApiGatewayMetric(dashboardProps, 'Count', 'Sum'),
          SpecRestApiGateway.createApiGatewayMetric(dashboardProps, '4XXError', 'Sum'),
          SpecRestApiGateway.createApiGatewayMetric(dashboardProps, '5XXError', 'Sum'),
        ],
        width: 10,
      },
    );
  }

  private static createApiGatewayLatencyWidget(dashboardProps: DashboardProperties) {
    return new GraphWidget(
      {
        title: dashboardProps.titlePrefix ? `${dashboardProps.titlePrefix} - Latency` : 'Latency',
        left: [
          SpecRestApiGateway.createApiGatewayMetric(dashboardProps, 'Latency', 'Average'),
          SpecRestApiGateway.createApiGatewayMetric(dashboardProps, 'IntegrationLatency', 'Average'),
        ],
        width: 10,
      },
    );
  }

  private static createApiGatewayMetric(dashboardProps: DashboardProperties, name: string, statistic: string): Metric {
    return new Metric(
      {
        namespace: 'AWS/ApiGateway',
        metricName: name,
        dimensions:
        {
          ApiName: dashboardProps.name,
          Stage: dashboardProps.stage,
          ...(dashboardProps.resource && { Resource: dashboardProps.resource }),
          ...(dashboardProps.resource && { Method: dashboardProps.method }),
        },
        statistic,
        period: Duration.minutes(dashboardProps.period || 15),
      },
    );
  }

  /**
   * @summary creating domain for regional API
   */
  private createApiDomain() {
    new CfnDomainName(this.scope, `${this.props.resourceName}DomainName`, {
      endpointConfiguration: {
        types: this.props.endpointConfigurationType || ['REGIONAL'],
      },
      domainName: this.props.domainName,
      regionalCertificateArn: StringParameter.valueForStringParameter(
        this.scope,
        `${this.props.certificateArnSsmPath}`,
      ),
      tags: this.createTags('Domain Name'),
    });
  }
  /**
   * Generates all the resources involved in the API
   */
  private buildApiResources() {
    this.createApi();
    this.createDeployment();
    this.createStage();
    if (this.props.withDomain) {
      this.createApiDomain();
      this.createBaseMapping();
    }
    if (this.props.withDashboard) {
      this.createDashboard();
    }
  }
}
