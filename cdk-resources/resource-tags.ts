import { Fn, Tag } from '@aws-cdk/core';

/**
 * Takes properties defined the resource and create MRA resource tags
 */
export class ResourceTags {
  private tags: { [key: string]: string } = {};

  /**
   * Creates a new Resource of type Tags
   * @param properties Resource to be tagged properties
   */
  constructor(private properties: ResourceTagsProps) {
    this.buildTags();
  }

  private buildTags() {
    this.tags['OpCo'] = 'df';
    this.tags['Owner'] = 'df-operations@company.com';
    this.tags['Dtap'] = Fn.sub('${Account}');
    this.tags['Creator'] = 'df-operations@company.com';
    this.tags['Technology'] = this.properties.technology;
    this.tags['Application'] = Fn.sub('${Application}');
    this.tags['Ec2ctl'] = 'n/a';
    this.tags['Description'] = this.properties.description;
    this.tags['Name'] = this.properties.name;
  }

  /**
   * Takes the list of resource tags previously created and returns them as
   * a Map being both Key and Value of type String
   * @returns Map with tags in the form of key-value of type String
   */
  public getTagsAsMap(): { [key: string]: string } {
    return this.tags;
  }

  /**
   * Takes the list of resource tags previously created and returns them as
   * an array of type CDK Tag
   * @returns array of CDK Tag
   */
  public getTagsAsCdkTags(): Tag[] {
    const cdkTags = [];
    for (const key in this.tags) {
      if (this.tags.hasOwnProperty(key)) {
        cdkTags.push(new Tag(key, this.tags[key]));
      }
    }
    return cdkTags;
  }
}

export interface ResourceTagsProps {
  /**
   * Name of the resource being tagged
   */
  readonly name: string,
  /**
   * Short description of the resource being tagged
   */
  readonly description: string,
  /**
   * Which AWS technology it is (i.e. SNS, Lambda, DynamoDB)
   */
  readonly technology: string,
}
