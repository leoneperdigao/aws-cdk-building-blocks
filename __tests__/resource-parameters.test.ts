import { expect, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';

import { ResourceParameters, ResourceParameterProperties } from '../cdk-resources/resource-parameters';

describe('Parameters Resource', () => {
  test('should be able to add Parameters to the template file', () => {
    const stack = new Stack();
    const parameters: ResourceParameterProperties[] = [{
      name: 'Role',
      default: 'default-role'
    }, {
      name: 'LogLevel',
      type: 'String',
      default: 'INFO',
      allowedValues: ['INFO'],
      description: 'description of this parameter'
    }]; 

    new ResourceParameters(stack, parameters);

    expect(stack).to(matchTemplate({
      Parameters: {
        Application: {
          Type: 'String'
        },
        Project: {
          Type: 'String'
        },
        Country: {
          Type: 'String'
        },
        Branch: {
          Type: 'String'
        },
        BranchPrefix: {
          Type: 'String'
        },
        Account: {
          Type: 'String'
        },
        Environment: {
          Type: 'String'
        },
        Role: {
          Type: 'String',
          Default: 'default-role'
        },
        LogLevel: {
          Type: 'String',
          Default: 'INFO',
          AllowedValues: ['INFO'],
          Description: 'description of this parameter'
        }
      }
    }, MatchStyle.EXACT));
  });
});
