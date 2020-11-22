import { Construct, CfnParameter } from '@aws-cdk/core';
import { StackParameterProps } from './types/stack-parameters.types';

/**
 * Builds the CFN template parameters, merging the mandatory parameters used
 * in the pipeline with the custom parameters in the project.
 */
export class StackParameters {
  /**
   * Pipeline mandatory parameters
   */
  private defaultParameters: StackParameterProps[] = [{
    name: 'Application',
    type: 'String',
  }, {
    name: 'Project',
    type: 'String',
  }, {
    name: 'Country',
    type: 'String',
  }, {
    name: 'Environment',
    type: 'String',
  }];

  /**
   * Generates construct for the template parameters.
   * @param {Construct=} scope The parent construct
   * @param {StackParameterProps[]} props Array of properties for the parameters to build
   */
  constructor(private scope: Construct, private props: StackParameterProps[]) {
    this.buildParameters();
  }

  /**
   * Merges mandatory parameters with project custom parameters to create a
   * constructor of type CfnParameter
   */
  buildParameters(): void {
    const allParams: StackParameterProps[] = this.defaultParameters.concat(this.props);
    allParams.forEach((param) => {
      new CfnParameter(this.scope, param.name, {
        type: param.type || 'String',
        default: param.default,
        description: param.description,
        allowedValues: param.allowedValues,
      });
    });
  }
}
