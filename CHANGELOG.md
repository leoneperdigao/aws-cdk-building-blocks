# Changelog

All notable changes to this project will be documented in this file.

## [1.1.4] - 12-10-2020

### Fixed
- Specify route tables for CBSP VPC Subnets

## [1.1.3] - 12-10-2020

### Changed
- Bump CDK version
- Bump other modules

## [1.1.2] - 05-10-2020

### Changed
- Make lambda invokePermission property optional.

## [1.1.1] - 05-10-2020

### Changed
- Bump CDK version.

## [1.1.0] - 01-10-2020

### Changed
- Refactor naming conventions to classes, removing resource- prefix.

## [1.0.9] - 04-09-2020

### Fixed
- Fix typo on KMS Key type.

## [1.0.8] - 29-08-2020

### Changed
- Rename certificateSSMPath property to certificateArnSsmPath
- Make basePath optional in ResourceApi

### Fixed
- Fix .gitignore

## [1.0.7] - 29-08-2020

### Fixed
- Added DependsOn to log group subscription
- Availability tag setting value

## [1.0.6] - 29-08-2020

### Added
- Added invokePermission to LambdaDefinition
- Added optionals Availability, Billing code, Confidentiality and Integrity Tags

### Changed
- Changed deprecated ConstructNode.applyAspect to Aspects.of(construct).add(aspect)

## [1.0.5] - 29-08-2020

### Changed
- Remove all aws-sam references in favor of aws-lambda
- Improved support to custom vpc configuration
- Bump aws-cdk version to 1.61.1

## [1.0.4] - 27-08-2020

### Added
- Added optional executionRolePolicyStatements to LambdaDefinition

## [1.0.3] - 27-08-2020

### Fixed
- Added missing exported type to index file

## [1.0.2] - 27-08-2020

### Fixed
- Fix types path at package.json

## [1.0.1] - 27-08-2020

### Changed
- Change types path at package.json

## [0.0.1] - 26-08-2020

### Added
* SpecRestApiGateway
* LambdaFactory
* LambdaLayerFactory
* StackParameters
* ResourceTags

### Changed
*None*

### Removed
*None*

### Fixed
*None*

