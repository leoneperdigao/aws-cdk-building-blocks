import { Runtime, Code } from '@aws-cdk/aws-lambda';

export interface LambdaLayerProps {
  /**
   * Name of the resource being created
   */
  readonly resourceName: string,
  /**
   * Lambda's layer code asset
   */
  readonly codeAsset: Code;
  /**
   * Compatible Runtimes for this lambda layer
   * @default [Runtime.NODEJS_12_X]
   */
  readonly compatibleRuntimes?: Runtime[];
  /**
   * Short description of the resource being created
   */
  readonly description?: string,
  /**
   * License name or description for lambda layer
   */
  readonly license?: string;
}
