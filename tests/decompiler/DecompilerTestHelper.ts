import { ModuleBuilder, BinaryReader, ValueType, OpCodes, BlockType, ElementType } from '../../src/index';
import { decompileFunction, createNameResolver } from '../../src/decompiler/Decompiler';

export { ModuleBuilder, BinaryReader, ValueType, OpCodes, BlockType, ElementType };
export { decompileFunction, createNameResolver };

export function decompileLast(buildFunc: (mod: ModuleBuilder) => void, target: 'mvp' | 'latest' = 'latest'): string {
  const mod = new ModuleBuilder('test', { target, disableVerification: true });
  buildFunc(mod);
  const bytes = mod.toBytes();
  const info = new BinaryReader(new Uint8Array(bytes)).read();
  const resolver = createNameResolver(info);
  return decompileFunction(info, info.functions.length - 1, resolver);
}

export function expectDecompiles(buildFunc: (mod: ModuleBuilder) => void): string {
  const output = decompileLast(buildFunc);
  expect(output).not.toContain('Decompilation failed');
  return output;
}
