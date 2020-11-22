import path from 'path';
import { expect as awsExpect, haveResource } from '@aws-cdk/assert';
import { Code } from '@aws-cdk/aws-lambda';
import { Stack } from '@aws-cdk/core';
import { LambdaLayerFactory } from '../src';

describe('Resource Lambda Layer', () => {
  it('Should have AWS::Lambda::LayerVersion lambda layer', async () => {
    const stack = new Stack();

    const layer = new LambdaLayerFactory(stack, {
      resourceName: 'TestLayer',
      codeAsset: Code.fromAsset(path.join(__dirname, './data')),
      description: 'This is a test layer',
      license: 'This is a license',
    });

    awsExpect(stack).to(haveResource('AWS::Lambda::LayerVersion', {
      CompatibleRuntimes: ['nodejs12.x'],
      Description: 'This is a test layer',
      LayerName: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-layer',
      },
      LicenseInfo: 'This is a license',
    }));
    awsExpect(stack).to(haveResource('AWS::Lambda::LayerVersionPermission', {
      Action: 'lambda:GetLayerVersion',
      LayerVersionArn: {
        Ref: 'TestLayer4DE356F6',
      },
      Principal: {
        'Fn::Sub': '${AWS::AccountId}',
      },
    }));
    expect(layer.getLambdaLayer()).toBeDefined();
  });
});
