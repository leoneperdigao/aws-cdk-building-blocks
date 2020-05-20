import { Construct, CfnParameter } from '@aws-cdk/core';

/**
 * Builds the CFN template parameters, merging the mandatory parameters used
 * in the pipeline with the custom parameters in the project.
 */
export class ResourceParameters {
  /**
   * Pipeline mandatory parameters
   */
  private defaultParameters: ResourceParameterProperties[] = [{
    name: 'Application',
    type: 'String'
  }, {
    name: 'Project',
    type: 'String'
  }, {
    name: 'Country',
    type: 'String'
  }, {
    name: 'Branch',
    type: 'String'
  }, {
    name: 'BranchPrefix',
    type: 'String'
  }, {
    name: 'Account',
    type: 'String'
  }, {
    name: 'Environment',
    type: 'String'
  }];

  /**
   * Generates construct for the template parameters.
   * @param scope The parent construct
   * @param props Array of properties for the parameters to build
   */
  constructor(private scope: Construct, private props: ResourceParameterProperties[]) {
    this.buildParameters();
  }

  /**
   * Merges mandatory parameters with project custom parameters to create a
   * constructor of type CfnParamater
   */
  buildParameters() {
    const allParams: ResourceParameterProperties[] = this.defaultParameters.concat(this.props);
    allParams.forEach(param => {
      new CfnParameter(this.scope, param.name, {
        type: param.type || 'String',
        default: param.default,
        description: param.description,
        allowedValues: param.allowedValues,
      })
    });
  }
}

export interface ResourceParameterProperties {
  /**
   * Name of the parameter
   */
  name: string,
  /**
   * Given type for the parameter. Default value is 'String'
   */
  type?: string,
  /**
   * Optional default value assigned to the parameter
   */
  default?: any,
  /**
   * Optional description given to the parameter
   */
  description?: string,
  /**
   * Optional predefined list of values the parameter can take
   */
  allowedValues?: any,
}
