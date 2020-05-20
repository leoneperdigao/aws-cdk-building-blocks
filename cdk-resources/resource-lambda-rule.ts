import { Construct, Fn } from '@aws-cdk/core';
import { CfnPermission } from '@aws-cdk/aws-lambda';
import { CfnRule } from '@aws-cdk/aws-events';

export class ResourceLambdaRule {

  private rule: CfnRule;

  constructor(private scope: Construct, private properties: ResourceLambdaRuleProperties) {
    this.createRule();
    this.createPermission();
  }

  private createRule(): void {
    this.rule = new CfnRule(this.scope, this.properties.resourceName, {
      description: this.properties.description,
      name: this.properties.ruleName,
      scheduleExpression: Fn.sub(`\${${this.properties.schedule}}`),
      targets: [{
        id: this.properties.ruleName,
        arn: this.properties.targetArn
      }]
    });
  }

  private createPermission(): void {
    new CfnPermission(
      this.scope,
      `${this.properties.resourceName}Permission`,
      {
        action: 'lambda:InvokeFunction',
        principal: 'events.amazonaws.com',
        functionName: this.properties.targetArn,
        sourceArn: `${this.rule.getAtt('Arn')}`
      }
    );
  }
}

export interface ResourceLambdaRuleProperties {
  resourceName: string,
  ruleName: string,
  description: string,
  schedule: string,
  targetArn: string,
}
