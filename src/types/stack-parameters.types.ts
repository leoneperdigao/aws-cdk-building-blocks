export interface StackParameterProps {
  /**
   * Name of the parameter
   */
  name: string,
  /**
   * Given type for the parameter. Default value is 'String'
   */
  type?: string,
  /**
   * Optional default value assigned to the parameter
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any,
  /**
   * Optional description given to the parameter
   */
  description?: string,
  /**
   * Optional predefined list of values the parameter can take
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allowedValues?: any,
}
