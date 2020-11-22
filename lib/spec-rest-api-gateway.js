"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecRestApiGateway = void 0;
const core_1 = require("@aws-cdk/core");
const aws_cloudwatch_1 = require("@aws-cdk/aws-cloudwatch");
const aws_apigateway_1 = require("@aws-cdk/aws-apigateway");
const aws_ssm_1 = require("@aws-cdk/aws-ssm");
const js_yaml_1 = require("js-yaml");
const fs_1 = require("fs");
const resource_tags_1 = require("./resource-tags");
/**
 * Generate resources related to the API
 */
class SpecRestApiGateway {
    /**
    * Generates constructs for the API
    * @param scope The parent construct
    * @param props Properties for defining the API
    */
    constructor(scope, props) {
        this.scope = scope;
        this.props = props;
        /**
         * Api Gateway resource name
         */
        this.apiName = '${Application}-${Country}-${Environment}-${Project}-api';
        /**
         * Api dashboard name
         */
        this.dashboardName = '${Application}-${Country}-${Environment}-${Project}-dashboard';
        /**
         * Swagger file path in S3
         */
        this.swagger = 's3://#BUCKET/${Application}/${Project}/api-gateway-swagger/${Environment}/#FILE';
        this.buildApiResources();
    }
    /**
    * Expose the api resource
    * @returns {CfnRestApi} current api Cfn resource
    */
    getApi() {
        return this.api;
    }
    /**
     * Expose the api stage resource
     * @returns {CfnStage} current api stage Cfn resource
     */
    getApiStage() {
        return this.stage;
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
                        Location: core_1.Fn.sub(this.swagger),
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
    createDeployment() {
        this.deployment = new aws_apigateway_1.CfnDeployment(this.scope, `${this.props.resourceName}Deployment${Date.now()}`, {
            restApiId: this.api.ref,
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
                    httpMethod: '*',
                }],
            tags: this.createTags('API Stage'),
        });
    }
    /**
     * Creates resource for the base path mapping
     */
    createBaseMapping() {
        this.baseMapping = new aws_apigateway_1.CfnBasePathMapping(this.scope, `${this.props.resourceName}BasePathMapping`, {
            restApiId: this.api.ref,
            stage: this.props.stageName,
            basePath: this.props.basePath,
            domainName: this.props.domainName,
        });
        this.baseMapping.addDependsOn(this.stage);
    }
    createTags(description) {
        const resourceTags = new resource_tags_1.ResourceTags({
            name: `${core_1.Fn.sub(this.apiName)}:${this.props.stageName}`,
            description: description || 'API Gateway',
            technology: 'api-gateway',
        });
        return resourceTags.getTagsAsCdkTags();
    }
    /**
     * @summary Creates resource for API Gateway Dashboard
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
        const swaggerContent = js_yaml_1.safeLoad(fs_1.readFileSync(`api-gateway-swagger/${this.props.swagger.file}`, 'utf8'));
        /* istanbul ignore next */
        for (const path of Object.keys(swaggerContent === null || swaggerContent === void 0 ? void 0 : swaggerContent.paths)) {
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
    addApiGatewayWidgetRow(dashboardProps) {
        this.dashboard.addWidgets(SpecRestApiGateway.createApiGatewayRequestsWidget(dashboardProps), SpecRestApiGateway.createApiGatewayLatencyWidget(dashboardProps));
    }
    static createApiGatewayRequestsWidget(dashboardProps) {
        return new aws_cloudwatch_1.GraphWidget({
            title: dashboardProps.titlePrefix ? `${dashboardProps.titlePrefix} - Requests` : 'Requests',
            left: [
                SpecRestApiGateway.createApiGatewayMetric(dashboardProps, 'Count', 'Sum'),
                SpecRestApiGateway.createApiGatewayMetric(dashboardProps, '4XXError', 'Sum'),
                SpecRestApiGateway.createApiGatewayMetric(dashboardProps, '5XXError', 'Sum'),
            ],
            width: 10,
        });
    }
    static createApiGatewayLatencyWidget(dashboardProps) {
        return new aws_cloudwatch_1.GraphWidget({
            title: dashboardProps.titlePrefix ? `${dashboardProps.titlePrefix} - Latency` : 'Latency',
            left: [
                SpecRestApiGateway.createApiGatewayMetric(dashboardProps, 'Latency', 'Average'),
                SpecRestApiGateway.createApiGatewayMetric(dashboardProps, 'IntegrationLatency', 'Average'),
            ],
            width: 10,
        });
    }
    static createApiGatewayMetric(dashboardProps, name, statistic) {
        return new aws_cloudwatch_1.Metric({
            namespace: 'AWS/ApiGateway',
            metricName: name,
            dimensions: {
                ApiName: dashboardProps.name,
                Stage: dashboardProps.stage,
                ...(dashboardProps.resource && { Resource: dashboardProps.resource }),
                ...(dashboardProps.resource && { Method: dashboardProps.method }),
            },
            statistic,
            period: core_1.Duration.minutes(dashboardProps.period || 15),
        });
    }
    /**
     * @summary creating domain for regional API
     */
    createApiDomain() {
        new aws_apigateway_1.CfnDomainName(this.scope, `${this.props.resourceName}DomainName`, {
            endpointConfiguration: {
                types: this.props.endpointConfigurationType || ['REGIONAL'],
            },
            domainName: this.props.domainName,
            regionalCertificateArn: aws_ssm_1.StringParameter.valueForStringParameter(this.scope, `${this.props.certificateArnSsmPath}`),
            tags: this.createTags('Domain Name'),
        });
    }
    /**
     * Generates all the resources involved in the API
     */
    buildApiResources() {
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
exports.SpecRestApiGateway = SpecRestApiGateway;
