import {
  ModuleBuilder,
  ValueType,
} from '../src/index';
import InitExpressionEmitter from '../src/InitExpressionEmitter';
import { InitExpressionType } from '../src/types';
import OpCodes from '../src/OpCodes';

describe('InitExpressionEmitter', () => {
  test('getParameter throws', () => {
    const emitter = new InitExpressionEmitter(InitExpressionType.Global, ValueType.Int32);
    expect(() => emitter.getParameter(0)).toThrow('does not have any parameters');
  });

  test('declareLocal throws', () => {
    const emitter = new InitExpressionEmitter(InitExpressionType.Global, ValueType.Int32);
    expect(() => emitter.declareLocal()).toThrow('cannot have locals');
  });

  test('unsupported opcode in init expression throws', () => {
    const emitter = new InitExpressionEmitter(InitExpressionType.Global, ValueType.Int32);
    expect(() => emitter.emit(OpCodes.i32_add)).toThrow('is not supported in an initializer expression');
  });

  test('second instruction after const must be end', () => {
    const emitter = new InitExpressionEmitter(InitExpressionType.Global, ValueType.Int32);
    emitter.emit(OpCodes.i32_const, 42);
    expect(() => emitter.emit(OpCodes.i32_const, 99)).toThrow('is not valid after init expression value');
  });

  test('get_global in element init expression throws', () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });
    const g = mod.defineGlobal(ValueType.Int32, false, 0);
    const emitter = new InitExpressionEmitter(InitExpressionType.Element, ValueType.Int32);
    expect(() => emitter.emit(OpCodes.get_global, g)).toThrow('global not supported');
  });

  test('get_global with non-GlobalBuilder throws', () => {
    const emitter = new InitExpressionEmitter(InitExpressionType.Global, ValueType.Int32);
    expect(() => emitter.emit(OpCodes.get_global, 'not a global')).toThrow('A global builder was expected');
  });

  test('get_global with mutable global throws', () => {
    const mod = new ModuleBuilder('test', { disableVerification: true });
    const g = mod.defineGlobal(ValueType.Int32, true, 0);
    const emitter = new InitExpressionEmitter(InitExpressionType.Global, ValueType.Int32);
    expect(() => emitter.emit(OpCodes.get_global, g)).toThrow('mutable global');
  });

  test('third instruction throws from base class (control enclosure closed)', () => {
    const emitter = new InitExpressionEmitter(InitExpressionType.Global, ValueType.Int32);
    emitter.emit(OpCodes.i32_const, 42);
    emitter.emit(OpCodes.end);
    // After end, the base class AssemblyEmitter throws
    expect(() => emitter.emit(OpCodes.nop)).toThrow('control enclosure has been closed');
  });
});
