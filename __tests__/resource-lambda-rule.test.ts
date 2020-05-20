import { expect as awsExpect, haveResource } from '@aws-cdk/assert';
import { Stack, Fn } from '@aws-cdk/core';

import {
  ResourceLambdaRule,
  ResourceLambdaRuleProperties
} from './../cdk-resources/resource-lambda-rule';
import {
  ResourceLambda,
  LambdaDefinition,
} from '../cdk-resources/resource-lambda';

describe('Resource Lambda Rule', () => {

  test('should be able to generate a rule for a given lambda', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = {
      resourceName: 'SomeFunction',
      functionName: 'myFunction',
      description: 'Random function description',
      handler: 'index.handler',
      code: 'index.handler',
      role: 'Role1',
      alias: 'anAlias'
    };
    const ruleProps: ResourceLambdaRuleProperties = {
      resourceName: 'SomeRule',
      ruleName: Fn.sub('rule-${C}-${A}-${A}-${P}-some-function'),
      description: 'some rule description',
      schedule: 'SomeSchedule',
      targetArn: `${Fn.getAtt(testFunction.resourceName, 'Arn')}:${testFunction.alias}`,
    };
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    new ResourceLambdaRule(stack, ruleProps);

    awsExpect(stack).to(haveResource('AWS::Events::Rule', {
      Description: 'some rule description',
      ScheduleExpression: { 'Fn::Sub': '${SomeSchedule}' },
      Name: {
        'Fn::Sub': 'rule-${C}-${A}-${A}-${P}-some-function'
      },
      Targets: [{
        Id: {
          'Fn::Sub': 'rule-${C}-${A}-${A}-${P}-some-function'
        },
        Arn: {
          'Fn::Join': [
            '',
            [
              { 'Fn::GetAtt': ['SomeFunction', 'Arn'] }, ':anAlias'
            ]
          ]
        }
      }]
    }));
    awsExpect(stack).to(haveResource('AWS::Lambda::Permission', {
      FunctionName: {
        'Fn::Join': [
          '',
          [
            { 'Fn::GetAtt': ['SomeFunction', 'Arn'] }, ':anAlias'
          ]
        ]
      },
      Action: 'lambda:InvokeFunction',
      Principal: 'events.amazonaws.com',
      SourceArn: {
        'Fn::GetAtt': ['SomeRule', 'Arn']
      },
    }));
  });
});
