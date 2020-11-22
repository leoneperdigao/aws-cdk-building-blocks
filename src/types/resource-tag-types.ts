export interface ResourceTagProps {
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
