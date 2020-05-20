"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
const aws_lambda_1 = require("@aws-cdk/aws-lambda");
const aws_events_1 = require("@aws-cdk/aws-events");
class ResourceLambdaRule {
    constructor(scope, properties) {
        this.scope = scope;
        this.properties = properties;
        this.createRule();
        this.createPermission();
    }
    createRule() {
        this.rule = new aws_events_1.CfnRule(this.scope, this.properties.resourceName, {
            description: this.properties.description,
            name: this.properties.ruleName,
            scheduleExpression: core_1.Fn.sub(`\${${this.properties.schedule}}`),
            targets: [{
                    id: this.properties.ruleName,
                    arn: this.properties.targetArn
                }]
        });
    }
    createPermission() {
        new aws_lambda_1.CfnPermission(this.scope, `${this.properties.resourceName}Permission`, {
            action: 'lambda:InvokeFunction',
            principal: 'events.amazonaws.com',
            functionName: this.properties.targetArn,
            sourceArn: `${this.rule.getAtt('Arn')}`
        });
    }
}
exports.ResourceLambdaRule = ResourceLambdaRule;
