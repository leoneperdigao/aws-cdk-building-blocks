import { Construct, Duration, Fn, Tag } from '@aws-cdk/core';
import { Dashboard, GraphWidget, Metric } from '@aws-cdk/aws-cloudwatch';
import {
  CfnRestApi,
  CfnDeployment,
  CfnStage,
  CfnBasePathMapping
} from '@aws-cdk/aws-apigateway';

import { ResourceTags } from './resource-tags';
import { safeLoad } from 'js-yaml';
import { readFileSync } from 'fs';

/**
 * Generate resources related to the API 
 */
export class ResourceApi {
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
   * MRA api resource name 
   */
  private apiName: string = 'api-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}';
  /**
   * Api dashboard name
   */
  private dashboardName: string = 'dashboard-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}';
  /**
   * Swagger file path in S3
   */
  private swagger: string = 's3://${#BUCKET}/${Application}/${Project}/api-gateway-swagger/${Branch}/#FILE';

  /**
  * Generates constructs for the API
  * @param scope The parent construct
  * @param props Properties for defining the API
  */
  constructor(private scope: Construct, private props: ResourceApiProperties) {
    this.buildApiResources();
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
            Location: Fn.sub(this.swagger)
          }
        }
      }
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
        restApiId: this.api.ref
      }
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
          httpMethod: '*'
        }],
        tags: this.createStageTags(),
      }
    );
  }

  /**
   * Creates resource for the base path mapping
   */
  private createBaseMapping() {
    this.baseMapping = new CfnBasePathMapping(
      this.scope,
      'BasePathMapping',
      {
        restApiId: this.api.ref,
        stage: this.props.stageName,
        basePath: this.props.basePath,
        domainName: this.props.domainName,
      }
    );
    this.baseMapping.addDependsOn(this.stage);
  }

  private createStageTags(): Tag[] {
    const resourceTags = new ResourceTags({
      name: Fn.sub(this.apiName) + ':' + `${this.props.stageName}`,
      description: 'API Gateway',
      technology: 'api-gateway',
    })

    return resourceTags.getTagsAsCdkTags();
  }

  /**
 * Creates resource for Dashboard
 */
  private createDashboard() {
    this.dashboard = new Dashboard(this.scope, `${this.props.resourceName}Dashboard`, {
      dashboardName: Fn.sub(this.dashboardName),
    });

    const genericWidgetRowProps: any = {
      name: `${this.api.name}`,
      stage: `${this.stage.stageName}`,
    }
    this.addApiGatewayWidgetRow({
      ...genericWidgetRowProps,
    });

    const swaggerContent = safeLoad(readFileSync('api-gateway-swagger/' + this.props.swagger.file, 'utf8'));
    for (const path of Object.keys(swaggerContent.paths)) {
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

  private addApiGatewayWidgetRow(dashboardProps: DashboardProperties): void {
    this.dashboard.addWidgets(
      this.createApiGatewayRequestsWidget(dashboardProps),
      this.createApiGatewayLatencyWidget(dashboardProps)
    );
  }

  private createApiGatewayRequestsWidget(dashboardProps: DashboardProperties) {
    return new GraphWidget(
      {
        title: dashboardProps.titlePrefix ? dashboardProps.titlePrefix + ' - Requests' : 'Requests',
        left: [
          this.createApiGatewayMetric(dashboardProps, 'Count', 'Sum'),
          this.createApiGatewayMetric(dashboardProps, '4XXError', 'Sum'),
          this.createApiGatewayMetric(dashboardProps, '5XXError', 'Sum'),
        ],
        width: 10,
      }
    );
  }

  private createApiGatewayLatencyWidget(dashboardProps: DashboardProperties) {
    return new GraphWidget(
      {
        title: dashboardProps.titlePrefix ? dashboardProps.titlePrefix + ' - Latency' : 'Latency',
        left: [
          this.createApiGatewayMetric(dashboardProps, 'Latency', 'Average'),
          this.createApiGatewayMetric(dashboardProps, 'IntegrationLatency', 'Average'),
        ],
        width: 10,
      }
    );
  }

  private createApiGatewayMetric(dashboardProps: DashboardProperties, name: string, statistic: string): Metric {
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
        statistic: statistic,
        period: Duration.minutes(dashboardProps.period || 15),
      }
    );
  }

  /**
   * Generates all the resources involved in the API
   */
  private buildApiResources() {
    this.createApi();
    this.createDeployment();
    this.createStage();
    this.createBaseMapping();
    if (this.props.withDashboard) {
      this.createDashboard();
    }
  }

  /**
   * Expose the api resource
   * @returns current api Cfn resource
   */
  public getApi(): CfnRestApi {
    return this.api;
  }

  /**
   * Expose the api stage resource
   * @returns current api stage Cfn resource
   */
  public getApiStage(): CfnStage {
    return this.stage;
  }
}

export interface ResourceApiProperties {
  /**
   * CFN resource name for the API
   */
  resourceName: string,
  /**
   * Properties related to the Swagger file
   */
  swagger: ResourceApiSwagger,
  /**
   * Name of the stage
   */
  stageName: string,
  /**
   * The base path name after the domain name
   */
  basePath: string,
  /**
   * Domain name of the resource
   */
  domainName: string,
  /**
   * Optional stage variables
   */
  variables?: { [key: string]: (string) },
  /**
   * Optional with dashboard flag
   */
  withDashboard?: boolean,
}

export interface ResourceApiSwagger {
  /**
   * Swagger file name
   */
  file: string,
  /**
   * S3 Bucket name
   */
  bucket: string,
}

interface DashboardProperties {
  readonly titlePrefix?: string,
  readonly name: string,
  readonly stage: string,
  readonly resource?: string,
  readonly method?: string,
  readonly period?: number,
}

