"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_cloudwatch_1 = require("@aws-cdk/aws-cloudwatch");
const aws_apigateway_1 = require("@aws-cdk/aws-apigateway");
const resource_tags_1 = require("./resource-tags");
const js_yaml_1 = require("js-yaml");
const fs_1 = require("fs");
/**
 * Generate resources related to the API
 */
class ResourceApi {
    /**
    * Generates constructs for the API
    * @param scope The parent construct
    * @param props Properties for defining the API
    */
    constructor(scope, props) {
        this.scope = scope;
        this.props = props;
        /**
         * MRA api resource name
         */
        this.apiName = 'api-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}';
        /**
         * Api dashboard name
         */
        this.dashboardName = 'dashboard-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}';
        /**
         * Swagger file path in S3
         */
        this.swagger = 's3://${#BUCKET}/${Application}/${Project}/api-gateway-swagger/${Branch}/#FILE';
        this.buildApiResources();
    }
    /**
     * Creates resource for RestAPI
     */
    createApi() {
        this.swagger = this.swagger
            .replace('#BUCKET', this.props.swagger.bucket)
            .replace('#FILE', this.props.swagger.file);
        this.api = new aws_apigateway_1.CfnRestApi(this.scope, this.props.resourceName, {
            name: core_1.Fn.sub(this.apiName),
            body: {
                'Fn::Transform': {
                    Name: 'AWS::Include',
                    Parameters: {
                        Location: core_1.Fn.sub(this.swagger)
                    }
                }
            }
        });
    }
    /**
     * Creates resource for API deployment
     */
    createDeployment() {
        this.deployment = new aws_apigateway_1.CfnDeployment(this.scope, `${this.props.resourceName}Deployment${Date.now()}`, {
            restApiId: this.api.ref
        });
    }
    /**
     * Creates resource for API Stage
     */
    createStage() {
        this.stage = new aws_apigateway_1.CfnStage(this.scope, `${this.props.resourceName}Stage`, {
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
        });
    }
    /**
     * Creates resource for the base path mapping
     */
    createBaseMapping() {
        this.baseMapping = new aws_apigateway_1.CfnBasePathMapping(this.scope, 'BasePathMapping', {
            restApiId: this.api.ref,
            stage: this.props.stageName,
            basePath: this.props.basePath,
            domainName: this.props.domainName,
        });
        this.baseMapping.addDependsOn(this.stage);
    }
    createStageTags() {
        const resourceTags = new resource_tags_1.ResourceTags({
            name: core_1.Fn.sub(this.apiName) + ':' + `${this.props.stageName}`,
            description: 'API Gateway',
            technology: 'api-gateway',
        });
        return resourceTags.getTagsAsCdkTags();
    }
    /**
   * Creates resource for Dashboard
   */
    createDashboard() {
        this.dashboard = new aws_cloudwatch_1.Dashboard(this.scope, `${this.props.resourceName}Dashboard`, {
            dashboardName: core_1.Fn.sub(this.dashboardName),
        });
        const genericWidgetRowProps = {
            name: `${this.api.name}`,
            stage: `${this.stage.stageName}`,
        };
        this.addApiGatewayWidgetRow({
            ...genericWidgetRowProps,
        });
        const swaggerContent = js_yaml_1.safeLoad(fs_1.readFileSync('api-gateway-swagger/' + this.props.swagger.file, 'utf8'));
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
    addApiGatewayWidgetRow(dashboardProps) {
        this.dashboard.addWidgets(this.createApiGatewayRequestsWidget(dashboardProps), this.createApiGatewayLatencyWidget(dashboardProps));
    }
    createApiGatewayRequestsWidget(dashboardProps) {
        return new aws_cloudwatch_1.GraphWidget({
            title: dashboardProps.titlePrefix ? dashboardProps.titlePrefix + ' - Requests' : 'Requests',
            left: [
                this.createApiGatewayMetric(dashboardProps, 'Count', 'Sum'),
                this.createApiGatewayMetric(dashboardProps, '4XXError', 'Sum'),
                this.createApiGatewayMetric(dashboardProps, '5XXError', 'Sum'),
            ],
            width: 10,
        });
    }
    createApiGatewayLatencyWidget(dashboardProps) {
        return new aws_cloudwatch_1.GraphWidget({
            title: dashboardProps.titlePrefix ? dashboardProps.titlePrefix + ' - Latency' : 'Latency',
            left: [
                this.createApiGatewayMetric(dashboardProps, 'Latency', 'Average'),
                this.createApiGatewayMetric(dashboardProps, 'IntegrationLatency', 'Average'),
            ],
            width: 10,
        });
    }
    createApiGatewayMetric(dashboardProps, name, statistic) {
        return new aws_cloudwatch_1.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: name,
            dimensions: {
                ApiName: dashboardProps.name,
                Stage: dashboardProps.stage,
                ...(dashboardProps.resource && { Resource: dashboardProps.resource }),
                ...(dashboardProps.resource && { Method: dashboardProps.method }),
            },
            statistic: statistic,
            period: core_1.Duration.minutes(dashboardProps.period || 15),
        });
    }
    /**
     * Generates all the resources involved in the API
     */
    buildApiResources() {
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
    getApi() {
        return this.api;
    }
    /**
     * Expose the api stage resource
     * @returns current api stage Cfn resource
     */
    getApiStage() {
        return this.stage;
    }
}
exports.ResourceApi = ResourceApi;
