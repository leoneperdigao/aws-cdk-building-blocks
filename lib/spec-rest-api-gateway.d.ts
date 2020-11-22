import { Construct } from '@aws-cdk/core';
import { CfnRestApi, CfnStage } from '@aws-cdk/aws-apigateway';
import { SpecRestApiGatewayProps } from './types/spec-rest-api-gateway.types';
/**
 * Generate resources related to the API
 */
export declare class SpecRestApiGateway {
    private readonly scope;
    private readonly props;
    /**
     * Rest API resource
     */
    private api;
    /**
     * API deployment resource
     */
    private deployment;
    /**
     * API stage resource
     */
    private stage;
    /**
     * Base mapping resource
     */
    private baseMapping;
    /**
     * Api dashboard resource
     */
    private dashboard;
    /**
     * Api Gateway resource name
     */
    private readonly apiName;
    /**
     * Api dashboard name
     */
    private readonly dashboardName;
    /**
     * Swagger file path in S3
     */
    private swagger;
    /**
    * Generates constructs for the API
    * @param scope The parent construct
    * @param props Properties for defining the API
    */
    constructor(scope: Construct, props: SpecRestApiGatewayProps);
    /**
    * Expose the api resource
    * @returns {CfnRestApi} current api Cfn resource
    */
    getApi(): CfnRestApi;
    /**
     * Expose the api stage resource
     * @returns {CfnStage} current api stage Cfn resource
     */
    getApiStage(): CfnStage;
    /**
     * Creates resource for RestAPI
     */
    private createApi;
    /**
     * Creates resource for API deployment
     */
    private createDeployment;
    /**
     * Creates resource for API Stage
     */
    private createStage;
    /**
     * Creates resource for the base path mapping
     */
    private createBaseMapping;
    private createTags;
    /**
     * @summary Creates resource for API Gateway Dashboard
     */
    private createDashboard;
    /**
     * @param {DashboardProperties=} dashboardProps
     */
    private addApiGatewayWidgetRow;
    private static createApiGatewayRequestsWidget;
    private static createApiGatewayLatencyWidget;
    private static createApiGatewayMetric;
    /**
     * @summary creating domain for regional API
     */
    private createApiDomain;
    /**
     * Generates all the resources involved in the API
     */
    private buildApiResources;
}
