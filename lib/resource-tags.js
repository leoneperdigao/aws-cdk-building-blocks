"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceTags = void 0;
const core_1 = require("@aws-cdk/core");
/**
 * Takes properties defined the resource and create resource tags
 */
class ResourceTags {
    /**
     * Creates a new Resource of type Tags
     * @param {ResourceTagProps=} properties Resource to be tagged properties
     */
    constructor(properties) {
        this.properties = properties;
        this.tags = {};
        this.buildTags();
    }
    /**
     * @summary Builds default tags
     */
    buildTags() {
        this.tags.Application = core_1.Fn.sub('${Application}');
        this.tags.Description = this.properties.description;
        this.tags.Environment = core_1.Fn.sub('${Environment}');
        this.tags.Name = this.properties.name;
        this.tags.Technology = this.properties.technology;
    }
    /**
     * Takes the list of resource tags previously created and returns them as
     * a Map being both Key and Value of type String
     * @return Map with tags in the form of key-value of type String
     */
    getTagsAsMap() {
        return this.tags;
    }
    /**
     * Takes the list of resource tags previously created and returns them as
     * an array of type CDK Tag
     * @return {Tag[]} array of CDK Tag
     */
    getTagsAsCdkTags() {
        const cdkTags = [];
        for (const key of Object.keys(this.tags)) {
            cdkTags.push(new core_1.Tag(key, this.tags[key]));
        }
        return cdkTags;
    }
}
exports.ResourceTags = ResourceTags;
