import fs from 'fs';
import path from 'path';
import { expect as awsExpect, haveResource } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { SpecRestApiGateway } from '../src';
import { SpecRestApiGatewayProps } from '../src/types';

const mockedDate = Date.now();

describe('Resource API', () => {
  const removeApiDirectory = () => {
    fs.rmdirSync(path.join(__dirname, '../api-gateway-swagger/'), { recursive: true });
  };

  const createApiDirectory = () => {
    fs.mkdirSync(path.join(__dirname, '../api-gateway-swagger/'));
  };

  const copySwaggerToApiDirectory = () => {
    fs.copyFileSync(
      path.join(__dirname, './data/TEST_API.yaml'),
      path.join(__dirname, '../api-gateway-swagger/TEST_API.yaml'),
    );
  };

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => mockedDate);
    removeApiDirectory();
    createApiDirectory();
    copySwaggerToApiDirectory();
  });

  afterAll(() => removeApiDirectory());

  const commonProperties: SpecRestApiGatewayProps = {
    resourceName: 'TestAPI',
    swagger: {
      file: 'TEST_API.yaml',
      bucket: 'Bucket',
    },
    stageName: 'acc',
    basePath: 'api',
    domainName: 'service.testdomain.com',
  };

  const getApiTags = (description: string) => ([
    {
      Key: 'Application',
      Value: {
        'Fn::Sub': '${Application}',
      },
    },
    {
      Key: 'Description',
      Value: description,
    },
    {
      Key: 'Environment',
      Value: {
        'Fn::Sub': '${Environment}',
      },
    },
    {
      Key: 'Name',
      Value: {
        'Fn::Join': [
          '',
          [
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            ':acc',
          ],
        ],
      },
    },
    {
      Key: 'Technology',
      Value: 'api-gateway',
    }]
  );

  it('Should be able to create the API definition, without domain and base mapping', () => {
    const stack = new Stack();
    stack.node.setContext('environment', 'dev');
    const restApi = new SpecRestApiGateway(stack, commonProperties);
    awsExpect(stack).to(haveResource('AWS::ApiGateway::RestApi', {
      Name: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
      },
      Body: {
        'Fn::Transform': {
          Name: 'AWS::Include',
          Parameters: {
            Location: {
              'Fn::Sub': 's3://Bucket/${Application}/${Project}/api-gateway-swagger/${Environment}/TEST_API.yaml',
            },
          },
        },
      },
      EndpointConfiguration: {
        Types: ['REGIONAL'],
      },
      Tags: getApiTags('API Gateway'),
    }));
    awsExpect(stack).to(haveResource('AWS::ApiGateway::Deployment', {
      RestApiId: {
        Ref: 'TestAPI',
      },
    }));
    awsExpect(stack).to(haveResource('AWS::ApiGateway::Stage', {
      RestApiId: {
        Ref: 'TestAPI',
      },
      DeploymentId: {
        Ref: `TestAPIDeployment${mockedDate}`,
      },
      StageName: 'acc',
      TracingEnabled: true,
      MethodSettings: [{
        MetricsEnabled: true,
        ResourcePath: '/*',
        HttpMethod: '*',
      }],
      Tags: getApiTags('API Stage'),
    }));
    expect(restApi.getApi()).toBeDefined();
    expect(restApi.getApiStage()).toBeDefined();
  });

  it('Should be able to create the API definition with domain', () => {
    const stack = new Stack();
    stack.node.setContext('environment', 'dev');
    const properties = { ...commonProperties };
    properties.withDomain = true;
    new SpecRestApiGateway(stack, properties);
    awsExpect(stack).to(haveResource('AWS::ApiGateway::RestApi', {
      Name: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
      },
      Body: {
        'Fn::Transform': {
          Name: 'AWS::Include',
          Parameters: {
            Location: {
              'Fn::Sub': 's3://Bucket/${Application}/${Project}/api-gateway-swagger/${Environment}/TEST_API.yaml',
            },
          },
        },
      },
      Tags: getApiTags('API Gateway'),
    }));
    awsExpect(stack).to(haveResource('AWS::ApiGateway::Deployment', {
      RestApiId: {
        Ref: 'TestAPI',
      },
    }));
    awsExpect(stack).to(haveResource('AWS::ApiGateway::Stage', {
      RestApiId: {
        Ref: 'TestAPI',
      },
      DeploymentId: {
        Ref: `TestAPIDeployment${mockedDate}`,
      },
      StageName: 'acc',
      TracingEnabled: true,
      MethodSettings: [{
        MetricsEnabled: true,
        ResourcePath: '/*',
        HttpMethod: '*',
      }],
      Tags: getApiTags('API Stage'),
    }));
    awsExpect(stack).to(haveResource('AWS::ApiGateway::BasePathMapping', {
      DomainName: 'service.testdomain.com',
      BasePath: 'api',
      RestApiId: {
        Ref: 'TestAPI',
      },
      Stage: 'acc',
    }));
  });

  it('Should be able to create the API definition with dashboard', () => {
    const stack = new Stack();
    stack.node.setContext('environment', 'dev');
    const properties = { ...commonProperties };
    properties.withDashboard = true;

    new SpecRestApiGateway(stack, properties);
    awsExpect(stack).to(haveResource('AWS::ApiGateway::RestApi', {
      Name: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
      },
      Body: {
        'Fn::Transform': {
          Name: 'AWS::Include',
          Parameters: {
            Location: {
              'Fn::Sub': 's3://Bucket/${Application}/${Project}/api-gateway-swagger/${Environment}/TEST_API.yaml',
            },
          },
        },
      },
      Tags: getApiTags('API Gateway'),
    }));
    awsExpect(stack).to(haveResource('AWS::ApiGateway::Deployment', {
      RestApiId: {
        Ref: 'TestAPI',
      },
    }));
    awsExpect(stack).to(haveResource('AWS::ApiGateway::Stage', {
      RestApiId: {
        Ref: 'TestAPI',
      },
      DeploymentId: {
        Ref: `TestAPIDeployment${mockedDate}`,
      },
      StageName: 'acc',
      TracingEnabled: true,
      MethodSettings: [{
        MetricsEnabled: true,
        ResourcePath: '/*',
        HttpMethod: '*',
      }],
      Tags: getApiTags('API Stage'),
    }));
    awsExpect(stack).to(haveResource('AWS::CloudWatch::Dashboard', {
      DashboardName: {
        'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-dashboard',
      },
      DashboardBody: {
        'Fn::Join': [
          '',
          [
            // eslint-disable-next-line max-len
            '{"widgets":[{"type":"metric","width":10,"height":6,"x":0,"y":0,"properties":{"view":"timeSeries","title":"Requests","region":"',
            {
              Ref: 'AWS::Region',
            },
            '","metrics":[["AWS/ApiGateway","Count","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            '","Stage","acc",{"period":900,"stat":"Sum"}],["AWS/ApiGateway","4XXError","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            '","Stage","acc",{"period":900,"stat":"Sum"}],["AWS/ApiGateway","5XXError","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Stage","acc",{"period":900,"stat":"Sum"}]],"yAxis":{}}},{"type":"metric","width":10,"height":6,"x":10,"y":0,"properties":{"view":"timeSeries","title":"Latency","region":"',
            {
              Ref: 'AWS::Region',
            },
            '","metrics":[["AWS/ApiGateway","Latency","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            '","Stage","acc",{"period":900}],["AWS/ApiGateway","IntegrationLatency","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Stage","acc",{"period":900}]],"yAxis":{}}},{"type":"metric","width":10,"height":6,"x":0,"y":6,"properties":{"view":"timeSeries","title":"description1 - Requests","region":"',
            {
              Ref: 'AWS::Region',
            },
            '","metrics":[["AWS/ApiGateway","Count","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path1","Stage","acc",{"period":900,"stat":"Sum"}],["AWS/ApiGateway","4XXError","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path1","Stage","acc",{"period":900,"stat":"Sum"}],["AWS/ApiGateway","5XXError","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path1","Stage","acc",{"period":900,"stat":"Sum"}]],"yAxis":{}}},{"type":"metric","width":10,"height":6,"x":10,"y":6,"properties":{"view":"timeSeries","title":"description1 - Latency","region":"',
            {
              Ref: 'AWS::Region',
            },
            '","metrics":[["AWS/ApiGateway","Latency","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path1","Stage","acc",{"period":900}],["AWS/ApiGateway","IntegrationLatency","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path1","Stage","acc",{"period":900}]],"yAxis":{}}},{"type":"metric","width":10,"height":6,"x":0,"y":12,"properties":{"view":"timeSeries","title":"description2 - Requests","region":"',
            {
              Ref: 'AWS::Region',
            },
            '","metrics":[["AWS/ApiGateway","Count","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path2","Stage","acc",{"period":900,"stat":"Sum"}],["AWS/ApiGateway","4XXError","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path2","Stage","acc",{"period":900,"stat":"Sum"}],["AWS/ApiGateway","5XXError","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path2","Stage","acc",{"period":900,"stat":"Sum"}]],"yAxis":{}}},{"type":"metric","width":10,"height":6,"x":10,"y":12,"properties":{"view":"timeSeries","title":"description2 - Latency","region":"',
            {
              Ref: 'AWS::Region',
            },
            '","metrics":[["AWS/ApiGateway","Latency","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            // eslint-disable-next-line max-len
            '","Method","POST","Resource","/path2","Stage","acc",{"period":900}],["AWS/ApiGateway","IntegrationLatency","ApiName","',
            {
              'Fn::Sub': '${Application}-${Country}-${Environment}-${Project}-api',
            },
            '","Method","POST","Resource","/path2","Stage","acc",{"period":900}]],"yAxis":{}}}]}',
          ],
        ],
      },
    }));
  });

  it('Should be able to create the API definition with stage variables', () => {
    const stack = new Stack();
    stack.node.setContext('environment', 'dev');
    const properties: SpecRestApiGatewayProps = {
      ...commonProperties,
      variables: {
        Var1: 'some value',
        Var2: 'another value',
      },
    };
    new SpecRestApiGateway(stack, properties);
    awsExpect(stack).to(haveResource('AWS::ApiGateway::Stage', {
      RestApiId: {
        Ref: 'TestAPI',
      },
      DeploymentId: {
        Ref: `TestAPIDeployment${mockedDate}`,
      },
      StageName: 'acc',
      TracingEnabled: true,
      Variables: {
        Var1: 'some value',
        Var2: 'another value',
      },
    }));
  });
});
