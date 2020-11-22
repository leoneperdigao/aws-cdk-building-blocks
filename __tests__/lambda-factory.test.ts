import path from 'path';
import { expect as awsExpect, haveResource } from '@aws-cdk/assert';
import { Stack, CfnOutput } from '@aws-cdk/core';
import { LayerVersion, Code } from '@aws-cdk/aws-lambda';
import { PolicyStatement, Effect } from '@aws-cdk/aws-iam';
import { Vpc, SecurityGroup } from '@aws-cdk/aws-ec2';
import { LambdaFactory, LambdaLayerFactory } from '../src';
import { LambdaDefinition } from '../src/types';

describe('Resource Lambda', () => {
  let stack: Stack;
  const generateLambdaFunction = (numberOfFunctions: number): LambdaDefinition[] => {
    const functionList = [];
    for (let i = 0; i < numberOfFunctions; i++) {
      functionList.push({
        resourceName: `SomeResource${i}`,
        functionName: `myFunction${i}`,
        description: `This is just a description for function #${i}`,
        handler: `index${i}.handler`,
        codeAsset: Code.fromAsset(
          path.join(__dirname, './data'),
          { exclude: ['**', '!index.js'] },
        ),
        invokePermission: {
          principal: 'somePrincipal',
          sourceArn: 'arn:aws:some-service:some-region:some-account-id:some-resource',
        },
      });
    }
    return functionList;
  };

  const getTags = (functionNumber: number): { [key: string]: any }[] => ([
    {
      Key: 'Application',
      Value: {
        'Fn::Sub': '${Application}',
      },
    },
    {
      Key: 'Description',
      Value: `This is just a description for function #${functionNumber}`,
    },
    {
      Key: 'Environment',
      Value: {
        'Fn::Sub': '${Environment}',
      },
    },
    {
      Key: 'Name',
      Value: `myFunction${functionNumber}`,
    },
    {
      Key: 'Technology',
      Value: 'lambda',
    },
  ]);

  const mockedDate = Date.now();

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => mockedDate);
  });

  beforeEach(() => {
    stack = new Stack(undefined, undefined, {
      env: {
        account: '180503163342',
        region: 'eu-west-1',
      },
    });
    stack.node.setContext('environment', 'dev');
  });

  it('should be able to create a new lambda function with minimal requirements', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    testFunction.roleName = undefined;
    testFunction.invokePermission = undefined;
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Function',
      {
        Handler: 'index0.handler',
        Runtime: 'nodejs12.x',
        FunctionName: {
          'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction0-lambda',
        },
        MemorySize: 512,
        Role: {
          'Fn::GetAtt': [
            'SomeGenericRole3FA2CF51',
            'Arn',
          ],
        },
        Timeout: 900,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: getTags(0),
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: 'SomeResource0521AFD6A' }]] },
        RetentionInDays: 7,
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SomeResource0521AFD6A' },
        FunctionVersion: {
          'Fn::GetAtt': [
            `SomeResource0Version${mockedDate}`,
            'Version',
          ],
        },
        Name: 'vLatest',
      },
    ));
  });

  it('should be able to create a new lambda function with minimal requirements, using function role', () => {
    const testFunctions: LambdaDefinition[] = generateLambdaFunction(2);
    const testFunction1: LambdaDefinition = testFunctions[0];
    const testFunction2: LambdaDefinition = testFunctions[1];
    testFunction1.roleName = 'LambdaRole';
    testFunction2.roleName = 'LambdaRole';
    testFunction1.executionRolePolicyStatements = [new PolicyStatement({
      effect: Effect.ALLOW,
      sid: 'test',
      actions: [
        'ssm:GetParameter',
      ],
      resources: ['*'],
    })];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
    resource.addFunctionResource(testFunction1);
    resource.addFunctionResource(testFunction2);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Function',
      {
        Handler: 'index0.handler',
        Runtime: 'nodejs12.x',
        FunctionName: {
          'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction0-lambda',
        },
        MemorySize: 512,
        Role: {
          'Fn::GetAtt': [
            'LambdaRole3A44B857',
            'Arn',
          ],
        },
        Timeout: 900,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: getTags(0),
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Function',
      {
        Handler: 'index1.handler',
        Runtime: 'nodejs12.x',
        FunctionName: {
          'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction1-lambda',
        },
        MemorySize: 512,
        Role: {
          'Fn::GetAtt': [
            'LambdaRole3A44B857',
            'Arn',
          ],
        },
        Timeout: 900,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: getTags(1),
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: 'SomeResource0521AFD6A' }]] },
        RetentionInDays: 7,
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: 'SomeResource112B4CCD5' }]] },
        RetentionInDays: 7,
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SomeResource0521AFD6A' },
        FunctionVersion: {
          'Fn::GetAtt': [
            `SomeResource0Version${mockedDate}`,
            'Version',
          ],
        },
        Name: 'vLatest',
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SomeResource112B4CCD5' },
        FunctionVersion: {
          'Fn::GetAtt': [
            `SomeResource1Version${mockedDate}`,
            'Version',
          ],
        },
        Name: 'vLatest',
      },
    ));
  });

  it('should be able to create a new lambda function, using one role for each lambda', () => {
    const testFunctions: LambdaDefinition[] = generateLambdaFunction(2);
    const testFunction1: LambdaDefinition = testFunctions[0];
    const testFunction2: LambdaDefinition = testFunctions[1];
    testFunction1.roleName = 'LambdaRole1';
    testFunction2.roleName = 'LambdaRole2';
    testFunction1.executionRolePolicyStatements = [new PolicyStatement({
      effect: Effect.ALLOW,
      sid: 'test',
      actions: [
        'ssm:GetParameter',
      ],
      resources: ['*'],
    })];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
    resource.addFunctionResource(testFunction1);
    resource.addFunctionResource(testFunction2);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Function',
      {
        Handler: 'index0.handler',
        Runtime: 'nodejs12.x',
        FunctionName: {
          'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction0-lambda',
        },
        MemorySize: 512,
        Role: {
          'Fn::GetAtt': [
            'LambdaRole14270E568',
            'Arn',
          ],
        },
        Timeout: 900,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: getTags(0),
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Function',
      {
        Handler: 'index1.handler',
        Runtime: 'nodejs12.x',
        FunctionName: {
          'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction1-lambda',
        },
        MemorySize: 512,
        Role: {
          'Fn::GetAtt': [
            'LambdaRole22883988B',
            'Arn',
          ],
        },
        Timeout: 900,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: getTags(1),
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: 'SomeResource0521AFD6A' }]] },
        RetentionInDays: 7,
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: 'SomeResource112B4CCD5' }]] },
        RetentionInDays: 7,
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SomeResource0521AFD6A' },
        FunctionVersion: {
          'Fn::GetAtt': [
            `SomeResource0Version${mockedDate}`,
            'Version',
          ],
        },
        Name: 'vLatest',
      },
    ));

    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SomeResource112B4CCD5' },
        FunctionVersion: {
          'Fn::GetAtt': [
            `SomeResource1Version${mockedDate}`,
            'Version',
          ],
        },
        Name: 'vLatest',
      },
    ));
  });

  it('should be able to create a new lambda function with ouput, kibana logging and a custom layer', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        customLayers: [{} as LayerVersion],
        roleName: 'SomeGenericRole',
      },
    );

    testFunction.withOutput = true;
    testFunction.kinesisRoleArnSsmPath = '/ssm/path/to/kinesis/role/arn';
    testFunction.withKibanaLogging = true;
    testFunction.customLayers = [{} as LayerVersion];

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      Handler: 'index0.handler',
      Runtime: 'nodejs12.x',
      FunctionName: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction0-lambda',
      },
      MemorySize: 512,
      Role: {
        'Fn::GetAtt': [
          'SomeGenericRole3FA2CF51',
          'Arn',
        ],
      },
      Timeout: 900,
      TracingConfig: {
        Mode: 'Active',
      },
      Tags: getTags(0),
    }));

    awsExpect(stack).to(haveResource(
      'AWS::Logs::LogGroup',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: 'SomeResource0521AFD6A' }]] },
        RetentionInDays: 7,
      },
    ));
    awsExpect(stack).to(haveResource(
      'AWS::Lambda::Alias',
      {
        FunctionName: { Ref: 'SomeResource0521AFD6A' },
        FunctionVersion: {
          'Fn::GetAtt': [
            `SomeResource0Version${mockedDate}`,
            'Version',
          ],
        },
        Name: 'vLatest',
      },
    ));
    const outputs = stack.node.findChild('SomeResource0Output') as CfnOutput;
    expect(outputs).toBeDefined();
    expect(outputs.exportName).toBe('myFunction0-output');

    awsExpect(stack).to(haveResource(
      'AWS::Logs::SubscriptionFilter',
      {
        LogGroupName: { 'Fn::Join': ['', ['/aws/lambda/', { Ref: 'SomeResource0521AFD6A' }]] },
        DestinationArn: {
          // eslint-disable-next-line max-len
          'Fn::Sub': 'arn:aws:kinesis:${AWS::Region}:${AWS::AccountId}:stream/${Application}-${Country}-${Environment}-log-stream',
        },
        FilterPattern: '',
        RoleArn: {
          Ref: 'SsmParameterValuessmpathtokinesisrolearnC96584B6F00A464EAD1953AFF4B05118Parameter',
        },
      },
    ));
  });

  it('should be able to find the function resource once generated', () => {
    const resourceName = 'TestResource';
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
    testFunction.resourceName = resourceName;
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();
    expect(resource.getFunctionByName(resourceName)).toBeDefined();
    expect(resource.getAliasByFunctionName(resourceName)).toBeDefined();
  });

  it('should throw an error when looking for a non existing resource', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
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

  it('should throw an error when looking for a alias for non existing resource', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
    const errorResponse = 'Error: No function was created with the given resource name';
    let catchResponse: any;

    try {
      resource.addFunctionResource(testFunction);
      resource.createFunctionResources();
      resource.getAliasByFunctionName('FakeResource');
    } catch (e) {
      catchResponse = e.toString();
    }
    expect(catchResponse).toEqual(errorResponse);
  });

  it('should throw an error when createFunctionResources is called withouth function definitions', () => {
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
    const errorResponse = 'Error: No function definitions found for creation';
    let catchResponse: any;

    try {
      resource.createFunctionResources();
    } catch (e) {
      catchResponse = e.toString();
    }

    expect(catchResponse).toEqual(errorResponse);
    awsExpect(stack).notTo(haveResource('AWS::Lambda::Function', {}));
  });

  it('should throw an error when attempting to add more function definitions and the resources were created', () => {
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
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
    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {}));
  });

  it('should be able to create a function with the proper tags', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      Tags: getTags(0),
    }));
  });

  it('should be able to create a function with custom function properties', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    testFunction.memory = 1024;
    testFunction.timeout = 40;
    testFunction.reservedConcurrentExecutions = 1;
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      MemorySize: 1024,
      Timeout: 2400,
      ReservedConcurrentExecutions: 1,
    }));
  });

  it('should be able to create lambda function with environment variables', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    testFunction.environmentVariables = {
      Var1: 'some value',
      Var2: 'another value',
    };
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          Var1: 'some value',
          Var2: 'another value',
        },
      },
    }));
  });

  it('should be able to create lambda function with a custom layer', () => {
    const customLayer = new LambdaLayerFactory(stack, {
      resourceName: 'TestLayer',
      codeAsset: Code.fromAsset(path.join(__dirname, './data')),
      description: 'This is a test layer',
      license: 'This is a license',
    });
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    testFunction.customLayers = [customLayer.getLambdaLayer()];
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      Layers: [{
        Ref: 'TestLayer4DE356F6',
      }],
    }));
  });

  it('should be able to create a lambda function with its proper LogGroup', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      FunctionName: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction0-lambda',
      },
    }));
    awsExpect(stack).to(haveResource('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    }));
  });

  it('should create two function and each with its own LogGroup', () => {
    const functionList: LambdaDefinition[] = generateLambdaFunction(2);
    const testFunction1: LambdaDefinition = functionList[0];
    const testFunction2: LambdaDefinition = functionList[1];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    resource.addFunctionResource(testFunction1);
    resource.addFunctionResource(testFunction2);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      FunctionName: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction0-lambda',
      },
    }));
    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      FunctionName: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-myFunction1-lambda',
      },
    }));
  });

  it('should be able to create 10 functions', () => {
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );
    const totalLambdas = 10;

    generateLambdaFunction(totalLambdas).forEach((definition) => resource.addFunctionResource(definition));
    resource.createFunctionResources();

    for (let i = 0; i < totalLambdas; i++) {
      awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
        Handler: `index${i}.handler`,
        Role: {
          'Fn::GetAtt': [
            'SomeGenericRole3FA2CF51',
            'Arn',
          ],
        },
        Runtime: 'nodejs12.x',
        FunctionName: {
          'Fn::Sub': `\${Application}-\${Country}-\${Environment}-\${Project}-myFunction${i}-lambda`,
        },
        MemorySize: 512,
        Timeout: 900,
        TracingConfig: {
          Mode: 'Active',
        },
        Tags: getTags(i),
      }));
      awsExpect(stack).to(haveResource(
        'AWS::Logs::LogGroup',
        {
          RetentionInDays: 7,
        },
      ));
      awsExpect(stack).to(haveResource(
        'AWS::Lambda::Alias',
        {
          Name: 'vLatest',
        },
      ));
    }
  });

  it('should be able to create a function with custom VPC properties', () => {
    const testFunction: LambdaDefinition = generateLambdaFunction(1)[0];
    const resource = new LambdaFactory(
      stack,
      {
        roleName: 'SomeGenericRole',
      },
    );

    const customVpc = new Vpc(stack, 'CustomVpc');

    testFunction.vpc = customVpc;
    testFunction.securityGroup = new SecurityGroup(stack, 'CustomSecurityGroup', {
      vpc: customVpc,
    });
    testFunction.vpcSubnets = customVpc.selectSubnets();
    resource.addFunctionResource(testFunction);
    resource.createFunctionResources();

    awsExpect(stack).to(haveResource('AWS::Lambda::Function', {
      VpcConfig: {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              'CustomSecurityGroupE5E500E5',
              'GroupId',
            ],
          },
        ],
        SubnetIds: [
          {
            Ref: 'CustomVpcPrivateSubnet1Subnet013F240D',
          },
          {
            Ref: 'CustomVpcPrivateSubnet2Subnet8D284732',
          },
          {
            Ref: 'CustomVpcPrivateSubnet3Subnet28154FDD',
          },
        ],
      },
    }));
  });
});
