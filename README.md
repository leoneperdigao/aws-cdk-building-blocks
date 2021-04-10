# AWS CDK Building Blocks

This repository contains useful building blocks focused on Serverless withing AWS

## Badges

![Coverage lines](./__tests__/.badges/badge-lines.svg)
![Coverage functions](./__tests__/.badges/badge-functions.svg)
![Coverage branches](./__tests__/.badges/badge-branches.svg)
![Coverage statements](./__tests__/.badges/badge-statements.svg)

> Note: to generate the badges, please run `npm run test:badges`.

## Project description

This repository aims to provide a common resource for building resources with certain configurations
which aligns with the standards and best practices from AWS CDK.

The usage of the AWS-CDK is limited to the creation of the template only and not
the entire deploy process to AWS. The reason for this is to align with the
existing pipeline process which takes the CloudFormation YAML file as part of the
deployment process.

### Useful building blocks

* Lambda factory with kinesis subscription
* API Gateway based on Swagger Specs, with dashboard
* Standard tags (can be extended)
* Standard Stack parameters (can be extended)


## Getting started
The resources from this repository are consumed by other repositories by 
referencing a specific branch from this repository. Each branch is named as a 
version number and shall not be mixed between them, except for **master** which 
holds the latest changes.

### Installation and Configuration

To install all the required modules, simply run `npm install`.
 
### Tests

To run the tests simply run `npm test`.

## Collaboration

For build and testing, the project is configured with Husky in order to perform
compilation and testing before allowing to push any changes to the remote 
repository. However the following needs to be taken into consideration:
* The compilation is required in order to generate the .js and d.ts files 
which are consumed by the target repository
* All resources must include the proper unit test which includes all the 
possibilities of configuration the resource can take
* All class, functions and interfaces must have the proper usage documentation 
for usage easiness of the target repository
* Any addition to the repository should be also documented on the CHANGELOG.md

## Compatibility

Nodejs 12.x or superior
 
## Build With

* Typescript
* AWS CDK
* Jest

