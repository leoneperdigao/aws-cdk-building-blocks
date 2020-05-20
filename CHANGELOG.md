# Change Log

## [2.3]

### Bug Fixes
*None*

### Features
* ResourceLambda: 
    * Removed commonLayers

### Breaking Changes
*None*

## [2.2]

### Bug Fixes
*None*

### Features
* ResourceLambda: 
    * Runtime upgraded to nodejs12.x

### Breaking Changes
* Projects stack resources unit tests might break

## [2.1]

### Bug Fixes
*None*

### Features
* ResourceLambda: 
    * Added GenericLambdaProperties
    * Removed autoPublish, create version and alias explicitely

### Breaking Changes
* All AWS-CDK dependencies were incremented to version 1.17.1
* ResourceLambda: 
    * GenericLambdaProperties needs to provided on constructor
    * API swagger definitions need to reference lambda alias by alias resource name

## [2.0]

### Bug Fixes
*None*

### Features
*None*

### Breaking Changes
* All AWS-CDK dependencies were incremented to version 1.12.0
* ResourceTopic: Fn.sub removed from topicName, will need to be provided if needed

## [1.2]

### Bug Fixes
* Add tags to API and KMS resources
* Fix API deployment to include unique name

### Features
* Add Cloudwatch Dashboard for API Gateway
* Add option to configure VPC to Lambda function
* Add filter policy to topic subscription

### Breaking Changes
*None*

## [1.1 and lower]

### Bug Fixes
* Add display name to topic resource

### Features
* Add DLQ option to lambdas

### Breaking Changes
* All AWS-CDK dependencies were incremented to version 1.5.0
