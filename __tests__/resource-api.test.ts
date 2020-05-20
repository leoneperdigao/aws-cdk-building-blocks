import { expect, haveResource } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';

import { ResourceApi, ResourceApiProperties } from '../cdk-resources/resource-api';

const mockedDate = Date.now();

describe('Resource API', () => {

  beforeAll(() => jest.spyOn(Date, 'now').mockImplementation(() => mockedDate));

  const commonProperties: ResourceApiProperties = {
    resourceName: 'TestAPI',
    swagger: {
      file: 'TEST_API.yaml',
      bucket: 'Bucket'
    },
    stageName: 'acc',
    basePath: 'api',
    domainName: 'service.testdomain.com'
  }

  test('should be able to create the API definition', () => {
    const stack = new Stack();
    new ResourceApi(stack, commonProperties);
    expect(stack).to(haveResource('AWS::ApiGateway::RestApi', {
      Name: {
        'Fn::Sub': 'api-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}'
      },
      Body: {
        'Fn::Transform': {
          Name: 'AWS::Include',
          Parameters: {
            Location: {
              'Fn::Sub': 's3://${Bucket}/${Application}/${Project}/api-gateway-swagger/${Branch}/TEST_API.yaml'
            }
          }
        }
      }
    }));
    expect(stack).to(haveResource('AWS::ApiGateway::Deployment', {
      RestApiId: {
        'Ref': 'TestAPI'
      },
    }));
    expect(stack).to(haveResource('AWS::ApiGateway::Stage', {
      RestApiId: {
        'Ref': 'TestAPI'
      },
      DeploymentId: {
        Ref: `TestAPIDeployment${mockedDate}`,
      },
      StageName: 'acc',
      TracingEnabled: true,
      MethodSettings: [{
        MetricsEnabled: true,
        ResourcePath: '/*',
        HttpMethod: '*'
      }],
      Tags: [{
        Key: 'OpCo',
        Value: 'df'
      }, {
        Key: 'Owner',
        Value: 'df-operations@company.com'
      }, {
        Key: 'Dtap',
        Value: { 'Fn::Sub': '${Account}' }
      }, {
        Key: 'Creator',
        Value: 'df-operations@company.com'
      }, {
        Key: 'Technology',
        Value: 'api-gateway'
      }, {
        Key: 'Application',
        Value: { 'Fn::Sub': '${Application}' }
      }, {
        Key: 'Ec2ctl',
        Value: 'n/a'
      }, {
        Key: 'Description',
        Value: 'API Gateway'
      }, {
        Key: 'Name',
        Value: {
          'Fn::Join': [
            '',
            [
              {
                'Fn::Sub': 'api-${Country}-${Account}-${Application}-${Project}-${Branch}-${Environment}'
              },
              ':acc'
            ]
          ]
        }
      }],
    }));
    expect(stack).to(haveResource('AWS::ApiGateway::BasePathMapping', {
      DomainName: 'service.testdomain.com',
      BasePath: 'api',
      RestApiId: {
        'Ref': 'TestAPI'
      },
      Stage: 'acc',
    }));
  });

  test('should be able to create the API definition with stage variables', () => {
    const stack = new Stack();
    const properties: ResourceApiProperties = {
      ...commonProperties,
      variables: {
        'Var1': 'some value',
        'Var2': 'another value'
      }
    }
    new ResourceApi(stack, properties);
    expect(stack).to(haveResource('AWS::ApiGateway::Stage', {
      RestApiId: {
        'Ref': 'TestAPI'
      },
      DeploymentId: {
        Ref: `TestAPIDeployment${mockedDate}`,
      },
      StageName: 'acc',
      TracingEnabled: true,
      Variables: {
        'Var1': 'some value',
        'Var2': 'another value'
      }
    }));
  });
});
