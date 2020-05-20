import { Construct } from '@aws-cdk/core';
import { CfnRestApi, CfnStage } from '@aws-cdk/aws-apigateway';
/**
 * Generate resources related to the API
 */
export declare class ResourceApi {
    private scope;
    private props;
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
     * MRA api resource name
     */
    private apiName;
    /**
     * Api dashboard name
     */
    private dashboardName;
    /**
     * Swagger file path in S3
     */
    private swagger;
    /**
    * Generates constructs for the API
    * @param scope The parent construct
    * @param props Properties for defining the API
    */
    constructor(scope: Construct, props: ResourceApiProperties);
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
    private createStageTags;
    /**
   * Creates resource for Dashboard
   */
    private createDashboard;
    private addApiGatewayWidgetRow;
    private createApiGatewayRequestsWidget;
    private createApiGatewayLatencyWidget;
    private createApiGatewayMetric;
    /**
     * Generates all the resources involved in the API
     */
    private buildApiResources;
    /**
     * Expose the api resource
     * @returns current api Cfn resource
     */
    getApi(): CfnRestApi;
    /**
     * Expose the api stage resource
     * @returns current api stage Cfn resource
     */
    getApiStage(): CfnStage;
}
export interface ResourceApiProperties {
    /**
     * CFN resource name for the API
     */
    resourceName: string;
    /**
     * Properties related to the Swagger file
     */
    swagger: ResourceApiSwagger;
    /**
     * Name of the stage
     */
    stageName: string;
    /**
     * The base path name after the domain name
     */
    basePath: string;
    /**
     * Domain name of the resource
     */
    domainName: string;
    /**
     * Optional stage variables
     */
    variables?: {
        [key: string]: (string);
    };
    /**
     * Optional with dashboard flag
     */
    withDashboard?: boolean;
}
export interface ResourceApiSwagger {
    /**
     * Swagger file name
     */
    file: string;
    /**
     * S3 Bucket name
     */
    bucket: string;
}
