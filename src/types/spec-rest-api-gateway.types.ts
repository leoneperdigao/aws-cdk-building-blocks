export interface SwaggerSpecProps {
  /**
   * Swagger file name
   */
  file: string,
  /**
   * S3 Bucket name
   */
  bucket: string,
}

export interface SwaggerContent {
  paths: {
    [path: string]: {
      [method: string]: {
        description: string;
      };
    }
  }
}

export interface DashboardProperties {
  readonly titlePrefix?: string,
  readonly name: string,
  readonly stage: string,
  readonly resource?: string,
  readonly method?: string,
  readonly period?: number,
}

export interface SpecRestApiGatewayProps {
  /**
   * CFN resource name for the API
   */
  resourceName: string,
  /**
   * Properties related to the Swagger file
   */
  swagger: SwaggerSpecProps,
  /**
   * Name of the stage (e.g dev, tst, acc)
   */
  stageName: string,
  /**
   * Domain name of the resource
   */
  domainName?: string,
  /**
   * The base path name after the domain name
   */
  basePath?: string,
  /**
   * Optional stage variables
   */
  variables?: { [key: string]: (string) },
  /**
   * Optional with dashboard flag
   */
  withDashboard?: boolean,
  /**
   * Optional with domain flag. If true, a new domain will be created using domainName property.
   */
  withDomain?: boolean,
  /**
   * Optional array with Api Gateway types. Default:
   * @default ['REGIONAL']
   */
  endpointConfigurationType?: string[],
  /**
   * Optional regional certificate Arn SSM path
   * If withDomain is true, this property is mandatory
   */
  certificateArnSsmPath?: string;
}
