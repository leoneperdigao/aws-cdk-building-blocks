"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@aws-cdk/core");
/**
 * Takes properties defined the resource and create MRA resource tags
 */
class ResourceTags {
    /**
     * Creates a new Resource of type Tags
     * @param properties Resource to be tagged properties
     */
    constructor(properties) {
        this.properties = properties;
        this.tags = {};
        this.buildTags();
    }
    buildTags() {
        this.tags['OpCo'] = 'df';
        this.tags['Owner'] = 'df-operations@company.com';
        this.tags['Dtap'] = core_1.Fn.sub('${Account}');
        this.tags['Creator'] = 'df-operations@company.com';
        this.tags['Technology'] = this.properties.technology;
        this.tags['Application'] = core_1.Fn.sub('${Application}');
        this.tags['Ec2ctl'] = 'n/a';
        this.tags['Description'] = this.properties.description;
        this.tags['Name'] = this.properties.name;
    }
    /**
     * Takes the list of resource tags previously created and returns them as
     * a Map being both Key and Value of type String
     * @returns Map with tags in the form of key-value of type String
     */
    getTagsAsMap() {
        return this.tags;
    }
    /**
     * Takes the list of resource tags previously created and returns them as
     * an array of type CDK Tag
     * @returns array of CDK Tag
     */
    getTagsAsCdkTags() {
        const cdkTags = [];
        for (const key in this.tags) {
            if (this.tags.hasOwnProperty(key)) {
                cdkTags.push(new core_1.Tag(key, this.tags[key]));
            }
        }
        return cdkTags;
    }
}
exports.ResourceTags = ResourceTags;
