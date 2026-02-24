/**
 * Describes an instruction's behavior regarding the label control flow stack.
 */
export enum ControlFlowType {
  Push = 'Push',
  Pop = 'Pop',
}

/**
 * Describes an instruction's behavior regarding the operand stack.
 */
export enum OperandStackBehavior {
  None = 'None',
  Push = 'Push',
  Pop = 'Pop',
  PopPush = 'PopPush',
}

/**
 * Operand stack type identifiers used for stack verification.
 */
export enum OperandStackType {
  Any = 'Any',
  Int32 = 'Int32',
  Int64 = 'Int64',
  Float32 = 'Float32',
  Float64 = 'Float64',
  V128 = 'V128',
  FuncRef = 'FuncRef',
  ExternRef = 'ExternRef',
  AnyRef = 'AnyRef',
  EqRef = 'EqRef',
  I31Ref = 'I31Ref',
  StructRef = 'StructRef',
  ArrayRef = 'ArrayRef',
}
