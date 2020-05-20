import {
  expect as awsExpect,
  haveResource,
} from '@aws-cdk/assert';
import { Stack, Fn, Aws } from '@aws-cdk/core';
import { CfnLayerVersion } from '@aws-cdk/aws-sam';

import {
  ResourceLambda,
  LambdaDefinition,
  VpcConfiguration
} from '../cdk-resources/resource-lambda';

describe('Resource Lambda', () => {
  test('should be able to create a new lambda function with minimal requirements', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      CodeUri: 'index0.js',
      Handler: 'index0.handler',
      Runtime: 'nodejs12.x',
      FunctionName: 'myFunction0',
      MemorySize: 512,
      Role: {
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:role/rol-bnd-df-${Environment}-go-${SomeRole0}'
      },
      Timeout: 15,
      Tracing: 'Active'
    }));

    awsExpect(stack).to(haveResource(
      'AWS::Serverless::Function',
      {
        CodeUri: 'index0.js',
        Handler: 'index0.handler',
        Runtime: 'nodejs12.x',
        FunctionName: 'myFunction0',
        MemorySize: 512,
        Role: { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:role/rol-bnd-df-${Environment}-go-${SomeRole0}' },
        Timeout: 15,
        Tracing: 'Active',
        Tags: {
          OpCo: 'df',
          Owner: 'df-operations@company.com',
          Dtap: { 'Fn::Sub': '${Account}' },
          Creator: 'df-operations@company.com',
          Technology: 'lambda',
          Application: { 'Fn::Sub': '${Application}' },
          Ec2ctl: 'n/a',
          Description: 'This is just a description for function #0',
          Name: 'myFunction0'
        }
      }
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { 'Ref': 'SomeResource0' }]] },
        RetentionInDays: 7
      }
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SomeResource0' },
        Name: 'v1'
      }
    ));
    awsExpect(stack).to(haveResource(
      'AWS::Serverless::Function',
      {
        CodeUri: './node_modules/codecommit-go-prd-mra-commons/lib/splunkLogger.js',
        Handler: 'splunkLogger.handler',
        Runtime: 'nodejs12.x',
        Environment: {
          Variables: { SPLUNK_INDEX: { 'Fn::If': ['isPrdDeployment', { 'Fn::Sub': 'df_${Application}_${Account}' }, { 'Fn::Sub': 'df_${Application}_${Account}_${Environment}' }] } }
        },
        FunctionName: { 'Fn::Sub': 'lambda-${Country}-${Account}-${Application}-${Project}-splunk-logger-${Branch}-${Environment}' },
        MemorySize: 512,
        Role: { 'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:role/rol-bnd-df-${Environment}-go-${SomeGenericRole}' },
        Timeout: 15,
        Tracing: 'Active',
        Tags: {
          OpCo: 'df',
          Owner: 'df-operations@company.com',
          Dtap: { 'Fn::Sub': '${Account}' },
          Creator: 'df-operations@company.com',
          Technology: 'lambda',
          Application: { 'Fn::Sub': '${Application}' },
          Ec2ctl: 'n/a',
          Description: 'Function to send cloudwatch logs to splunk',
          Name: { 'Fn::Sub': 'lambda-${Country}-${Account}-${Application}-${Project}-splunk-logger-${Branch}-${Environment}' }
        }
      }
    ));
    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { 'Ref': 'SplunkLogger' }]] },
        RetentionInDays: 7
      }
    ));
    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SplunkLogger' },
        Name: 'v1'
      }
    ));
    awsExpect(stack).to(haveResource(
      'AWS::Logs::SubscriptionFilter',
      {
        DestinationArn: { Ref: 'SplunkLoggerAliasv1' },
        FilterPattern: '[timestamp=*Z, request_id=\"*-*\", event]',
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { 'Ref': 'SomeResource0' }]] }
      }
    ));
    awsExpect(stack).to(haveResource(
      'AWS::Logs::SubscriptionFilter',
      {
        DestinationArn: { Ref: 'SplunkLoggerAliasv1' },
        FilterPattern: '[timestamp=*Z, request_id=\"*-*\", event]',
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { 'Ref': 'SomeResource0' }]] }
      }
    ));
    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Permission',
      {
        Action: 'lambda:InvokeFunction',
        FunctionName: { Ref: 'SplunkLoggerAliasv1' },
        Principal: 'logs.amazonaws.com',
        SourceArn: { 'Fn::GetAtt': ['SomeResource0LogGroup', 'Arn'] }
      }
    ));
  });

  test('should be able to find the function resource once generated', () => {
    const stack = new Stack();
    const resourceName = 'TestResource';
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });
    let foundResource;

    testFunction.resourceName = resourceName
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();
    foundResource = resource.getFunctionByName(resourceName);

    expect(foundResource).toBeDefined();
  });

  test('should throw an error when looking for a non existing resource', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });
    const errorResponse = 'Error: No function was created with the given resource name';
    let catchResponse: any;

    try {
      resource.addFunctionResource(testFunction);
      resource.createFunctionResources();
      resource.getFunctionByName('FakeResource');
    } catch (e) {
      catchResponse = e.toString();
    }

    expect(catchResponse).toEqual(errorResponse);
  });

  test('should throw an error when createFunctionResources is called withouth function definitions', () => {
    const stack = new Stack();
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });
    const errorResponse = 'Error: No function definitions found for creation';
    let catchResponse: any;

    try {
      resource.createFunctionResources();
    } catch (e) {
      catchResponse = e.toString();
    }

    expect(catchResponse).toEqual(errorResponse);
    awsExpect(stack).notTo(haveResource('AWS::Serverless::Function', {}));
  });

  test('should throw an error when attempting to add more function definitions and the resources were created', () => {
    const stack = new Stack();
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const errorResponse = 'Error: The resources were already created for this iteration';
    let catchResponse: any;

    try {
      resource.addFunctionResource(testFunction);
      resource.createFunctionResources();
      resource.addFunctionResource(testFunction);
      resource.createFunctionResources();
    } catch (e) {
      catchResponse = e.toString();
    }

    expect(catchResponse).toEqual(errorResponse);
    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {}));
  });

  test('should be able to create a function with the proper MRA tags', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      Tags: {
        OpCo: 'df',
        Owner: 'df-operations@company.com',
        Dtap: {
          'Fn::Sub': '${Account}'
        },
        Creator: 'df-operations@company.com',
        Technology: 'lambda',
        Application: {
          'Fn::Sub': '${Application}'
        },
        Ec2ctl: 'n/a',
        Description: 'This is just a description for function #0',
        Name: 'myFunction0'
      }
    }));
  });

  test('should be able to create a function with custom function properties', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    testFunction.memory = 1024;
    testFunction.timeout = 40;
    testFunction.reservedConcurrentExecutions = 1;
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      MemorySize: 1024,
      Timeout: 40,
      ReservedConcurrentExecutions: 1
    }));
  });

  test('should be able to create lambda function with environment variables', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    testFunction.environmentVariables = {
      'Var1': 'some value',
      'Var2': 'another value'
    }
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      Environment: {
        Variables: {
          'Var1': 'some value',
          'Var2': 'another value'
        }
      }
    }));
  });

  test('should be able to create lambda function with a custom layer', () => {
    const stack = new Stack();
    const customLayer = new CfnLayerVersion(stack, 'TestLayer', {});
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    testFunction.customLayers = [customLayer];
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      Layers: [{
        'Ref': 'TestLayer'
      }]
    }));
  });

  test('should be able to create a lambda function with its proper LogGroup', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      FunctionName: 'myFunction0',
    }));
    awsExpect(stack).to(haveResource('AWS::Logs::LogGroup', {
      LogGroupName: {
        'Fn::Join': [
          '',
          [
            '/aws/lambda/',
            { 'Ref': 'SomeResource0' }
          ]
        ]
      },
      RetentionInDays: 7
    }));
  });

  test('should create two function and each with its own LogGroup', () => {
    const stack = new Stack();
    const functionList: LambdaDefinition[] = functionGenerator(2);
    const testFunction1: LambdaDefinition = functionList[0];
    const testFunction2: LambdaDefinition = functionList[1];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    resource.addFunctionResource(testFunction1);
    resource.addFunctionResource(testFunction2);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      FunctionName: 'myFunction0',
    }));
    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      FunctionName: 'myFunction1',
    }));
    awsExpect(stack).to(haveResource('AWS::Logs::LogGroup', {
      LogGroupName: {
        'Fn::Join': [
          '',
          [
            '/aws/lambda/',
            { 'Ref': 'SomeResource0' }
          ]
        ]
      },
    }));
    awsExpect(stack).to(haveResource('AWS::Logs::LogGroup', {
      LogGroupName: {
        'Fn::Join': [
          '',
          [
            '/aws/lambda/',
            { 'Ref': 'SomeResource1' }
          ]
        ]
      },
    }));
  });

  test('should be able to create the lambda warmer rule and grant the permission to invoke', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    testFunction.withLambdaWarmer = true;
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      FunctionName: 'myFunction0'
    }));
    awsExpect(stack).to(haveResource('AWS::Lambda::Permission', {
      FunctionName: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::GetAtt': [
                'SomeResource0',
                'Arn'
              ]
            },
            ':v1'
          ]
        ]
      },
      Action: 'lambda:InvokeFunction',
      Principal: 'events.amazonaws.com',
      SourceArn: {
        'Fn::GetAtt': [
          'LambaWarmerRule0',
          'Arn'
        ]
      },
    }));
    awsExpect(stack).to(haveResource('AWS::Events::Rule', {
      Description: 'Lambda warmer',
      ScheduleExpression: { 'Fn::Sub': '${LambdaWarmerScheduleRate}' },
      Name: {
        'Fn::Sub': 'rule-${Country}-${Account}-${Application}-${Project}-lambda-warmer-${Branch}-${Environment}-0'
      },
      Targets: [{
        Id: 'rule-myFunction0',
        Arn: {
          'Fn::Join': [
            '',
            [
              {
                'Fn::GetAtt': [
                  'SomeResource0',
                  'Arn'
                ]
              },
              ':v1'
            ]
          ]
        },
        Input: '{ "warmer": true, "concurrency": 1, "cfg": { "log": false } }'
      }]
    }));
  });

  test('should be able to create 12 functions with 12 rule invoke permissions and 3 rules (2 with 5 targets and 1 rule with 2 targets)', () => {
    const stack = new Stack();
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });
    const totalLambdas = 12;
    let ruleTargets = [];

    functionGenerator(totalLambdas).forEach(definition => {
      definition.withLambdaWarmer = true;
      resource.addFunctionResource(definition);
    });
    resource.createFunctionResources();

    for (let i = 0; i < totalLambdas; i++) {
      awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
        FunctionName: `myFunction${i}`
      }));
      awsExpect(stack).to(haveResource('AWS::Lambda::Permission', {
        FunctionName: {
          'Fn::Join': [
            '',
            [
              {
                'Fn::GetAtt': [
                  `SomeResource${i}`,
                  'Arn'
                ]
              },
              ':v1'
            ]
          ]
        },
        Action: 'lambda:InvokeFunction',
        Principal: 'events.amazonaws.com',
        SourceArn: {
          'Fn::GetAtt': [
            `LambaWarmerRule${(Math.floor((i + 5) / 5)) - 1}`,
            'Arn'
          ]
        },
      }));
    }

    for (let i = 0; i < totalLambdas; i++) {
      if (i === 0 || i === 5 || i === 10) { //empty targets for next rule evaluation
        ruleTargets = [];
      }

      ruleTargets.push({
        Id: `rule-myFunction${i}`,
        Arn: {
          'Fn::Join': [
            '',
            [{ 'Fn::GetAtt': [`SomeResource${i}`, 'Arn'] }, ':v1']
          ]
        },
        Input: '{ "warmer": true, "concurrency": 1, "cfg": { "log": false } }'
      });

      if (i === 4 || i === 9 || i === (totalLambdas - 1)) { // evaluate rule only when targets are full or no functions left
        const ruleNumber = (Math.floor((i + 5) / 5)) - 1;
        awsExpect(stack).to(haveResource('AWS::Events::Rule', {
          Description: 'Lambda warmer',
          ScheduleExpression: { 'Fn::Sub': '${LambdaWarmerScheduleRate}' },
          Name: {
            'Fn::Sub': 'rule-${Country}-${Account}-${Application}-${Project}-lambda-warmer-${Branch}-${Environment}-' + ruleNumber
          },
          Targets: ruleTargets
        }));
      }
    }
  });

  test('should be able to create a function with VPC properties', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });

    testFunction.vpcConfig = {
      SubnetIds: [
        Fn.importValue(Fn.sub('subnet-1')),
        Fn.importValue(Fn.sub('subnet-2')),
      ],
      SecurityGroupIds: [
        Fn.importValue(Fn.sub('security-group-1')),
        Fn.importValue(Fn.sub('security-group-2')),
      ],
    };
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      VpcConfig: {
        SecurityGroupIds: [{
          'Fn::ImportValue': {
            'Fn::Sub': 'security-group-1'
          }
        }, {
          'Fn::ImportValue': {
            'Fn::Sub': 'security-group-2'
          }
        }],
        SubnetIds: [{
          'Fn::ImportValue': {
            'Fn::Sub': 'subnet-1'
          }
        }, {
          'Fn::ImportValue': {
            'Fn::Sub': 'subnet-2'
          }
        }]
      }
    }));
  });

  test('should be able to create a function with a conditional VPC properties', () => {
    const stack = new Stack();
    const testFunction: LambdaDefinition = functionGenerator(1)[0];
    const resource = new ResourceLambda(stack, { role: 'SomeGenericRole' });
    const conditionalVpc = Fn.conditionIf(
      'isThisTrue',
      {
        SubnetIds: [
          Fn.importValue(Fn.sub('subnet-1')),
          Fn.importValue(Fn.sub('subnet-2')),
        ],
        SecurityGroupIds: [
          Fn.importValue(Fn.sub('security-group-1')),
          Fn.importValue(Fn.sub('security-group-2')),
        ],
      } as VpcConfiguration,
      Aws.NO_VALUE
    );

    testFunction.vpcConfig = conditionalVpc;
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Serverless::Function', {
      VpcConfig: {
        'Fn::If': [
          'isThisTrue',
          {
            SecurityGroupIds: [{
              'Fn::ImportValue': {
                'Fn::Sub': 'security-group-1'
              }
            }, {
              'Fn::ImportValue': {
                'Fn::Sub': 'security-group-2'
              }
            }],
            SubnetIds: [{
              'Fn::ImportValue': {
                'Fn::Sub': 'subnet-1'
              }
            }, {
              'Fn::ImportValue': {
                'Fn::Sub': 'subnet-2'
              }
            }]
          },
          { 'Ref': 'AWS::NoValue' }
        ]
      }
    }));
  });

});

const functionGenerator = (numberOfFunctions: number): LambdaDefinition[] => {
  const functionList = [];

  for (let i = 0; i < numberOfFunctions; i++) {
    functionList.push({
      resourceName: `SomeResource${i}`,
      functionName: `myFunction${i}`,
      description: `This is just a description for function #${i}`,
      handler: `index${i}.handler`,
      code: `index${i}.js`,
      role: `SomeRole${i}`
    });
  }

  return functionList;
}
