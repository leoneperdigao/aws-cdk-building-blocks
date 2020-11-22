import { expect, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import { Stack } from '@aws-cdk/core';
import { StackParameters } from '../src';
import { StackParameterProps } from '../src/types';

describe('Parameters Resource', () => {
  it('should be able to add Parameters to the template file', () => {
    const stack = new Stack();
    const parameters:StackParameterProps[] = [{
      name: 'Role',
      default: 'default-role',
    }, {
      name: 'LogLevel',
      type: 'String',
      default: 'INFO',
      allowedValues: ['INFO'],
      description: 'description of this parameter',
    }];

    new StackParameters(stack, parameters);

    expect(stack).to(matchTemplate({
      Parameters: {
        Application: {
          Type: 'String',
        },
        Project: {
          Type: 'String',
        },
        Country: {
          Type: 'String',
        },
        Environment: {
          Type: 'String',
        },
        Role: {
          Type: 'String',
          Default: 'default-role',
        },
        LogLevel: {
          Type: 'String',
          Default: 'INFO',
          AllowedValues: [
            'INFO',
          ],
          Description: 'description of this parameter',
        },
      },
    }, MatchStyle.EXACT));
  });
});
