import { Fn, Construct, RemovalPolicy } from '@aws-cdk/core';
import { LayerVersion, Runtime, CfnLayerVersionPermission } from '@aws-cdk/aws-lambda';
import { LambdaLayerProps } from './types/index';

/**
 * @summary Generate lambda layer resource
 */
export class LambdaLayerFactory {
  private lambdaLayer: LayerVersion;

  /**
   *
   * @param {Construct=} scope The parent construct
   * @param {LambdaLayerProps=} props
   */
  constructor(private readonly scope: Construct, props: LambdaLayerProps) {
    this.createCommonsLayer(props);
    this.createCommonsLayerPermission(props);
  }

  /**
   * @return {lambda.LayerVersion} Lambdas's layer
   */
  public getLambdaLayer(): LayerVersion {
    return this.lambdaLayer;
  }

  /**
   * @summary creates layer based on provided properties
   * @param {ResourceLambdaLayerProperties=} props
   */
  private createCommonsLayer(props: LambdaLayerProps) {
    this.lambdaLayer = new LayerVersion(this.scope, props.resourceName, {
      layerVersionName: Fn.sub('${Application}-${Country}-${Environment}-${Project}-layer'),
      description: props.description,
      code: props.codeAsset,
      compatibleRuntimes: props.compatibleRuntimes || [Runtime.NODEJS_12_X],
      license: props.license,
    });
  }

  /**
   * @summary creates layer's permission
   */
  private createCommonsLayerPermission(props: LambdaLayerProps) {
    const permission = new CfnLayerVersionPermission(this.scope, `${props.resourceName}Permission`, {
      action: 'lambda:GetLayerVersion',
      layerVersionArn: this.lambdaLayer.layerVersionArn,
      principal: Fn.sub('${AWS::AccountId}'),
    });
    permission.applyRemovalPolicy(RemovalPolicy.RETAIN, { applyToUpdateReplacePolicy: false });
  }
}
