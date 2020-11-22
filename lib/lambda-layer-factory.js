"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LambdaLayerFactory = void 0;
const core_1 = require("@aws-cdk/core");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
/**
 * @summary Generate lambda layer resource
 */
class LambdaLayerFactory {
    /**
     *
     * @param {Construct=} scope The parent construct
     * @param {LambdaLayerProps=} props
     */
    constructor(scope, props) {
        this.scope = scope;
        this.createCommonsLayer(props);
        this.createCommonsLayerPermission(props);
    }
    /**
     * @return {lambda.LayerVersion} Lambdas's layer
     */
    getLambdaLayer() {
        return this.lambdaLayer;
    }
    /**
     * @summary creates layer based on provided properties
     * @param {ResourceLambdaLayerProperties=} props
     */
    createCommonsLayer(props) {
        this.lambdaLayer = new aws_lambda_1.LayerVersion(this.scope, props.resourceName, {
            layerVersionName: core_1.Fn.sub('${Application}-${Country}-${Environment}-${Project}-layer'),
            description: props.description,
            code: props.codeAsset,
            compatibleRuntimes: props.compatibleRuntimes || [aws_lambda_1.Runtime.NODEJS_12_X],
            license: props.license,
        });
    }
    /**
     * @summary creates layer's permission
     */
    createCommonsLayerPermission(props) {
        const permission = new aws_lambda_1.CfnLayerVersionPermission(this.scope, `${props.resourceName}Permission`, {
            action: 'lambda:GetLayerVersion',
            layerVersionArn: this.lambdaLayer.layerVersionArn,
            principal: core_1.Fn.sub('${AWS::AccountId}'),
        });
        permission.applyRemovalPolicy(core_1.RemovalPolicy.RETAIN, { applyToUpdateReplacePolicy: false });
    }
}
exports.LambdaLayerFactory = LambdaLayerFactory;
