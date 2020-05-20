# MRA AWS CDK

This repository contains custom build/constructs used along other projects.

All MRA features are built using AWS CDK for constructing the CloudFormation 
template, and this repository serves as a common resource for building resources
with certain configurations which aligns with the standars and practices from 
Diemen team.

The usage of the AWS-CDK is limited to the creation of the template only and not
the entire deploy process to AWS. The reason for this is to align with the
Diemen pipeline process which takes the CloudFormation YAML file as part of the
deployment process.

## Usage
The resources from this repository are consumed by other MRA repositories by 
referencing a specific branch from this repository. Each branch is named as a 
version number and shall not be mixed between them, except for **master** which 
holds the latest changes.

In order to use these resources, the target repository must reference this as a 
package.json dev dependency:

**Note:** Since this dependency is not managed by NPM registry, any update of the 
resources are refreshed on *npm install* but instead, the folder *node_modules* 
must be deleted before installing the packages; otherwise, the code might be 
outdated.

## Collaboration
For branching strategy this rules should be followed:
* Bug fix or non breaking feature, can be added to the current branch version
* Breaking changes or new resources added, should go on the next minor version 
increment. (i.e. v1.1 -> v1.2)
* Increment of AWS-CDK project dependencies, should go on the next major 
version increment. (i.e. v1.3 -> v2.0)

For build and testing, the project is configured with Husky in order to perform
transpilation and testing before allowing to push any changes to the remote 
repository. However the following needs to be taken into consideration:
* The transpilation is required in order to generate the .js and d.ts files 
which are consumed by the target repository
* All resources must include the proper unit test which includes all the 
possibilities of configuration the resource can take
* All class, functions and interfaces must have the proper usage documentation 
for usage easiness of the target repository
* Any addition to the repository should be also documented on the CHANGELOG.md
