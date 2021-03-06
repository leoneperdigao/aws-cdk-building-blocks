"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackParameters = void 0;
const core_1 = require("@aws-cdk/core");
/**
 * Builds the CFN template parameters, merging the mandatory parameters used
 * in the pipeline with the custom parameters in the project.
 */
class StackParameters {
    /**
     * Generates construct for the template parameters.
     * @param {Construct=} scope The parent construct
     * @param {StackParameterProps[]} props Array of properties for the parameters to build
     */
    constructor(scope, props) {
        this.scope = scope;
        this.props = props;
        /**
         * Pipeline mandatory parameters
         */
        this.defaultParameters = [{
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
        this.buildParameters();
    }
    /**
     * Merges mandatory parameters with project custom parameters to create a
     * constructor of type CfnParameter
     */
    buildParameters() {
        const allParams = this.defaultParameters.concat(this.props);
        allParams.forEach((param) => {
            new core_1.CfnParameter(this.scope, param.name, {
                type: param.type || 'String',
                default: param.default,
                description: param.description,
                allowedValues: param.allowedValues,
            });
        });
    }
}
exports.StackParameters = StackParameters;
