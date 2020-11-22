import { Construct } from '@aws-cdk/core';
import { StackParameterProps } from './types/stack-parameters.types';
/**
 * Builds the CFN template parameters, merging the mandatory parameters used
 * in the pipeline with the custom parameters in the project.
 */
export declare class StackParameters {
    private scope;
    private props;
    /**
     * Pipeline mandatory parameters
     */
    private defaultParameters;
    /**
     * Generates construct for the template parameters.
     * @param {Construct=} scope The parent construct
     * @param {StackParameterProps[]} props Array of properties for the parameters to build
     */
    constructor(scope: Construct, props: StackParameterProps[]);
    /**
     * Merges mandatory parameters with project custom parameters to create a
     * constructor of type CfnParameter
     */
    buildParameters(): void;
}
