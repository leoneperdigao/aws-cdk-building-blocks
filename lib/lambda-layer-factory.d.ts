import { Construct } from '@aws-cdk/core';
import { LayerVersion } from '@aws-cdk/aws-lambda';
import { LambdaLayerProps } from './types/index';
/**
 * @summary Generate lambda layer resource
 */
export declare class LambdaLayerFactory {
    private readonly scope;
    private lambdaLayer;
    /**
     *
     * @param {Construct=} scope The parent construct
     * @param {LambdaLayerProps=} props
     */
    constructor(scope: Construct, props: LambdaLayerProps);
    /**
     * @return {lambda.LayerVersion} Lambdas's layer
     */
    getLambdaLayer(): LayerVersion;
    /**
     * @summary creates layer based on provided properties
     * @param {ResourceLambdaLayerProperties=} props
     */
    private createCommonsLayer;
    /**
     * @summary creates layer's permission
     */
    private createCommonsLayerPermission;
}
