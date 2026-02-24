import ModuleBuilder from '../src/ModuleBuilder';
import { ValueType } from '../src/types';

describe('Relaxed SIMD integration', () => {
  test('relaxed SIMD emitter method works', () => {
    const mod = new ModuleBuilder('test');
    mod.defineMemory(1);
    const fn = mod.defineFunction('test', ValueType.V128, [ValueType.V128, ValueType.V128], (f, asm) => {
      asm.get_local(f.getParameter(0));
      asm.get_local(f.getParameter(1));
      asm.relaxed_min_f32x4();
    });
    mod.exportFunction(fn);
    expect(() => mod.toBytes()).not.toThrow();
  });
});
