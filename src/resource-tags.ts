import { Fn, Tag } from '@aws-cdk/core';
import { ResourceTagProps } from './types/resource-tag-types';

/**
 * Takes properties defined the resource and create resource tags
 */
export class ResourceTags {
  private tags: { [key: string]: string } = {};

  /**
   * Creates a new Resource of type Tags
   * @param {ResourceTagProps=} properties Resource to be tagged properties
   */
  constructor(private readonly properties: ResourceTagProps) {
    this.buildTags();
  }

  /**
   * @summary Builds default tags
   */
  private buildTags(): void {
    this.tags.Application = Fn.sub('${Application}');
    this.tags.Description = this.properties.description;
    this.tags.Environment = Fn.sub('${Environment}');
    this.tags.Name = this.properties.name;
    this.tags.Technology = this.properties.technology;
  }

  /**
   * Takes the list of resource tags previously created and returns them as
   * a Map being both Key and Value of type String
   * @return Map with tags in the form of key-value of type String
   */
  public getTagsAsMap(): { [key: string]: string } {
    return this.tags;
  }

  /**
   * Takes the list of resource tags previously created and returns them as
   * an array of type CDK Tag
   * @return {Tag[]} array of CDK Tag
   */
  public getTagsAsCdkTags(): Tag[] {
    const cdkTags = [];
    for (const key of Object.keys(this.tags)) {
      cdkTags.push(new Tag(key, this.tags[key]));
    }
    return cdkTags;
  }
}
