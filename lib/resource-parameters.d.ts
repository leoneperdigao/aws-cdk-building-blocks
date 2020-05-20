import { Construct } from '@aws-cdk/core';
/**
 * Builds the CFN template parameters, merging the mandatory parameters used
 * in the pipeline with the custom parameters in the project.
 */
export declare class ResourceParameters {
    private scope;
    private props;
    /**
     * Pipeline mandatory parameters
     */
    private defaultParameters;
    /**
     * Generates construct for the template parameters.
     * @param scope The parent construct
     * @param props Array of properties for the parameters to build
     */
    constructor(scope: Construct, props: ResourceParameterProperties[]);
    /**
     * Merges mandatory parameters with project custom parameters to create a
     * constructor of type CfnParamater
     */
    buildParameters(): void;
}
export interface ResourceParameterProperties {
    /**
     * Name of the parameter
     */
    name: string;
    /**
     * Given type for the parameter. Default value is 'String'
     */
    type?: string;
    /**
     * Optional default value assigned to the parameter
     */
    default?: any;
    /**
     * Optional description given to the parameter
     */
    description?: string;
    /**
     * Optional predefined list of values the parameter can take
     */
    allowedValues?: any;
}
