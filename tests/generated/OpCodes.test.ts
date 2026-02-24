// AUTO-GENERATED — do not edit. Run `npm run generate` to regenerate.
import OpCodes from '../../src/OpCodes';
import OpCodeEmitter from '../../src/OpCodeEmitter';

describe('OpCode definitions', () => {
  test('total opcode count is 562', () => {
    expect(Object.keys(OpCodes).length).toBe(562);
  });

  describe('control-flow', () => {
    test('unreachable', () => {
      const op = (OpCodes as any).unreachable;
      expect(op).toBeDefined();
      expect(op.value).toBe(0);
      expect(op.mnemonic).toBe("unreachable");
    });

    test('nop', () => {
      const op = (OpCodes as any).nop;
      expect(op).toBeDefined();
      expect(op.value).toBe(1);
      expect(op.mnemonic).toBe("nop");
    });

    test('block', () => {
      const op = (OpCodes as any).block;
      expect(op).toBeDefined();
      expect(op.value).toBe(2);
      expect(op.mnemonic).toBe("block");
    });

    test('loop', () => {
      const op = (OpCodes as any).loop;
      expect(op).toBeDefined();
      expect(op.value).toBe(3);
      expect(op.mnemonic).toBe("loop");
    });

    test('if', () => {
      const op = (OpCodes as any).if;
      expect(op).toBeDefined();
      expect(op.value).toBe(4);
      expect(op.mnemonic).toBe("if");
    });

    test('else', () => {
      const op = (OpCodes as any).else;
      expect(op).toBeDefined();
      expect(op.value).toBe(5);
      expect(op.mnemonic).toBe("else");
    });

    test('end', () => {
      const op = (OpCodes as any).end;
      expect(op).toBeDefined();
      expect(op.value).toBe(11);
      expect(op.mnemonic).toBe("end");
    });

    test('br', () => {
      const op = (OpCodes as any).br;
      expect(op).toBeDefined();
      expect(op.value).toBe(12);
      expect(op.mnemonic).toBe("br");
    });

    test('br_if', () => {
      const op = (OpCodes as any).br_if;
      expect(op).toBeDefined();
      expect(op.value).toBe(13);
      expect(op.mnemonic).toBe("br_if");
    });

    test('br_table', () => {
      const op = (OpCodes as any).br_table;
      expect(op).toBeDefined();
      expect(op.value).toBe(14);
      expect(op.mnemonic).toBe("br_table");
    });

    test('return', () => {
      const op = (OpCodes as any).return;
      expect(op).toBeDefined();
      expect(op.value).toBe(15);
      expect(op.mnemonic).toBe("return");
    });

  });

  describe('exception-handling', () => {
    test('try', () => {
      const op = (OpCodes as any).try;
      expect(op).toBeDefined();
      expect(op.value).toBe(6);
      expect(op.mnemonic).toBe("try");
      expect(op.feature).toBe("exception-handling");
    });

    test('catch', () => {
      const op = (OpCodes as any).catch;
      expect(op).toBeDefined();
      expect(op.value).toBe(7);
      expect(op.mnemonic).toBe("catch");
      expect(op.feature).toBe("exception-handling");
    });

    test('throw', () => {
      const op = (OpCodes as any).throw;
      expect(op).toBeDefined();
      expect(op.value).toBe(8);
      expect(op.mnemonic).toBe("throw");
      expect(op.feature).toBe("exception-handling");
    });

    test('rethrow', () => {
      const op = (OpCodes as any).rethrow;
      expect(op).toBeDefined();
      expect(op.value).toBe(9);
      expect(op.mnemonic).toBe("rethrow");
      expect(op.feature).toBe("exception-handling");
    });

    test('delegate', () => {
      const op = (OpCodes as any).delegate;
      expect(op).toBeDefined();
      expect(op.value).toBe(24);
      expect(op.mnemonic).toBe("delegate");
      expect(op.feature).toBe("exception-handling");
    });

    test('catch_all', () => {
      const op = (OpCodes as any).catch_all;
      expect(op).toBeDefined();
      expect(op.value).toBe(25);
      expect(op.mnemonic).toBe("catch_all");
      expect(op.feature).toBe("exception-handling");
    });

  });

  describe('call', () => {
    test('call', () => {
      const op = (OpCodes as any).call;
      expect(op).toBeDefined();
      expect(op.value).toBe(16);
      expect(op.mnemonic).toBe("call");
    });

    test('call_indirect', () => {
      const op = (OpCodes as any).call_indirect;
      expect(op).toBeDefined();
      expect(op.value).toBe(17);
      expect(op.mnemonic).toBe("call_indirect");
    });

    test('return_call', () => {
      const op = (OpCodes as any).return_call;
      expect(op).toBeDefined();
      expect(op.value).toBe(18);
      expect(op.mnemonic).toBe("return_call");
      expect(op.feature).toBe("tail-call");
    });

    test('return_call_indirect', () => {
      const op = (OpCodes as any).return_call_indirect;
      expect(op).toBeDefined();
      expect(op.value).toBe(19);
      expect(op.mnemonic).toBe("return_call_indirect");
      expect(op.feature).toBe("tail-call");
    });

  });

  describe('parametric', () => {
    test('drop', () => {
      const op = (OpCodes as any).drop;
      expect(op).toBeDefined();
      expect(op.value).toBe(26);
      expect(op.mnemonic).toBe("drop");
    });

    test('select', () => {
      const op = (OpCodes as any).select;
      expect(op).toBeDefined();
      expect(op.value).toBe(27);
      expect(op.mnemonic).toBe("select");
    });

  });

  describe('variable', () => {
    test('get_local', () => {
      const op = (OpCodes as any).get_local;
      expect(op).toBeDefined();
      expect(op.value).toBe(32);
      expect(op.mnemonic).toBe("local.get");
    });

    test('set_local', () => {
      const op = (OpCodes as any).set_local;
      expect(op).toBeDefined();
      expect(op.value).toBe(33);
      expect(op.mnemonic).toBe("local.set");
    });

    test('tee_local', () => {
      const op = (OpCodes as any).tee_local;
      expect(op).toBeDefined();
      expect(op.value).toBe(34);
      expect(op.mnemonic).toBe("local.tee");
    });

    test('get_global', () => {
      const op = (OpCodes as any).get_global;
      expect(op).toBeDefined();
      expect(op.value).toBe(35);
      expect(op.mnemonic).toBe("global.get");
    });

    test('set_global', () => {
      const op = (OpCodes as any).set_global;
      expect(op).toBeDefined();
      expect(op.value).toBe(36);
      expect(op.mnemonic).toBe("global.set");
    });

  });

  describe('memory', () => {
    test('i32_load', () => {
      const op = (OpCodes as any).i32_load;
      expect(op).toBeDefined();
      expect(op.value).toBe(40);
      expect(op.mnemonic).toBe("i32.load");
    });

    test('i64_load', () => {
      const op = (OpCodes as any).i64_load;
      expect(op).toBeDefined();
      expect(op.value).toBe(41);
      expect(op.mnemonic).toBe("i64.load");
    });

    test('f32_load', () => {
      const op = (OpCodes as any).f32_load;
      expect(op).toBeDefined();
      expect(op.value).toBe(42);
      expect(op.mnemonic).toBe("f32.load");
    });

    test('f64_load', () => {
      const op = (OpCodes as any).f64_load;
      expect(op).toBeDefined();
      expect(op.value).toBe(43);
      expect(op.mnemonic).toBe("f64.load");
    });

    test('i32_load8_s', () => {
      const op = (OpCodes as any).i32_load8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(44);
      expect(op.mnemonic).toBe("i32.load8_s");
    });

    test('i32_load8_u', () => {
      const op = (OpCodes as any).i32_load8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(45);
      expect(op.mnemonic).toBe("i32.load8_u");
    });

    test('i32_load16_s', () => {
      const op = (OpCodes as any).i32_load16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(46);
      expect(op.mnemonic).toBe("i32.load16_s");
    });

    test('i32_load16_u', () => {
      const op = (OpCodes as any).i32_load16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(47);
      expect(op.mnemonic).toBe("i32.load16_u");
    });

    test('i64_load8_s', () => {
      const op = (OpCodes as any).i64_load8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(48);
      expect(op.mnemonic).toBe("i64.load8_s");
    });

    test('i64_load8_u', () => {
      const op = (OpCodes as any).i64_load8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(49);
      expect(op.mnemonic).toBe("i64.load8_u");
    });

    test('i64_load16_s', () => {
      const op = (OpCodes as any).i64_load16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(50);
      expect(op.mnemonic).toBe("i64.load16_s");
    });

    test('i64_load16_u', () => {
      const op = (OpCodes as any).i64_load16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(51);
      expect(op.mnemonic).toBe("i64.load16_u");
    });

    test('i64_load32_s', () => {
      const op = (OpCodes as any).i64_load32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(52);
      expect(op.mnemonic).toBe("i64.load32_s");
    });

    test('i64_load32_u', () => {
      const op = (OpCodes as any).i64_load32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(53);
      expect(op.mnemonic).toBe("i64.load32_u");
    });

    test('i32_store', () => {
      const op = (OpCodes as any).i32_store;
      expect(op).toBeDefined();
      expect(op.value).toBe(54);
      expect(op.mnemonic).toBe("i32.store");
    });

    test('i64_store', () => {
      const op = (OpCodes as any).i64_store;
      expect(op).toBeDefined();
      expect(op.value).toBe(55);
      expect(op.mnemonic).toBe("i64.store");
    });

    test('f32_store', () => {
      const op = (OpCodes as any).f32_store;
      expect(op).toBeDefined();
      expect(op.value).toBe(56);
      expect(op.mnemonic).toBe("f32.store");
    });

    test('f64_store', () => {
      const op = (OpCodes as any).f64_store;
      expect(op).toBeDefined();
      expect(op.value).toBe(57);
      expect(op.mnemonic).toBe("f64.store");
    });

    test('i32_store8', () => {
      const op = (OpCodes as any).i32_store8;
      expect(op).toBeDefined();
      expect(op.value).toBe(58);
      expect(op.mnemonic).toBe("i32.store8");
    });

    test('i32_store16', () => {
      const op = (OpCodes as any).i32_store16;
      expect(op).toBeDefined();
      expect(op.value).toBe(59);
      expect(op.mnemonic).toBe("i32.store16");
    });

    test('i64_store8', () => {
      const op = (OpCodes as any).i64_store8;
      expect(op).toBeDefined();
      expect(op.value).toBe(60);
      expect(op.mnemonic).toBe("i64.store8");
    });

    test('i64_store16', () => {
      const op = (OpCodes as any).i64_store16;
      expect(op).toBeDefined();
      expect(op.value).toBe(61);
      expect(op.mnemonic).toBe("i64.store16");
    });

    test('i64_store32', () => {
      const op = (OpCodes as any).i64_store32;
      expect(op).toBeDefined();
      expect(op.value).toBe(62);
      expect(op.mnemonic).toBe("i64.store32");
    });

    test('mem_size', () => {
      const op = (OpCodes as any).mem_size;
      expect(op).toBeDefined();
      expect(op.value).toBe(63);
      expect(op.mnemonic).toBe("memory.size");
    });

    test('mem_grow', () => {
      const op = (OpCodes as any).mem_grow;
      expect(op).toBeDefined();
      expect(op.value).toBe(64);
      expect(op.mnemonic).toBe("memory.grow");
    });

  });

  describe('constant', () => {
    test('i32_const', () => {
      const op = (OpCodes as any).i32_const;
      expect(op).toBeDefined();
      expect(op.value).toBe(65);
      expect(op.mnemonic).toBe("i32.const");
    });

    test('i64_const', () => {
      const op = (OpCodes as any).i64_const;
      expect(op).toBeDefined();
      expect(op.value).toBe(66);
      expect(op.mnemonic).toBe("i64.const");
    });

    test('f32_const', () => {
      const op = (OpCodes as any).f32_const;
      expect(op).toBeDefined();
      expect(op.value).toBe(67);
      expect(op.mnemonic).toBe("f32.const");
    });

    test('f64_const', () => {
      const op = (OpCodes as any).f64_const;
      expect(op).toBeDefined();
      expect(op.value).toBe(68);
      expect(op.mnemonic).toBe("f64.const");
    });

  });

  describe('i32-comparison', () => {
    test('i32_eqz', () => {
      const op = (OpCodes as any).i32_eqz;
      expect(op).toBeDefined();
      expect(op.value).toBe(69);
      expect(op.mnemonic).toBe("i32.eqz");
    });

    test('i32_eq', () => {
      const op = (OpCodes as any).i32_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(70);
      expect(op.mnemonic).toBe("i32.eq");
    });

    test('i32_ne', () => {
      const op = (OpCodes as any).i32_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(71);
      expect(op.mnemonic).toBe("i32.ne");
    });

    test('i32_lt_s', () => {
      const op = (OpCodes as any).i32_lt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(72);
      expect(op.mnemonic).toBe("i32.lt_s");
    });

    test('i32_lt_u', () => {
      const op = (OpCodes as any).i32_lt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(73);
      expect(op.mnemonic).toBe("i32.lt_u");
    });

    test('i32_gt_s', () => {
      const op = (OpCodes as any).i32_gt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(74);
      expect(op.mnemonic).toBe("i32.gt_s");
    });

    test('i32_gt_u', () => {
      const op = (OpCodes as any).i32_gt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(75);
      expect(op.mnemonic).toBe("i32.gt_u");
    });

    test('i32_le_s', () => {
      const op = (OpCodes as any).i32_le_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(76);
      expect(op.mnemonic).toBe("i32.le_s");
    });

    test('i32_le_u', () => {
      const op = (OpCodes as any).i32_le_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(77);
      expect(op.mnemonic).toBe("i32.le_u");
    });

    test('i32_ge_s', () => {
      const op = (OpCodes as any).i32_ge_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(78);
      expect(op.mnemonic).toBe("i32.ge_s");
    });

    test('i32_ge_u', () => {
      const op = (OpCodes as any).i32_ge_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(79);
      expect(op.mnemonic).toBe("i32.ge_u");
    });

  });

  describe('i64-comparison', () => {
    test('i64_eqz', () => {
      const op = (OpCodes as any).i64_eqz;
      expect(op).toBeDefined();
      expect(op.value).toBe(80);
      expect(op.mnemonic).toBe("i64.eqz");
    });

    test('i64_eq', () => {
      const op = (OpCodes as any).i64_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(81);
      expect(op.mnemonic).toBe("i64.eq");
    });

    test('i64_ne', () => {
      const op = (OpCodes as any).i64_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(82);
      expect(op.mnemonic).toBe("i64.ne");
    });

    test('i64_lt_s', () => {
      const op = (OpCodes as any).i64_lt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(83);
      expect(op.mnemonic).toBe("i64.lt_s");
    });

    test('i64_lt_u', () => {
      const op = (OpCodes as any).i64_lt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(84);
      expect(op.mnemonic).toBe("i64.lt_u");
    });

    test('i64_gt_s', () => {
      const op = (OpCodes as any).i64_gt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(85);
      expect(op.mnemonic).toBe("i64.gt_s");
    });

    test('i64_gt_u', () => {
      const op = (OpCodes as any).i64_gt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(86);
      expect(op.mnemonic).toBe("i64.gt_u");
    });

    test('i64_le_s', () => {
      const op = (OpCodes as any).i64_le_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(87);
      expect(op.mnemonic).toBe("i64.le_s");
    });

    test('i64_le_u', () => {
      const op = (OpCodes as any).i64_le_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(88);
      expect(op.mnemonic).toBe("i64.le_u");
    });

    test('i64_ge_s', () => {
      const op = (OpCodes as any).i64_ge_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(89);
      expect(op.mnemonic).toBe("i64.ge_s");
    });

    test('i64_ge_u', () => {
      const op = (OpCodes as any).i64_ge_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(90);
      expect(op.mnemonic).toBe("i64.ge_u");
    });

  });

  describe('f32-comparison', () => {
    test('f32_eq', () => {
      const op = (OpCodes as any).f32_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(91);
      expect(op.mnemonic).toBe("f32.eq");
    });

    test('f32_ne', () => {
      const op = (OpCodes as any).f32_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(92);
      expect(op.mnemonic).toBe("f32.ne");
    });

    test('f32_lt', () => {
      const op = (OpCodes as any).f32_lt;
      expect(op).toBeDefined();
      expect(op.value).toBe(93);
      expect(op.mnemonic).toBe("f32.lt");
    });

    test('f32_gt', () => {
      const op = (OpCodes as any).f32_gt;
      expect(op).toBeDefined();
      expect(op.value).toBe(94);
      expect(op.mnemonic).toBe("f32.gt");
    });

    test('f32_le', () => {
      const op = (OpCodes as any).f32_le;
      expect(op).toBeDefined();
      expect(op.value).toBe(95);
      expect(op.mnemonic).toBe("f32.le");
    });

    test('f32_ge', () => {
      const op = (OpCodes as any).f32_ge;
      expect(op).toBeDefined();
      expect(op.value).toBe(96);
      expect(op.mnemonic).toBe("f32.ge");
    });

  });

  describe('f64-comparison', () => {
    test('f64_eq', () => {
      const op = (OpCodes as any).f64_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(97);
      expect(op.mnemonic).toBe("f64.eq");
    });

    test('f64_ne', () => {
      const op = (OpCodes as any).f64_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(98);
      expect(op.mnemonic).toBe("f64.ne");
    });

    test('f64_lt', () => {
      const op = (OpCodes as any).f64_lt;
      expect(op).toBeDefined();
      expect(op.value).toBe(99);
      expect(op.mnemonic).toBe("f64.lt");
    });

    test('f64_gt', () => {
      const op = (OpCodes as any).f64_gt;
      expect(op).toBeDefined();
      expect(op.value).toBe(100);
      expect(op.mnemonic).toBe("f64.gt");
    });

    test('f64_le', () => {
      const op = (OpCodes as any).f64_le;
      expect(op).toBeDefined();
      expect(op.value).toBe(101);
      expect(op.mnemonic).toBe("f64.le");
    });

    test('f64_ge', () => {
      const op = (OpCodes as any).f64_ge;
      expect(op).toBeDefined();
      expect(op.value).toBe(102);
      expect(op.mnemonic).toBe("f64.ge");
    });

  });

  describe('i32-bitwise', () => {
    test('i32_clz', () => {
      const op = (OpCodes as any).i32_clz;
      expect(op).toBeDefined();
      expect(op.value).toBe(103);
      expect(op.mnemonic).toBe("i32.clz");
    });

    test('i32_ctz', () => {
      const op = (OpCodes as any).i32_ctz;
      expect(op).toBeDefined();
      expect(op.value).toBe(104);
      expect(op.mnemonic).toBe("i32.ctz");
    });

    test('i32_popcnt', () => {
      const op = (OpCodes as any).i32_popcnt;
      expect(op).toBeDefined();
      expect(op.value).toBe(105);
      expect(op.mnemonic).toBe("i32.popcnt");
    });

    test('i32_and', () => {
      const op = (OpCodes as any).i32_and;
      expect(op).toBeDefined();
      expect(op.value).toBe(113);
      expect(op.mnemonic).toBe("i32.and");
    });

    test('i32_or', () => {
      const op = (OpCodes as any).i32_or;
      expect(op).toBeDefined();
      expect(op.value).toBe(114);
      expect(op.mnemonic).toBe("i32.or");
    });

    test('i32_xor', () => {
      const op = (OpCodes as any).i32_xor;
      expect(op).toBeDefined();
      expect(op.value).toBe(115);
      expect(op.mnemonic).toBe("i32.xor");
    });

    test('i32_shl', () => {
      const op = (OpCodes as any).i32_shl;
      expect(op).toBeDefined();
      expect(op.value).toBe(116);
      expect(op.mnemonic).toBe("i32.shl");
    });

    test('i32_shr_s', () => {
      const op = (OpCodes as any).i32_shr_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(117);
      expect(op.mnemonic).toBe("i32.shr_s");
    });

    test('i32_shr_u', () => {
      const op = (OpCodes as any).i32_shr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(118);
      expect(op.mnemonic).toBe("i32.shr_u");
    });

    test('i32_rotl', () => {
      const op = (OpCodes as any).i32_rotl;
      expect(op).toBeDefined();
      expect(op.value).toBe(119);
      expect(op.mnemonic).toBe("i32.rotl");
    });

    test('i32_rotr', () => {
      const op = (OpCodes as any).i32_rotr;
      expect(op).toBeDefined();
      expect(op.value).toBe(120);
      expect(op.mnemonic).toBe("i32.rotr");
    });

  });

  describe('i32-arithmetic', () => {
    test('i32_add', () => {
      const op = (OpCodes as any).i32_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(106);
      expect(op.mnemonic).toBe("i32.add");
    });

    test('i32_sub', () => {
      const op = (OpCodes as any).i32_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(107);
      expect(op.mnemonic).toBe("i32.sub");
    });

    test('i32_mul', () => {
      const op = (OpCodes as any).i32_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(108);
      expect(op.mnemonic).toBe("i32.mul");
    });

    test('i32_div_s', () => {
      const op = (OpCodes as any).i32_div_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(109);
      expect(op.mnemonic).toBe("i32.div_s");
    });

    test('i32_div_u', () => {
      const op = (OpCodes as any).i32_div_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(110);
      expect(op.mnemonic).toBe("i32.div_u");
    });

    test('i32_rem_s', () => {
      const op = (OpCodes as any).i32_rem_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(111);
      expect(op.mnemonic).toBe("i32.rem_s");
    });

    test('i32_rem_u', () => {
      const op = (OpCodes as any).i32_rem_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(112);
      expect(op.mnemonic).toBe("i32.rem_u");
    });

  });

  describe('i64-bitwise', () => {
    test('i64_clz', () => {
      const op = (OpCodes as any).i64_clz;
      expect(op).toBeDefined();
      expect(op.value).toBe(121);
      expect(op.mnemonic).toBe("i64.clz");
    });

    test('i64_ctz', () => {
      const op = (OpCodes as any).i64_ctz;
      expect(op).toBeDefined();
      expect(op.value).toBe(122);
      expect(op.mnemonic).toBe("i64.ctz");
    });

    test('i64_popcnt', () => {
      const op = (OpCodes as any).i64_popcnt;
      expect(op).toBeDefined();
      expect(op.value).toBe(123);
      expect(op.mnemonic).toBe("i64.popcnt");
    });

    test('i64_and', () => {
      const op = (OpCodes as any).i64_and;
      expect(op).toBeDefined();
      expect(op.value).toBe(131);
      expect(op.mnemonic).toBe("i64.and");
    });

    test('i64_or', () => {
      const op = (OpCodes as any).i64_or;
      expect(op).toBeDefined();
      expect(op.value).toBe(132);
      expect(op.mnemonic).toBe("i64.or");
    });

    test('i64_xor', () => {
      const op = (OpCodes as any).i64_xor;
      expect(op).toBeDefined();
      expect(op.value).toBe(133);
      expect(op.mnemonic).toBe("i64.xor");
    });

    test('i64_shl', () => {
      const op = (OpCodes as any).i64_shl;
      expect(op).toBeDefined();
      expect(op.value).toBe(134);
      expect(op.mnemonic).toBe("i64.shl");
    });

    test('i64_shr_s', () => {
      const op = (OpCodes as any).i64_shr_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(135);
      expect(op.mnemonic).toBe("i64.shr_s");
    });

    test('i64_shr_u', () => {
      const op = (OpCodes as any).i64_shr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(136);
      expect(op.mnemonic).toBe("i64.shr_u");
    });

    test('i64_rotl', () => {
      const op = (OpCodes as any).i64_rotl;
      expect(op).toBeDefined();
      expect(op.value).toBe(137);
      expect(op.mnemonic).toBe("i64.rotl");
    });

    test('i64_rotr', () => {
      const op = (OpCodes as any).i64_rotr;
      expect(op).toBeDefined();
      expect(op.value).toBe(138);
      expect(op.mnemonic).toBe("i64.rotr");
    });

  });

  describe('i64-arithmetic', () => {
    test('i64_add', () => {
      const op = (OpCodes as any).i64_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(124);
      expect(op.mnemonic).toBe("i64.add");
    });

    test('i64_sub', () => {
      const op = (OpCodes as any).i64_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(125);
      expect(op.mnemonic).toBe("i64.sub");
    });

    test('i64_mul', () => {
      const op = (OpCodes as any).i64_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(126);
      expect(op.mnemonic).toBe("i64.mul");
    });

    test('i64_div_s', () => {
      const op = (OpCodes as any).i64_div_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(127);
      expect(op.mnemonic).toBe("i64.div_s");
    });

    test('i64_div_u', () => {
      const op = (OpCodes as any).i64_div_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(128);
      expect(op.mnemonic).toBe("i64.div_u");
    });

    test('i64_rem_s', () => {
      const op = (OpCodes as any).i64_rem_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(129);
      expect(op.mnemonic).toBe("i64.rem_s");
    });

    test('i64_rem_u', () => {
      const op = (OpCodes as any).i64_rem_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(130);
      expect(op.mnemonic).toBe("i64.rem_u");
    });

  });

  describe('f32-arithmetic', () => {
    test('f32_abs', () => {
      const op = (OpCodes as any).f32_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(139);
      expect(op.mnemonic).toBe("f32.abs");
    });

    test('f32_neg', () => {
      const op = (OpCodes as any).f32_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(140);
      expect(op.mnemonic).toBe("f32.neg");
    });

    test('f32_ceil', () => {
      const op = (OpCodes as any).f32_ceil;
      expect(op).toBeDefined();
      expect(op.value).toBe(141);
      expect(op.mnemonic).toBe("f32.ceil");
    });

    test('f32_floor', () => {
      const op = (OpCodes as any).f32_floor;
      expect(op).toBeDefined();
      expect(op.value).toBe(142);
      expect(op.mnemonic).toBe("f32.floor");
    });

    test('f32_trunc', () => {
      const op = (OpCodes as any).f32_trunc;
      expect(op).toBeDefined();
      expect(op.value).toBe(143);
      expect(op.mnemonic).toBe("f32.trunc");
    });

    test('f32_nearest', () => {
      const op = (OpCodes as any).f32_nearest;
      expect(op).toBeDefined();
      expect(op.value).toBe(144);
      expect(op.mnemonic).toBe("f32.nearest");
    });

    test('f32_sqrt', () => {
      const op = (OpCodes as any).f32_sqrt;
      expect(op).toBeDefined();
      expect(op.value).toBe(145);
      expect(op.mnemonic).toBe("f32.sqrt");
    });

    test('f32_add', () => {
      const op = (OpCodes as any).f32_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(146);
      expect(op.mnemonic).toBe("f32.add");
    });

    test('f32_sub', () => {
      const op = (OpCodes as any).f32_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(147);
      expect(op.mnemonic).toBe("f32.sub");
    });

    test('f32_mul', () => {
      const op = (OpCodes as any).f32_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(148);
      expect(op.mnemonic).toBe("f32.mul");
    });

    test('f32_div', () => {
      const op = (OpCodes as any).f32_div;
      expect(op).toBeDefined();
      expect(op.value).toBe(149);
      expect(op.mnemonic).toBe("f32.div");
    });

    test('f32_min', () => {
      const op = (OpCodes as any).f32_min;
      expect(op).toBeDefined();
      expect(op.value).toBe(150);
      expect(op.mnemonic).toBe("f32.min");
    });

    test('f32_max', () => {
      const op = (OpCodes as any).f32_max;
      expect(op).toBeDefined();
      expect(op.value).toBe(151);
      expect(op.mnemonic).toBe("f32.max");
    });

    test('f32_copysign', () => {
      const op = (OpCodes as any).f32_copysign;
      expect(op).toBeDefined();
      expect(op.value).toBe(152);
      expect(op.mnemonic).toBe("f32.copysign");
    });

  });

  describe('f64-arithmetic', () => {
    test('f64_abs', () => {
      const op = (OpCodes as any).f64_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(153);
      expect(op.mnemonic).toBe("f64.abs");
    });

    test('f64_neg', () => {
      const op = (OpCodes as any).f64_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(154);
      expect(op.mnemonic).toBe("f64.neg");
    });

    test('f64_ceil', () => {
      const op = (OpCodes as any).f64_ceil;
      expect(op).toBeDefined();
      expect(op.value).toBe(155);
      expect(op.mnemonic).toBe("f64.ceil");
    });

    test('f64_floor', () => {
      const op = (OpCodes as any).f64_floor;
      expect(op).toBeDefined();
      expect(op.value).toBe(156);
      expect(op.mnemonic).toBe("f64.floor");
    });

    test('f64_trunc', () => {
      const op = (OpCodes as any).f64_trunc;
      expect(op).toBeDefined();
      expect(op.value).toBe(157);
      expect(op.mnemonic).toBe("f64.trunc");
    });

    test('f64_nearest', () => {
      const op = (OpCodes as any).f64_nearest;
      expect(op).toBeDefined();
      expect(op.value).toBe(158);
      expect(op.mnemonic).toBe("f64.nearest");
    });

    test('f64_sqrt', () => {
      const op = (OpCodes as any).f64_sqrt;
      expect(op).toBeDefined();
      expect(op.value).toBe(159);
      expect(op.mnemonic).toBe("f64.sqrt");
    });

    test('f64_add', () => {
      const op = (OpCodes as any).f64_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(160);
      expect(op.mnemonic).toBe("f64.add");
    });

    test('f64_sub', () => {
      const op = (OpCodes as any).f64_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(161);
      expect(op.mnemonic).toBe("f64.sub");
    });

    test('f64_mul', () => {
      const op = (OpCodes as any).f64_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(162);
      expect(op.mnemonic).toBe("f64.mul");
    });

    test('f64_div', () => {
      const op = (OpCodes as any).f64_div;
      expect(op).toBeDefined();
      expect(op.value).toBe(163);
      expect(op.mnemonic).toBe("f64.div");
    });

    test('f64_min', () => {
      const op = (OpCodes as any).f64_min;
      expect(op).toBeDefined();
      expect(op.value).toBe(164);
      expect(op.mnemonic).toBe("f64.min");
    });

    test('f64_max', () => {
      const op = (OpCodes as any).f64_max;
      expect(op).toBeDefined();
      expect(op.value).toBe(165);
      expect(op.mnemonic).toBe("f64.max");
    });

    test('f64_copysign', () => {
      const op = (OpCodes as any).f64_copysign;
      expect(op).toBeDefined();
      expect(op.value).toBe(166);
      expect(op.mnemonic).toBe("f64.copysign");
    });

  });

  describe('conversion', () => {
    test('i32_wrap_i64', () => {
      const op = (OpCodes as any).i32_wrap_i64;
      expect(op).toBeDefined();
      expect(op.value).toBe(167);
      expect(op.mnemonic).toBe("i32.wrap_i64");
    });

    test('i32_trunc_f32_s', () => {
      const op = (OpCodes as any).i32_trunc_f32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(168);
      expect(op.mnemonic).toBe("i32.trunc_f32_s");
    });

    test('i32_trunc_f32_u', () => {
      const op = (OpCodes as any).i32_trunc_f32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(169);
      expect(op.mnemonic).toBe("i32.trunc_f32_u");
    });

    test('i32_trunc_f64_s', () => {
      const op = (OpCodes as any).i32_trunc_f64_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(170);
      expect(op.mnemonic).toBe("i32.trunc_f64_s");
    });

    test('i32_trunc_f64_u', () => {
      const op = (OpCodes as any).i32_trunc_f64_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(171);
      expect(op.mnemonic).toBe("i32.trunc_f64_u");
    });

    test('i64_extend_i32_s', () => {
      const op = (OpCodes as any).i64_extend_i32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(172);
      expect(op.mnemonic).toBe("i64.extend_i32_s");
    });

    test('i64_extend_i32_u', () => {
      const op = (OpCodes as any).i64_extend_i32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(173);
      expect(op.mnemonic).toBe("i64.extend_i32_u");
    });

    test('i64_trunc_f32_s', () => {
      const op = (OpCodes as any).i64_trunc_f32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(174);
      expect(op.mnemonic).toBe("i64.trunc_f32_s");
    });

    test('i64_trunc_f32_u', () => {
      const op = (OpCodes as any).i64_trunc_f32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(175);
      expect(op.mnemonic).toBe("i64.trunc_f32_u");
    });

    test('i64_trunc_f64_s', () => {
      const op = (OpCodes as any).i64_trunc_f64_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(176);
      expect(op.mnemonic).toBe("i64.trunc_f64_s");
    });

    test('i64_trunc_f64_u', () => {
      const op = (OpCodes as any).i64_trunc_f64_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(177);
      expect(op.mnemonic).toBe("i64.trunc_f64_u");
    });

    test('f32_convert_i32_s', () => {
      const op = (OpCodes as any).f32_convert_i32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(178);
      expect(op.mnemonic).toBe("f32.convert_i32_s");
    });

    test('f32_convert_i32_u', () => {
      const op = (OpCodes as any).f32_convert_i32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(179);
      expect(op.mnemonic).toBe("f32.convert_i32_u");
    });

    test('f32_convert_i64_s', () => {
      const op = (OpCodes as any).f32_convert_i64_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(180);
      expect(op.mnemonic).toBe("f32.convert_i64_s");
    });

    test('f32_convert_i64_u', () => {
      const op = (OpCodes as any).f32_convert_i64_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(181);
      expect(op.mnemonic).toBe("f32.convert_i64_u");
    });

    test('f32_demote_f64', () => {
      const op = (OpCodes as any).f32_demote_f64;
      expect(op).toBeDefined();
      expect(op.value).toBe(182);
      expect(op.mnemonic).toBe("f32.demote_f64");
    });

    test('f64_convert_i32_s', () => {
      const op = (OpCodes as any).f64_convert_i32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(183);
      expect(op.mnemonic).toBe("f64.convert_i32_s");
    });

    test('f64_convert_i32_u', () => {
      const op = (OpCodes as any).f64_convert_i32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(184);
      expect(op.mnemonic).toBe("f64.convert_i32_u");
    });

    test('f64_convert_i64_s', () => {
      const op = (OpCodes as any).f64_convert_i64_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(185);
      expect(op.mnemonic).toBe("f64.convert_i64_s");
    });

    test('f64_convert_i64_u', () => {
      const op = (OpCodes as any).f64_convert_i64_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(186);
      expect(op.mnemonic).toBe("f64.convert_i64_u");
    });

    test('f64_promote_f32', () => {
      const op = (OpCodes as any).f64_promote_f32;
      expect(op).toBeDefined();
      expect(op.value).toBe(187);
      expect(op.mnemonic).toBe("f64.promote_f32");
    });

    test('i32_reinterpret_f32', () => {
      const op = (OpCodes as any).i32_reinterpret_f32;
      expect(op).toBeDefined();
      expect(op.value).toBe(188);
      expect(op.mnemonic).toBe("i32.reinterpret_f32");
    });

    test('i64_reinterpret_f64', () => {
      const op = (OpCodes as any).i64_reinterpret_f64;
      expect(op).toBeDefined();
      expect(op.value).toBe(189);
      expect(op.mnemonic).toBe("i64.reinterpret_f64");
    });

    test('f32_reinterpret_i32', () => {
      const op = (OpCodes as any).f32_reinterpret_i32;
      expect(op).toBeDefined();
      expect(op.value).toBe(190);
      expect(op.mnemonic).toBe("f32.reinterpret_i32");
    });

    test('f64_reinterpret_i64', () => {
      const op = (OpCodes as any).f64_reinterpret_i64;
      expect(op).toBeDefined();
      expect(op.value).toBe(191);
      expect(op.mnemonic).toBe("f64.reinterpret_i64");
    });

  });

  describe('sign-extend', () => {
    test('i32_extend8_s', () => {
      const op = (OpCodes as any).i32_extend8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(192);
      expect(op.mnemonic).toBe("i32.extend8_s");
      expect(op.feature).toBe("sign-extend");
    });

    test('i32_extend16_s', () => {
      const op = (OpCodes as any).i32_extend16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(193);
      expect(op.mnemonic).toBe("i32.extend16_s");
      expect(op.feature).toBe("sign-extend");
    });

    test('i64_extend8_s', () => {
      const op = (OpCodes as any).i64_extend8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(194);
      expect(op.mnemonic).toBe("i64.extend8_s");
      expect(op.feature).toBe("sign-extend");
    });

    test('i64_extend16_s', () => {
      const op = (OpCodes as any).i64_extend16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(195);
      expect(op.mnemonic).toBe("i64.extend16_s");
      expect(op.feature).toBe("sign-extend");
    });

    test('i64_extend32_s', () => {
      const op = (OpCodes as any).i64_extend32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(196);
      expect(op.mnemonic).toBe("i64.extend32_s");
      expect(op.feature).toBe("sign-extend");
    });

  });

  describe('sat-trunc', () => {
    test('i32_trunc_sat_f32_s', () => {
      const op = (OpCodes as any).i32_trunc_sat_f32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(0);
      expect(op.mnemonic).toBe("i32.trunc_sat_f32_s");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

    test('i32_trunc_sat_f32_u', () => {
      const op = (OpCodes as any).i32_trunc_sat_f32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(1);
      expect(op.mnemonic).toBe("i32.trunc_sat_f32_u");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

    test('i32_trunc_sat_f64_s', () => {
      const op = (OpCodes as any).i32_trunc_sat_f64_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(2);
      expect(op.mnemonic).toBe("i32.trunc_sat_f64_s");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

    test('i32_trunc_sat_f64_u', () => {
      const op = (OpCodes as any).i32_trunc_sat_f64_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(3);
      expect(op.mnemonic).toBe("i32.trunc_sat_f64_u");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

    test('i64_trunc_sat_f32_s', () => {
      const op = (OpCodes as any).i64_trunc_sat_f32_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(4);
      expect(op.mnemonic).toBe("i64.trunc_sat_f32_s");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

    test('i64_trunc_sat_f32_u', () => {
      const op = (OpCodes as any).i64_trunc_sat_f32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(5);
      expect(op.mnemonic).toBe("i64.trunc_sat_f32_u");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

    test('i64_trunc_sat_f64_s', () => {
      const op = (OpCodes as any).i64_trunc_sat_f64_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(6);
      expect(op.mnemonic).toBe("i64.trunc_sat_f64_s");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

    test('i64_trunc_sat_f64_u', () => {
      const op = (OpCodes as any).i64_trunc_sat_f64_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(7);
      expect(op.mnemonic).toBe("i64.trunc_sat_f64_u");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("sat-trunc");
    });

  });

  describe('bulk-memory', () => {
    test('memory_init', () => {
      const op = (OpCodes as any).memory_init;
      expect(op).toBeDefined();
      expect(op.value).toBe(8);
      expect(op.mnemonic).toBe("memory.init");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("bulk-memory");
    });

    test('data_drop', () => {
      const op = (OpCodes as any).data_drop;
      expect(op).toBeDefined();
      expect(op.value).toBe(9);
      expect(op.mnemonic).toBe("data.drop");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("bulk-memory");
    });

    test('memory_copy', () => {
      const op = (OpCodes as any).memory_copy;
      expect(op).toBeDefined();
      expect(op.value).toBe(10);
      expect(op.mnemonic).toBe("memory.copy");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("bulk-memory");
    });

    test('memory_fill', () => {
      const op = (OpCodes as any).memory_fill;
      expect(op).toBeDefined();
      expect(op.value).toBe(11);
      expect(op.mnemonic).toBe("memory.fill");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("bulk-memory");
    });

    test('table_init', () => {
      const op = (OpCodes as any).table_init;
      expect(op).toBeDefined();
      expect(op.value).toBe(12);
      expect(op.mnemonic).toBe("table.init");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("bulk-memory");
    });

    test('elem_drop', () => {
      const op = (OpCodes as any).elem_drop;
      expect(op).toBeDefined();
      expect(op.value).toBe(13);
      expect(op.mnemonic).toBe("elem.drop");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("bulk-memory");
    });

    test('table_copy', () => {
      const op = (OpCodes as any).table_copy;
      expect(op).toBeDefined();
      expect(op.value).toBe(14);
      expect(op.mnemonic).toBe("table.copy");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("bulk-memory");
    });

  });

  describe('reference-types', () => {
    test('table_grow', () => {
      const op = (OpCodes as any).table_grow;
      expect(op).toBeDefined();
      expect(op.value).toBe(15);
      expect(op.mnemonic).toBe("table.grow");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("reference-types");
    });

    test('table_size', () => {
      const op = (OpCodes as any).table_size;
      expect(op).toBeDefined();
      expect(op.value).toBe(16);
      expect(op.mnemonic).toBe("table.size");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("reference-types");
    });

    test('table_fill', () => {
      const op = (OpCodes as any).table_fill;
      expect(op).toBeDefined();
      expect(op.value).toBe(17);
      expect(op.mnemonic).toBe("table.fill");
      expect(op.prefix).toBe(252);
      expect(op.feature).toBe("reference-types");
    });

    test('ref_null', () => {
      const op = (OpCodes as any).ref_null;
      expect(op).toBeDefined();
      expect(op.value).toBe(208);
      expect(op.mnemonic).toBe("ref.null");
      expect(op.feature).toBe("reference-types");
    });

    test('ref_is_null', () => {
      const op = (OpCodes as any).ref_is_null;
      expect(op).toBeDefined();
      expect(op.value).toBe(209);
      expect(op.mnemonic).toBe("ref.is_null");
      expect(op.feature).toBe("reference-types");
    });

    test('ref_func', () => {
      const op = (OpCodes as any).ref_func;
      expect(op).toBeDefined();
      expect(op.value).toBe(210);
      expect(op.mnemonic).toBe("ref.func");
      expect(op.feature).toBe("reference-types");
    });

    test('table_get', () => {
      const op = (OpCodes as any).table_get;
      expect(op).toBeDefined();
      expect(op.value).toBe(37);
      expect(op.mnemonic).toBe("table.get");
      expect(op.feature).toBe("reference-types");
    });

    test('table_set', () => {
      const op = (OpCodes as any).table_set;
      expect(op).toBeDefined();
      expect(op.value).toBe(38);
      expect(op.mnemonic).toBe("table.set");
      expect(op.feature).toBe("reference-types");
    });

  });

  describe('simd', () => {
    test('v128_load', () => {
      const op = (OpCodes as any).v128_load;
      expect(op).toBeDefined();
      expect(op.value).toBe(0);
      expect(op.mnemonic).toBe("v128.load");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load8x8_s', () => {
      const op = (OpCodes as any).v128_load8x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(1);
      expect(op.mnemonic).toBe("v128.load8x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load8x8_u', () => {
      const op = (OpCodes as any).v128_load8x8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(2);
      expect(op.mnemonic).toBe("v128.load8x8_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load16x4_s', () => {
      const op = (OpCodes as any).v128_load16x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(3);
      expect(op.mnemonic).toBe("v128.load16x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load16x4_u', () => {
      const op = (OpCodes as any).v128_load16x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(4);
      expect(op.mnemonic).toBe("v128.load16x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load32x2_s', () => {
      const op = (OpCodes as any).v128_load32x2_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(5);
      expect(op.mnemonic).toBe("v128.load32x2_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load32x2_u', () => {
      const op = (OpCodes as any).v128_load32x2_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(6);
      expect(op.mnemonic).toBe("v128.load32x2_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load8_splat', () => {
      const op = (OpCodes as any).v128_load8_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(7);
      expect(op.mnemonic).toBe("v128.load8_splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load16_splat', () => {
      const op = (OpCodes as any).v128_load16_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(8);
      expect(op.mnemonic).toBe("v128.load16_splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load32_splat', () => {
      const op = (OpCodes as any).v128_load32_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(9);
      expect(op.mnemonic).toBe("v128.load32_splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load64_splat', () => {
      const op = (OpCodes as any).v128_load64_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(10);
      expect(op.mnemonic).toBe("v128.load64_splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_store', () => {
      const op = (OpCodes as any).v128_store;
      expect(op).toBeDefined();
      expect(op.value).toBe(11);
      expect(op.mnemonic).toBe("v128.store");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_const', () => {
      const op = (OpCodes as any).v128_const;
      expect(op).toBeDefined();
      expect(op.value).toBe(12);
      expect(op.mnemonic).toBe("v128.const");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_shuffle', () => {
      const op = (OpCodes as any).i8x16_shuffle;
      expect(op).toBeDefined();
      expect(op.value).toBe(13);
      expect(op.mnemonic).toBe("i8x16.shuffle");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_swizzle', () => {
      const op = (OpCodes as any).i8x16_swizzle;
      expect(op).toBeDefined();
      expect(op.value).toBe(14);
      expect(op.mnemonic).toBe("i8x16.swizzle");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_splat', () => {
      const op = (OpCodes as any).i8x16_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(15);
      expect(op.mnemonic).toBe("i8x16.splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_splat', () => {
      const op = (OpCodes as any).i16x8_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(16);
      expect(op.mnemonic).toBe("i16x8.splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_splat', () => {
      const op = (OpCodes as any).i32x4_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(17);
      expect(op.mnemonic).toBe("i32x4.splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_splat', () => {
      const op = (OpCodes as any).i64x2_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(18);
      expect(op.mnemonic).toBe("i64x2.splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_splat', () => {
      const op = (OpCodes as any).f32x4_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(19);
      expect(op.mnemonic).toBe("f32x4.splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_splat', () => {
      const op = (OpCodes as any).f64x2_splat;
      expect(op).toBeDefined();
      expect(op.value).toBe(20);
      expect(op.mnemonic).toBe("f64x2.splat");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_extract_lane_s', () => {
      const op = (OpCodes as any).i8x16_extract_lane_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(21);
      expect(op.mnemonic).toBe("i8x16.extract_lane_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_extract_lane_u', () => {
      const op = (OpCodes as any).i8x16_extract_lane_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(22);
      expect(op.mnemonic).toBe("i8x16.extract_lane_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_replace_lane', () => {
      const op = (OpCodes as any).i8x16_replace_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(23);
      expect(op.mnemonic).toBe("i8x16.replace_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extract_lane_s', () => {
      const op = (OpCodes as any).i16x8_extract_lane_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(24);
      expect(op.mnemonic).toBe("i16x8.extract_lane_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extract_lane_u', () => {
      const op = (OpCodes as any).i16x8_extract_lane_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(25);
      expect(op.mnemonic).toBe("i16x8.extract_lane_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_replace_lane', () => {
      const op = (OpCodes as any).i16x8_replace_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(26);
      expect(op.mnemonic).toBe("i16x8.replace_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extract_lane', () => {
      const op = (OpCodes as any).i32x4_extract_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(27);
      expect(op.mnemonic).toBe("i32x4.extract_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_replace_lane', () => {
      const op = (OpCodes as any).i32x4_replace_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(28);
      expect(op.mnemonic).toBe("i32x4.replace_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extract_lane', () => {
      const op = (OpCodes as any).i64x2_extract_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(29);
      expect(op.mnemonic).toBe("i64x2.extract_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_replace_lane', () => {
      const op = (OpCodes as any).i64x2_replace_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(30);
      expect(op.mnemonic).toBe("i64x2.replace_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_extract_lane', () => {
      const op = (OpCodes as any).f32x4_extract_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(31);
      expect(op.mnemonic).toBe("f32x4.extract_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_replace_lane', () => {
      const op = (OpCodes as any).f32x4_replace_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(32);
      expect(op.mnemonic).toBe("f32x4.replace_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_extract_lane', () => {
      const op = (OpCodes as any).f64x2_extract_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(33);
      expect(op.mnemonic).toBe("f64x2.extract_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_replace_lane', () => {
      const op = (OpCodes as any).f64x2_replace_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(34);
      expect(op.mnemonic).toBe("f64x2.replace_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_eq', () => {
      const op = (OpCodes as any).i8x16_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(35);
      expect(op.mnemonic).toBe("i8x16.eq");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_ne', () => {
      const op = (OpCodes as any).i8x16_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(36);
      expect(op.mnemonic).toBe("i8x16.ne");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_lt_s', () => {
      const op = (OpCodes as any).i8x16_lt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(37);
      expect(op.mnemonic).toBe("i8x16.lt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_lt_u', () => {
      const op = (OpCodes as any).i8x16_lt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(38);
      expect(op.mnemonic).toBe("i8x16.lt_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_gt_s', () => {
      const op = (OpCodes as any).i8x16_gt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(39);
      expect(op.mnemonic).toBe("i8x16.gt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_gt_u', () => {
      const op = (OpCodes as any).i8x16_gt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(40);
      expect(op.mnemonic).toBe("i8x16.gt_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_le_s', () => {
      const op = (OpCodes as any).i8x16_le_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(41);
      expect(op.mnemonic).toBe("i8x16.le_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_le_u', () => {
      const op = (OpCodes as any).i8x16_le_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(42);
      expect(op.mnemonic).toBe("i8x16.le_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_ge_s', () => {
      const op = (OpCodes as any).i8x16_ge_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(43);
      expect(op.mnemonic).toBe("i8x16.ge_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_ge_u', () => {
      const op = (OpCodes as any).i8x16_ge_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(44);
      expect(op.mnemonic).toBe("i8x16.ge_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_eq', () => {
      const op = (OpCodes as any).i16x8_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(45);
      expect(op.mnemonic).toBe("i16x8.eq");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_ne', () => {
      const op = (OpCodes as any).i16x8_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(46);
      expect(op.mnemonic).toBe("i16x8.ne");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_lt_s', () => {
      const op = (OpCodes as any).i16x8_lt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(47);
      expect(op.mnemonic).toBe("i16x8.lt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_lt_u', () => {
      const op = (OpCodes as any).i16x8_lt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(48);
      expect(op.mnemonic).toBe("i16x8.lt_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_gt_s', () => {
      const op = (OpCodes as any).i16x8_gt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(49);
      expect(op.mnemonic).toBe("i16x8.gt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_gt_u', () => {
      const op = (OpCodes as any).i16x8_gt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(50);
      expect(op.mnemonic).toBe("i16x8.gt_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_le_s', () => {
      const op = (OpCodes as any).i16x8_le_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(51);
      expect(op.mnemonic).toBe("i16x8.le_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_le_u', () => {
      const op = (OpCodes as any).i16x8_le_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(52);
      expect(op.mnemonic).toBe("i16x8.le_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_ge_s', () => {
      const op = (OpCodes as any).i16x8_ge_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(53);
      expect(op.mnemonic).toBe("i16x8.ge_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_ge_u', () => {
      const op = (OpCodes as any).i16x8_ge_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(54);
      expect(op.mnemonic).toBe("i16x8.ge_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_eq', () => {
      const op = (OpCodes as any).i32x4_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(55);
      expect(op.mnemonic).toBe("i32x4.eq");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_ne', () => {
      const op = (OpCodes as any).i32x4_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(56);
      expect(op.mnemonic).toBe("i32x4.ne");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_lt_s', () => {
      const op = (OpCodes as any).i32x4_lt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(57);
      expect(op.mnemonic).toBe("i32x4.lt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_lt_u', () => {
      const op = (OpCodes as any).i32x4_lt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(58);
      expect(op.mnemonic).toBe("i32x4.lt_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_gt_s', () => {
      const op = (OpCodes as any).i32x4_gt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(59);
      expect(op.mnemonic).toBe("i32x4.gt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_gt_u', () => {
      const op = (OpCodes as any).i32x4_gt_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(60);
      expect(op.mnemonic).toBe("i32x4.gt_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_le_s', () => {
      const op = (OpCodes as any).i32x4_le_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(61);
      expect(op.mnemonic).toBe("i32x4.le_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_le_u', () => {
      const op = (OpCodes as any).i32x4_le_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(62);
      expect(op.mnemonic).toBe("i32x4.le_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_ge_s', () => {
      const op = (OpCodes as any).i32x4_ge_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(63);
      expect(op.mnemonic).toBe("i32x4.ge_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_ge_u', () => {
      const op = (OpCodes as any).i32x4_ge_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(64);
      expect(op.mnemonic).toBe("i32x4.ge_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_eq', () => {
      const op = (OpCodes as any).f32x4_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(65);
      expect(op.mnemonic).toBe("f32x4.eq");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_ne', () => {
      const op = (OpCodes as any).f32x4_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(66);
      expect(op.mnemonic).toBe("f32x4.ne");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_lt', () => {
      const op = (OpCodes as any).f32x4_lt;
      expect(op).toBeDefined();
      expect(op.value).toBe(67);
      expect(op.mnemonic).toBe("f32x4.lt");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_gt', () => {
      const op = (OpCodes as any).f32x4_gt;
      expect(op).toBeDefined();
      expect(op.value).toBe(68);
      expect(op.mnemonic).toBe("f32x4.gt");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_le', () => {
      const op = (OpCodes as any).f32x4_le;
      expect(op).toBeDefined();
      expect(op.value).toBe(69);
      expect(op.mnemonic).toBe("f32x4.le");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_ge', () => {
      const op = (OpCodes as any).f32x4_ge;
      expect(op).toBeDefined();
      expect(op.value).toBe(70);
      expect(op.mnemonic).toBe("f32x4.ge");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_eq', () => {
      const op = (OpCodes as any).f64x2_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(71);
      expect(op.mnemonic).toBe("f64x2.eq");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_ne', () => {
      const op = (OpCodes as any).f64x2_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(72);
      expect(op.mnemonic).toBe("f64x2.ne");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_lt', () => {
      const op = (OpCodes as any).f64x2_lt;
      expect(op).toBeDefined();
      expect(op.value).toBe(73);
      expect(op.mnemonic).toBe("f64x2.lt");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_gt', () => {
      const op = (OpCodes as any).f64x2_gt;
      expect(op).toBeDefined();
      expect(op.value).toBe(74);
      expect(op.mnemonic).toBe("f64x2.gt");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_le', () => {
      const op = (OpCodes as any).f64x2_le;
      expect(op).toBeDefined();
      expect(op.value).toBe(75);
      expect(op.mnemonic).toBe("f64x2.le");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_ge', () => {
      const op = (OpCodes as any).f64x2_ge;
      expect(op).toBeDefined();
      expect(op.value).toBe(76);
      expect(op.mnemonic).toBe("f64x2.ge");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_not', () => {
      const op = (OpCodes as any).v128_not;
      expect(op).toBeDefined();
      expect(op.value).toBe(77);
      expect(op.mnemonic).toBe("v128.not");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_and', () => {
      const op = (OpCodes as any).v128_and;
      expect(op).toBeDefined();
      expect(op.value).toBe(78);
      expect(op.mnemonic).toBe("v128.and");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_andnot', () => {
      const op = (OpCodes as any).v128_andnot;
      expect(op).toBeDefined();
      expect(op.value).toBe(79);
      expect(op.mnemonic).toBe("v128.andnot");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_or', () => {
      const op = (OpCodes as any).v128_or;
      expect(op).toBeDefined();
      expect(op.value).toBe(80);
      expect(op.mnemonic).toBe("v128.or");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_xor', () => {
      const op = (OpCodes as any).v128_xor;
      expect(op).toBeDefined();
      expect(op.value).toBe(81);
      expect(op.mnemonic).toBe("v128.xor");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_bitselect', () => {
      const op = (OpCodes as any).v128_bitselect;
      expect(op).toBeDefined();
      expect(op.value).toBe(82);
      expect(op.mnemonic).toBe("v128.bitselect");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_any_true', () => {
      const op = (OpCodes as any).v128_any_true;
      expect(op).toBeDefined();
      expect(op.value).toBe(83);
      expect(op.mnemonic).toBe("v128.any_true");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load8_lane', () => {
      const op = (OpCodes as any).v128_load8_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(84);
      expect(op.mnemonic).toBe("v128.load8_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load16_lane', () => {
      const op = (OpCodes as any).v128_load16_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(85);
      expect(op.mnemonic).toBe("v128.load16_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load32_lane', () => {
      const op = (OpCodes as any).v128_load32_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(86);
      expect(op.mnemonic).toBe("v128.load32_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load64_lane', () => {
      const op = (OpCodes as any).v128_load64_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(87);
      expect(op.mnemonic).toBe("v128.load64_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_store8_lane', () => {
      const op = (OpCodes as any).v128_store8_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(88);
      expect(op.mnemonic).toBe("v128.store8_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_store16_lane', () => {
      const op = (OpCodes as any).v128_store16_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(89);
      expect(op.mnemonic).toBe("v128.store16_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_store32_lane', () => {
      const op = (OpCodes as any).v128_store32_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(90);
      expect(op.mnemonic).toBe("v128.store32_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_store64_lane', () => {
      const op = (OpCodes as any).v128_store64_lane;
      expect(op).toBeDefined();
      expect(op.value).toBe(91);
      expect(op.mnemonic).toBe("v128.store64_lane");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load32_zero', () => {
      const op = (OpCodes as any).v128_load32_zero;
      expect(op).toBeDefined();
      expect(op.value).toBe(92);
      expect(op.mnemonic).toBe("v128.load32_zero");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('v128_load64_zero', () => {
      const op = (OpCodes as any).v128_load64_zero;
      expect(op).toBeDefined();
      expect(op.value).toBe(93);
      expect(op.mnemonic).toBe("v128.load64_zero");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_trunc_sat_f32x4_s', () => {
      const op = (OpCodes as any).i32x4_trunc_sat_f32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(94);
      expect(op.mnemonic).toBe("i32x4.trunc_sat_f32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_trunc_sat_f32x4_u', () => {
      const op = (OpCodes as any).i32x4_trunc_sat_f32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(95);
      expect(op.mnemonic).toBe("i32x4.trunc_sat_f32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_abs', () => {
      const op = (OpCodes as any).i8x16_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(96);
      expect(op.mnemonic).toBe("i8x16.abs");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_neg', () => {
      const op = (OpCodes as any).i8x16_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(97);
      expect(op.mnemonic).toBe("i8x16.neg");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_popcnt', () => {
      const op = (OpCodes as any).i8x16_popcnt;
      expect(op).toBeDefined();
      expect(op.value).toBe(98);
      expect(op.mnemonic).toBe("i8x16.popcnt");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_all_true', () => {
      const op = (OpCodes as any).i8x16_all_true;
      expect(op).toBeDefined();
      expect(op.value).toBe(99);
      expect(op.mnemonic).toBe("i8x16.all_true");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_bitmask', () => {
      const op = (OpCodes as any).i8x16_bitmask;
      expect(op).toBeDefined();
      expect(op.value).toBe(100);
      expect(op.mnemonic).toBe("i8x16.bitmask");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_narrow_i16x8_s', () => {
      const op = (OpCodes as any).i8x16_narrow_i16x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(101);
      expect(op.mnemonic).toBe("i8x16.narrow_i16x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_narrow_i16x8_u', () => {
      const op = (OpCodes as any).i8x16_narrow_i16x8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(102);
      expect(op.mnemonic).toBe("i8x16.narrow_i16x8_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_ceil', () => {
      const op = (OpCodes as any).f32x4_ceil;
      expect(op).toBeDefined();
      expect(op.value).toBe(103);
      expect(op.mnemonic).toBe("f32x4.ceil");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_floor', () => {
      const op = (OpCodes as any).f32x4_floor;
      expect(op).toBeDefined();
      expect(op.value).toBe(104);
      expect(op.mnemonic).toBe("f32x4.floor");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_trunc', () => {
      const op = (OpCodes as any).f32x4_trunc;
      expect(op).toBeDefined();
      expect(op.value).toBe(105);
      expect(op.mnemonic).toBe("f32x4.trunc");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_nearest', () => {
      const op = (OpCodes as any).f32x4_nearest;
      expect(op).toBeDefined();
      expect(op.value).toBe(106);
      expect(op.mnemonic).toBe("f32x4.nearest");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_shl', () => {
      const op = (OpCodes as any).i8x16_shl;
      expect(op).toBeDefined();
      expect(op.value).toBe(107);
      expect(op.mnemonic).toBe("i8x16.shl");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_shr_s', () => {
      const op = (OpCodes as any).i8x16_shr_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(108);
      expect(op.mnemonic).toBe("i8x16.shr_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_shr_u', () => {
      const op = (OpCodes as any).i8x16_shr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(109);
      expect(op.mnemonic).toBe("i8x16.shr_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_add', () => {
      const op = (OpCodes as any).i8x16_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(110);
      expect(op.mnemonic).toBe("i8x16.add");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_add_sat_s', () => {
      const op = (OpCodes as any).i8x16_add_sat_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(111);
      expect(op.mnemonic).toBe("i8x16.add_sat_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_add_sat_u', () => {
      const op = (OpCodes as any).i8x16_add_sat_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(112);
      expect(op.mnemonic).toBe("i8x16.add_sat_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_sub', () => {
      const op = (OpCodes as any).i8x16_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(113);
      expect(op.mnemonic).toBe("i8x16.sub");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_sub_sat_s', () => {
      const op = (OpCodes as any).i8x16_sub_sat_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(114);
      expect(op.mnemonic).toBe("i8x16.sub_sat_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_sub_sat_u', () => {
      const op = (OpCodes as any).i8x16_sub_sat_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(115);
      expect(op.mnemonic).toBe("i8x16.sub_sat_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_ceil', () => {
      const op = (OpCodes as any).f64x2_ceil;
      expect(op).toBeDefined();
      expect(op.value).toBe(116);
      expect(op.mnemonic).toBe("f64x2.ceil");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_floor', () => {
      const op = (OpCodes as any).f64x2_floor;
      expect(op).toBeDefined();
      expect(op.value).toBe(117);
      expect(op.mnemonic).toBe("f64x2.floor");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_min_s', () => {
      const op = (OpCodes as any).i8x16_min_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(118);
      expect(op.mnemonic).toBe("i8x16.min_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_min_u', () => {
      const op = (OpCodes as any).i8x16_min_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(119);
      expect(op.mnemonic).toBe("i8x16.min_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_max_s', () => {
      const op = (OpCodes as any).i8x16_max_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(120);
      expect(op.mnemonic).toBe("i8x16.max_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_max_u', () => {
      const op = (OpCodes as any).i8x16_max_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(121);
      expect(op.mnemonic).toBe("i8x16.max_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_trunc', () => {
      const op = (OpCodes as any).f64x2_trunc;
      expect(op).toBeDefined();
      expect(op.value).toBe(122);
      expect(op.mnemonic).toBe("f64x2.trunc");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i8x16_avgr_u', () => {
      const op = (OpCodes as any).i8x16_avgr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(123);
      expect(op.mnemonic).toBe("i8x16.avgr_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extadd_pairwise_i8x16_s', () => {
      const op = (OpCodes as any).i16x8_extadd_pairwise_i8x16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(124);
      expect(op.mnemonic).toBe("i16x8.extadd_pairwise_i8x16_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extadd_pairwise_i8x16_u', () => {
      const op = (OpCodes as any).i16x8_extadd_pairwise_i8x16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(125);
      expect(op.mnemonic).toBe("i16x8.extadd_pairwise_i8x16_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extadd_pairwise_i16x8_s', () => {
      const op = (OpCodes as any).i32x4_extadd_pairwise_i16x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(126);
      expect(op.mnemonic).toBe("i32x4.extadd_pairwise_i16x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extadd_pairwise_i16x8_u', () => {
      const op = (OpCodes as any).i32x4_extadd_pairwise_i16x8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(127);
      expect(op.mnemonic).toBe("i32x4.extadd_pairwise_i16x8_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_abs', () => {
      const op = (OpCodes as any).i16x8_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(128);
      expect(op.mnemonic).toBe("i16x8.abs");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_neg', () => {
      const op = (OpCodes as any).i16x8_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(129);
      expect(op.mnemonic).toBe("i16x8.neg");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_q15mulr_sat_s', () => {
      const op = (OpCodes as any).i16x8_q15mulr_sat_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(130);
      expect(op.mnemonic).toBe("i16x8.q15mulr_sat_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_all_true', () => {
      const op = (OpCodes as any).i16x8_all_true;
      expect(op).toBeDefined();
      expect(op.value).toBe(131);
      expect(op.mnemonic).toBe("i16x8.all_true");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_bitmask', () => {
      const op = (OpCodes as any).i16x8_bitmask;
      expect(op).toBeDefined();
      expect(op.value).toBe(132);
      expect(op.mnemonic).toBe("i16x8.bitmask");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_narrow_i32x4_s', () => {
      const op = (OpCodes as any).i16x8_narrow_i32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(133);
      expect(op.mnemonic).toBe("i16x8.narrow_i32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_narrow_i32x4_u', () => {
      const op = (OpCodes as any).i16x8_narrow_i32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(134);
      expect(op.mnemonic).toBe("i16x8.narrow_i32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extend_low_i8x16_s', () => {
      const op = (OpCodes as any).i16x8_extend_low_i8x16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(135);
      expect(op.mnemonic).toBe("i16x8.extend_low_i8x16_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extend_high_i8x16_s', () => {
      const op = (OpCodes as any).i16x8_extend_high_i8x16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(136);
      expect(op.mnemonic).toBe("i16x8.extend_high_i8x16_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extend_low_i8x16_u', () => {
      const op = (OpCodes as any).i16x8_extend_low_i8x16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(137);
      expect(op.mnemonic).toBe("i16x8.extend_low_i8x16_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extend_high_i8x16_u', () => {
      const op = (OpCodes as any).i16x8_extend_high_i8x16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(138);
      expect(op.mnemonic).toBe("i16x8.extend_high_i8x16_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_shl', () => {
      const op = (OpCodes as any).i16x8_shl;
      expect(op).toBeDefined();
      expect(op.value).toBe(139);
      expect(op.mnemonic).toBe("i16x8.shl");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_shr_s', () => {
      const op = (OpCodes as any).i16x8_shr_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(140);
      expect(op.mnemonic).toBe("i16x8.shr_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_shr_u', () => {
      const op = (OpCodes as any).i16x8_shr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(141);
      expect(op.mnemonic).toBe("i16x8.shr_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_add', () => {
      const op = (OpCodes as any).i16x8_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(142);
      expect(op.mnemonic).toBe("i16x8.add");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_add_sat_s', () => {
      const op = (OpCodes as any).i16x8_add_sat_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(143);
      expect(op.mnemonic).toBe("i16x8.add_sat_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_add_sat_u', () => {
      const op = (OpCodes as any).i16x8_add_sat_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(144);
      expect(op.mnemonic).toBe("i16x8.add_sat_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_sub', () => {
      const op = (OpCodes as any).i16x8_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(145);
      expect(op.mnemonic).toBe("i16x8.sub");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_sub_sat_s', () => {
      const op = (OpCodes as any).i16x8_sub_sat_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(146);
      expect(op.mnemonic).toBe("i16x8.sub_sat_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_sub_sat_u', () => {
      const op = (OpCodes as any).i16x8_sub_sat_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(147);
      expect(op.mnemonic).toBe("i16x8.sub_sat_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_nearest', () => {
      const op = (OpCodes as any).f64x2_nearest;
      expect(op).toBeDefined();
      expect(op.value).toBe(148);
      expect(op.mnemonic).toBe("f64x2.nearest");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_mul', () => {
      const op = (OpCodes as any).i16x8_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(149);
      expect(op.mnemonic).toBe("i16x8.mul");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_min_s', () => {
      const op = (OpCodes as any).i16x8_min_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(150);
      expect(op.mnemonic).toBe("i16x8.min_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_min_u', () => {
      const op = (OpCodes as any).i16x8_min_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(151);
      expect(op.mnemonic).toBe("i16x8.min_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_max_s', () => {
      const op = (OpCodes as any).i16x8_max_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(152);
      expect(op.mnemonic).toBe("i16x8.max_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_max_u', () => {
      const op = (OpCodes as any).i16x8_max_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(153);
      expect(op.mnemonic).toBe("i16x8.max_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_avgr_u', () => {
      const op = (OpCodes as any).i16x8_avgr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(155);
      expect(op.mnemonic).toBe("i16x8.avgr_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extmul_low_i8x16_s', () => {
      const op = (OpCodes as any).i16x8_extmul_low_i8x16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(156);
      expect(op.mnemonic).toBe("i16x8.extmul_low_i8x16_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extmul_high_i8x16_s', () => {
      const op = (OpCodes as any).i16x8_extmul_high_i8x16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(157);
      expect(op.mnemonic).toBe("i16x8.extmul_high_i8x16_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extmul_low_i8x16_u', () => {
      const op = (OpCodes as any).i16x8_extmul_low_i8x16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(158);
      expect(op.mnemonic).toBe("i16x8.extmul_low_i8x16_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i16x8_extmul_high_i8x16_u', () => {
      const op = (OpCodes as any).i16x8_extmul_high_i8x16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(159);
      expect(op.mnemonic).toBe("i16x8.extmul_high_i8x16_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_abs', () => {
      const op = (OpCodes as any).i32x4_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(160);
      expect(op.mnemonic).toBe("i32x4.abs");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_neg', () => {
      const op = (OpCodes as any).i32x4_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(161);
      expect(op.mnemonic).toBe("i32x4.neg");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_all_true', () => {
      const op = (OpCodes as any).i32x4_all_true;
      expect(op).toBeDefined();
      expect(op.value).toBe(163);
      expect(op.mnemonic).toBe("i32x4.all_true");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_bitmask', () => {
      const op = (OpCodes as any).i32x4_bitmask;
      expect(op).toBeDefined();
      expect(op.value).toBe(164);
      expect(op.mnemonic).toBe("i32x4.bitmask");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extend_low_i16x8_s', () => {
      const op = (OpCodes as any).i32x4_extend_low_i16x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(167);
      expect(op.mnemonic).toBe("i32x4.extend_low_i16x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extend_high_i16x8_s', () => {
      const op = (OpCodes as any).i32x4_extend_high_i16x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(168);
      expect(op.mnemonic).toBe("i32x4.extend_high_i16x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extend_low_i16x8_u', () => {
      const op = (OpCodes as any).i32x4_extend_low_i16x8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(169);
      expect(op.mnemonic).toBe("i32x4.extend_low_i16x8_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extend_high_i16x8_u', () => {
      const op = (OpCodes as any).i32x4_extend_high_i16x8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(170);
      expect(op.mnemonic).toBe("i32x4.extend_high_i16x8_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_shl', () => {
      const op = (OpCodes as any).i32x4_shl;
      expect(op).toBeDefined();
      expect(op.value).toBe(171);
      expect(op.mnemonic).toBe("i32x4.shl");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_shr_s', () => {
      const op = (OpCodes as any).i32x4_shr_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(172);
      expect(op.mnemonic).toBe("i32x4.shr_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_shr_u', () => {
      const op = (OpCodes as any).i32x4_shr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(173);
      expect(op.mnemonic).toBe("i32x4.shr_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_add', () => {
      const op = (OpCodes as any).i32x4_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(174);
      expect(op.mnemonic).toBe("i32x4.add");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_convert_i32x4_s', () => {
      const op = (OpCodes as any).f32x4_convert_i32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(175);
      expect(op.mnemonic).toBe("f32x4.convert_i32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_convert_i32x4_u', () => {
      const op = (OpCodes as any).f32x4_convert_i32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(176);
      expect(op.mnemonic).toBe("f32x4.convert_i32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_sub', () => {
      const op = (OpCodes as any).i32x4_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(177);
      expect(op.mnemonic).toBe("i32x4.sub");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_mul', () => {
      const op = (OpCodes as any).i32x4_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(181);
      expect(op.mnemonic).toBe("i32x4.mul");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_min_s', () => {
      const op = (OpCodes as any).i32x4_min_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(182);
      expect(op.mnemonic).toBe("i32x4.min_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_min_u', () => {
      const op = (OpCodes as any).i32x4_min_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(183);
      expect(op.mnemonic).toBe("i32x4.min_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_max_s', () => {
      const op = (OpCodes as any).i32x4_max_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(184);
      expect(op.mnemonic).toBe("i32x4.max_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_max_u', () => {
      const op = (OpCodes as any).i32x4_max_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(185);
      expect(op.mnemonic).toBe("i32x4.max_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_dot_i16x8_s', () => {
      const op = (OpCodes as any).i32x4_dot_i16x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(186);
      expect(op.mnemonic).toBe("i32x4.dot_i16x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extmul_low_i16x8_s', () => {
      const op = (OpCodes as any).i32x4_extmul_low_i16x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(188);
      expect(op.mnemonic).toBe("i32x4.extmul_low_i16x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extmul_high_i16x8_s', () => {
      const op = (OpCodes as any).i32x4_extmul_high_i16x8_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(189);
      expect(op.mnemonic).toBe("i32x4.extmul_high_i16x8_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extmul_low_i16x8_u', () => {
      const op = (OpCodes as any).i32x4_extmul_low_i16x8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(190);
      expect(op.mnemonic).toBe("i32x4.extmul_low_i16x8_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_extmul_high_i16x8_u', () => {
      const op = (OpCodes as any).i32x4_extmul_high_i16x8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(191);
      expect(op.mnemonic).toBe("i32x4.extmul_high_i16x8_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_abs', () => {
      const op = (OpCodes as any).i64x2_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(192);
      expect(op.mnemonic).toBe("i64x2.abs");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_neg', () => {
      const op = (OpCodes as any).i64x2_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(193);
      expect(op.mnemonic).toBe("i64x2.neg");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_all_true', () => {
      const op = (OpCodes as any).i64x2_all_true;
      expect(op).toBeDefined();
      expect(op.value).toBe(195);
      expect(op.mnemonic).toBe("i64x2.all_true");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_bitmask', () => {
      const op = (OpCodes as any).i64x2_bitmask;
      expect(op).toBeDefined();
      expect(op.value).toBe(196);
      expect(op.mnemonic).toBe("i64x2.bitmask");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extend_low_i32x4_s', () => {
      const op = (OpCodes as any).i64x2_extend_low_i32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(199);
      expect(op.mnemonic).toBe("i64x2.extend_low_i32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extend_high_i32x4_s', () => {
      const op = (OpCodes as any).i64x2_extend_high_i32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(200);
      expect(op.mnemonic).toBe("i64x2.extend_high_i32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extend_low_i32x4_u', () => {
      const op = (OpCodes as any).i64x2_extend_low_i32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(201);
      expect(op.mnemonic).toBe("i64x2.extend_low_i32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extend_high_i32x4_u', () => {
      const op = (OpCodes as any).i64x2_extend_high_i32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(202);
      expect(op.mnemonic).toBe("i64x2.extend_high_i32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_shl', () => {
      const op = (OpCodes as any).i64x2_shl;
      expect(op).toBeDefined();
      expect(op.value).toBe(203);
      expect(op.mnemonic).toBe("i64x2.shl");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_shr_s', () => {
      const op = (OpCodes as any).i64x2_shr_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(204);
      expect(op.mnemonic).toBe("i64x2.shr_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_shr_u', () => {
      const op = (OpCodes as any).i64x2_shr_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(205);
      expect(op.mnemonic).toBe("i64x2.shr_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_add', () => {
      const op = (OpCodes as any).i64x2_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(206);
      expect(op.mnemonic).toBe("i64x2.add");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_sub', () => {
      const op = (OpCodes as any).i64x2_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(209);
      expect(op.mnemonic).toBe("i64x2.sub");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_mul', () => {
      const op = (OpCodes as any).i64x2_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(213);
      expect(op.mnemonic).toBe("i64x2.mul");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_eq', () => {
      const op = (OpCodes as any).i64x2_eq;
      expect(op).toBeDefined();
      expect(op.value).toBe(214);
      expect(op.mnemonic).toBe("i64x2.eq");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_ne', () => {
      const op = (OpCodes as any).i64x2_ne;
      expect(op).toBeDefined();
      expect(op.value).toBe(215);
      expect(op.mnemonic).toBe("i64x2.ne");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_lt_s', () => {
      const op = (OpCodes as any).i64x2_lt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(216);
      expect(op.mnemonic).toBe("i64x2.lt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_gt_s', () => {
      const op = (OpCodes as any).i64x2_gt_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(217);
      expect(op.mnemonic).toBe("i64x2.gt_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_le_s', () => {
      const op = (OpCodes as any).i64x2_le_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(218);
      expect(op.mnemonic).toBe("i64x2.le_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_ge_s', () => {
      const op = (OpCodes as any).i64x2_ge_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(219);
      expect(op.mnemonic).toBe("i64x2.ge_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extmul_low_i32x4_s', () => {
      const op = (OpCodes as any).i64x2_extmul_low_i32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(220);
      expect(op.mnemonic).toBe("i64x2.extmul_low_i32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extmul_high_i32x4_s', () => {
      const op = (OpCodes as any).i64x2_extmul_high_i32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(221);
      expect(op.mnemonic).toBe("i64x2.extmul_high_i32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extmul_low_i32x4_u', () => {
      const op = (OpCodes as any).i64x2_extmul_low_i32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(222);
      expect(op.mnemonic).toBe("i64x2.extmul_low_i32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i64x2_extmul_high_i32x4_u', () => {
      const op = (OpCodes as any).i64x2_extmul_high_i32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(223);
      expect(op.mnemonic).toBe("i64x2.extmul_high_i32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_abs', () => {
      const op = (OpCodes as any).f32x4_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(224);
      expect(op.mnemonic).toBe("f32x4.abs");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_neg', () => {
      const op = (OpCodes as any).f32x4_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(225);
      expect(op.mnemonic).toBe("f32x4.neg");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_sqrt', () => {
      const op = (OpCodes as any).f32x4_sqrt;
      expect(op).toBeDefined();
      expect(op.value).toBe(227);
      expect(op.mnemonic).toBe("f32x4.sqrt");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_add', () => {
      const op = (OpCodes as any).f32x4_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(228);
      expect(op.mnemonic).toBe("f32x4.add");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_sub', () => {
      const op = (OpCodes as any).f32x4_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(229);
      expect(op.mnemonic).toBe("f32x4.sub");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_mul', () => {
      const op = (OpCodes as any).f32x4_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(230);
      expect(op.mnemonic).toBe("f32x4.mul");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_div', () => {
      const op = (OpCodes as any).f32x4_div;
      expect(op).toBeDefined();
      expect(op.value).toBe(231);
      expect(op.mnemonic).toBe("f32x4.div");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_min', () => {
      const op = (OpCodes as any).f32x4_min;
      expect(op).toBeDefined();
      expect(op.value).toBe(232);
      expect(op.mnemonic).toBe("f32x4.min");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_max', () => {
      const op = (OpCodes as any).f32x4_max;
      expect(op).toBeDefined();
      expect(op.value).toBe(233);
      expect(op.mnemonic).toBe("f32x4.max");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_pmin', () => {
      const op = (OpCodes as any).f32x4_pmin;
      expect(op).toBeDefined();
      expect(op.value).toBe(234);
      expect(op.mnemonic).toBe("f32x4.pmin");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_pmax', () => {
      const op = (OpCodes as any).f32x4_pmax;
      expect(op).toBeDefined();
      expect(op.value).toBe(235);
      expect(op.mnemonic).toBe("f32x4.pmax");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_abs', () => {
      const op = (OpCodes as any).f64x2_abs;
      expect(op).toBeDefined();
      expect(op.value).toBe(236);
      expect(op.mnemonic).toBe("f64x2.abs");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_neg', () => {
      const op = (OpCodes as any).f64x2_neg;
      expect(op).toBeDefined();
      expect(op.value).toBe(237);
      expect(op.mnemonic).toBe("f64x2.neg");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_sqrt', () => {
      const op = (OpCodes as any).f64x2_sqrt;
      expect(op).toBeDefined();
      expect(op.value).toBe(239);
      expect(op.mnemonic).toBe("f64x2.sqrt");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_add', () => {
      const op = (OpCodes as any).f64x2_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(240);
      expect(op.mnemonic).toBe("f64x2.add");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_sub', () => {
      const op = (OpCodes as any).f64x2_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(241);
      expect(op.mnemonic).toBe("f64x2.sub");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_mul', () => {
      const op = (OpCodes as any).f64x2_mul;
      expect(op).toBeDefined();
      expect(op.value).toBe(242);
      expect(op.mnemonic).toBe("f64x2.mul");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_div', () => {
      const op = (OpCodes as any).f64x2_div;
      expect(op).toBeDefined();
      expect(op.value).toBe(243);
      expect(op.mnemonic).toBe("f64x2.div");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_min', () => {
      const op = (OpCodes as any).f64x2_min;
      expect(op).toBeDefined();
      expect(op.value).toBe(244);
      expect(op.mnemonic).toBe("f64x2.min");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_max', () => {
      const op = (OpCodes as any).f64x2_max;
      expect(op).toBeDefined();
      expect(op.value).toBe(245);
      expect(op.mnemonic).toBe("f64x2.max");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_pmin', () => {
      const op = (OpCodes as any).f64x2_pmin;
      expect(op).toBeDefined();
      expect(op.value).toBe(246);
      expect(op.mnemonic).toBe("f64x2.pmin");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_pmax', () => {
      const op = (OpCodes as any).f64x2_pmax;
      expect(op).toBeDefined();
      expect(op.value).toBe(247);
      expect(op.mnemonic).toBe("f64x2.pmax");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_trunc_sat_f64x2_s_zero', () => {
      const op = (OpCodes as any).i32x4_trunc_sat_f64x2_s_zero;
      expect(op).toBeDefined();
      expect(op.value).toBe(248);
      expect(op.mnemonic).toBe("i32x4.trunc_sat_f64x2_s_zero");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('i32x4_trunc_sat_f64x2_u_zero', () => {
      const op = (OpCodes as any).i32x4_trunc_sat_f64x2_u_zero;
      expect(op).toBeDefined();
      expect(op.value).toBe(249);
      expect(op.mnemonic).toBe("i32x4.trunc_sat_f64x2_u_zero");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_convert_low_i32x4_s', () => {
      const op = (OpCodes as any).f64x2_convert_low_i32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(250);
      expect(op.mnemonic).toBe("f64x2.convert_low_i32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_convert_low_i32x4_u', () => {
      const op = (OpCodes as any).f64x2_convert_low_i32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(251);
      expect(op.mnemonic).toBe("f64x2.convert_low_i32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f32x4_demote_f64x2_zero', () => {
      const op = (OpCodes as any).f32x4_demote_f64x2_zero;
      expect(op).toBeDefined();
      expect(op.value).toBe(252);
      expect(op.mnemonic).toBe("f32x4.demote_f64x2_zero");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

    test('f64x2_promote_low_f32x4', () => {
      const op = (OpCodes as any).f64x2_promote_low_f32x4;
      expect(op).toBeDefined();
      expect(op.value).toBe(253);
      expect(op.mnemonic).toBe("f64x2.promote_low_f32x4");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("simd");
    });

  });

  describe('atomics', () => {
    test('memory_atomic_notify', () => {
      const op = (OpCodes as any).memory_atomic_notify;
      expect(op).toBeDefined();
      expect(op.value).toBe(0);
      expect(op.mnemonic).toBe("memory.atomic.notify");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('memory_atomic_wait32', () => {
      const op = (OpCodes as any).memory_atomic_wait32;
      expect(op).toBeDefined();
      expect(op.value).toBe(1);
      expect(op.mnemonic).toBe("memory.atomic.wait32");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('memory_atomic_wait64', () => {
      const op = (OpCodes as any).memory_atomic_wait64;
      expect(op).toBeDefined();
      expect(op.value).toBe(2);
      expect(op.mnemonic).toBe("memory.atomic.wait64");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('atomic_fence', () => {
      const op = (OpCodes as any).atomic_fence;
      expect(op).toBeDefined();
      expect(op.value).toBe(3);
      expect(op.mnemonic).toBe("atomic.fence");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_load', () => {
      const op = (OpCodes as any).i32_atomic_load;
      expect(op).toBeDefined();
      expect(op.value).toBe(16);
      expect(op.mnemonic).toBe("i32.atomic.load");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_load', () => {
      const op = (OpCodes as any).i64_atomic_load;
      expect(op).toBeDefined();
      expect(op.value).toBe(17);
      expect(op.mnemonic).toBe("i64.atomic.load");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_load8_u', () => {
      const op = (OpCodes as any).i32_atomic_load8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(18);
      expect(op.mnemonic).toBe("i32.atomic.load8_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_load16_u', () => {
      const op = (OpCodes as any).i32_atomic_load16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(19);
      expect(op.mnemonic).toBe("i32.atomic.load16_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_load8_u', () => {
      const op = (OpCodes as any).i64_atomic_load8_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(20);
      expect(op.mnemonic).toBe("i64.atomic.load8_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_load16_u', () => {
      const op = (OpCodes as any).i64_atomic_load16_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(21);
      expect(op.mnemonic).toBe("i64.atomic.load16_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_load32_u', () => {
      const op = (OpCodes as any).i64_atomic_load32_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(22);
      expect(op.mnemonic).toBe("i64.atomic.load32_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_store', () => {
      const op = (OpCodes as any).i32_atomic_store;
      expect(op).toBeDefined();
      expect(op.value).toBe(23);
      expect(op.mnemonic).toBe("i32.atomic.store");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_store', () => {
      const op = (OpCodes as any).i64_atomic_store;
      expect(op).toBeDefined();
      expect(op.value).toBe(24);
      expect(op.mnemonic).toBe("i64.atomic.store");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_store8', () => {
      const op = (OpCodes as any).i32_atomic_store8;
      expect(op).toBeDefined();
      expect(op.value).toBe(25);
      expect(op.mnemonic).toBe("i32.atomic.store8");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_store16', () => {
      const op = (OpCodes as any).i32_atomic_store16;
      expect(op).toBeDefined();
      expect(op.value).toBe(26);
      expect(op.mnemonic).toBe("i32.atomic.store16");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_store8', () => {
      const op = (OpCodes as any).i64_atomic_store8;
      expect(op).toBeDefined();
      expect(op.value).toBe(27);
      expect(op.mnemonic).toBe("i64.atomic.store8");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_store16', () => {
      const op = (OpCodes as any).i64_atomic_store16;
      expect(op).toBeDefined();
      expect(op.value).toBe(28);
      expect(op.mnemonic).toBe("i64.atomic.store16");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_store32', () => {
      const op = (OpCodes as any).i64_atomic_store32;
      expect(op).toBeDefined();
      expect(op.value).toBe(29);
      expect(op.mnemonic).toBe("i64.atomic.store32");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw_add', () => {
      const op = (OpCodes as any).i32_atomic_rmw_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(30);
      expect(op.mnemonic).toBe("i32.atomic.rmw.add");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw_add', () => {
      const op = (OpCodes as any).i64_atomic_rmw_add;
      expect(op).toBeDefined();
      expect(op.value).toBe(31);
      expect(op.mnemonic).toBe("i64.atomic.rmw.add");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw8_add_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw8_add_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(32);
      expect(op.mnemonic).toBe("i32.atomic.rmw8.add_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw16_add_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw16_add_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(33);
      expect(op.mnemonic).toBe("i32.atomic.rmw16.add_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw8_add_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw8_add_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(34);
      expect(op.mnemonic).toBe("i64.atomic.rmw8.add_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw16_add_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw16_add_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(35);
      expect(op.mnemonic).toBe("i64.atomic.rmw16.add_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw32_add_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw32_add_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(36);
      expect(op.mnemonic).toBe("i64.atomic.rmw32.add_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw_sub', () => {
      const op = (OpCodes as any).i32_atomic_rmw_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(37);
      expect(op.mnemonic).toBe("i32.atomic.rmw.sub");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw_sub', () => {
      const op = (OpCodes as any).i64_atomic_rmw_sub;
      expect(op).toBeDefined();
      expect(op.value).toBe(38);
      expect(op.mnemonic).toBe("i64.atomic.rmw.sub");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw8_sub_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw8_sub_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(39);
      expect(op.mnemonic).toBe("i32.atomic.rmw8.sub_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw16_sub_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw16_sub_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(40);
      expect(op.mnemonic).toBe("i32.atomic.rmw16.sub_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw8_sub_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw8_sub_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(41);
      expect(op.mnemonic).toBe("i64.atomic.rmw8.sub_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw16_sub_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw16_sub_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(42);
      expect(op.mnemonic).toBe("i64.atomic.rmw16.sub_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw32_sub_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw32_sub_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(43);
      expect(op.mnemonic).toBe("i64.atomic.rmw32.sub_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw_and', () => {
      const op = (OpCodes as any).i32_atomic_rmw_and;
      expect(op).toBeDefined();
      expect(op.value).toBe(44);
      expect(op.mnemonic).toBe("i32.atomic.rmw.and");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw_and', () => {
      const op = (OpCodes as any).i64_atomic_rmw_and;
      expect(op).toBeDefined();
      expect(op.value).toBe(45);
      expect(op.mnemonic).toBe("i64.atomic.rmw.and");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw8_and_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw8_and_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(46);
      expect(op.mnemonic).toBe("i32.atomic.rmw8.and_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw16_and_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw16_and_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(47);
      expect(op.mnemonic).toBe("i32.atomic.rmw16.and_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw8_and_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw8_and_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(48);
      expect(op.mnemonic).toBe("i64.atomic.rmw8.and_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw16_and_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw16_and_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(49);
      expect(op.mnemonic).toBe("i64.atomic.rmw16.and_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw32_and_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw32_and_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(50);
      expect(op.mnemonic).toBe("i64.atomic.rmw32.and_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw_or', () => {
      const op = (OpCodes as any).i32_atomic_rmw_or;
      expect(op).toBeDefined();
      expect(op.value).toBe(51);
      expect(op.mnemonic).toBe("i32.atomic.rmw.or");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw_or', () => {
      const op = (OpCodes as any).i64_atomic_rmw_or;
      expect(op).toBeDefined();
      expect(op.value).toBe(52);
      expect(op.mnemonic).toBe("i64.atomic.rmw.or");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw8_or_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw8_or_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(53);
      expect(op.mnemonic).toBe("i32.atomic.rmw8.or_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw16_or_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw16_or_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(54);
      expect(op.mnemonic).toBe("i32.atomic.rmw16.or_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw8_or_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw8_or_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(55);
      expect(op.mnemonic).toBe("i64.atomic.rmw8.or_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw16_or_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw16_or_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(56);
      expect(op.mnemonic).toBe("i64.atomic.rmw16.or_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw32_or_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw32_or_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(57);
      expect(op.mnemonic).toBe("i64.atomic.rmw32.or_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw_xor', () => {
      const op = (OpCodes as any).i32_atomic_rmw_xor;
      expect(op).toBeDefined();
      expect(op.value).toBe(58);
      expect(op.mnemonic).toBe("i32.atomic.rmw.xor");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw_xor', () => {
      const op = (OpCodes as any).i64_atomic_rmw_xor;
      expect(op).toBeDefined();
      expect(op.value).toBe(59);
      expect(op.mnemonic).toBe("i64.atomic.rmw.xor");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw8_xor_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw8_xor_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(60);
      expect(op.mnemonic).toBe("i32.atomic.rmw8.xor_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw16_xor_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw16_xor_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(61);
      expect(op.mnemonic).toBe("i32.atomic.rmw16.xor_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw8_xor_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw8_xor_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(62);
      expect(op.mnemonic).toBe("i64.atomic.rmw8.xor_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw16_xor_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw16_xor_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(63);
      expect(op.mnemonic).toBe("i64.atomic.rmw16.xor_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw32_xor_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw32_xor_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(64);
      expect(op.mnemonic).toBe("i64.atomic.rmw32.xor_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw_xchg', () => {
      const op = (OpCodes as any).i32_atomic_rmw_xchg;
      expect(op).toBeDefined();
      expect(op.value).toBe(65);
      expect(op.mnemonic).toBe("i32.atomic.rmw.xchg");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw_xchg', () => {
      const op = (OpCodes as any).i64_atomic_rmw_xchg;
      expect(op).toBeDefined();
      expect(op.value).toBe(66);
      expect(op.mnemonic).toBe("i64.atomic.rmw.xchg");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw8_xchg_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw8_xchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(67);
      expect(op.mnemonic).toBe("i32.atomic.rmw8.xchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw16_xchg_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw16_xchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(68);
      expect(op.mnemonic).toBe("i32.atomic.rmw16.xchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw8_xchg_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw8_xchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(69);
      expect(op.mnemonic).toBe("i64.atomic.rmw8.xchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw16_xchg_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw16_xchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(70);
      expect(op.mnemonic).toBe("i64.atomic.rmw16.xchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw32_xchg_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw32_xchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(71);
      expect(op.mnemonic).toBe("i64.atomic.rmw32.xchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw_cmpxchg', () => {
      const op = (OpCodes as any).i32_atomic_rmw_cmpxchg;
      expect(op).toBeDefined();
      expect(op.value).toBe(72);
      expect(op.mnemonic).toBe("i32.atomic.rmw.cmpxchg");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw_cmpxchg', () => {
      const op = (OpCodes as any).i64_atomic_rmw_cmpxchg;
      expect(op).toBeDefined();
      expect(op.value).toBe(73);
      expect(op.mnemonic).toBe("i64.atomic.rmw.cmpxchg");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw8_cmpxchg_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw8_cmpxchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(74);
      expect(op.mnemonic).toBe("i32.atomic.rmw8.cmpxchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i32_atomic_rmw16_cmpxchg_u', () => {
      const op = (OpCodes as any).i32_atomic_rmw16_cmpxchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(75);
      expect(op.mnemonic).toBe("i32.atomic.rmw16.cmpxchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw8_cmpxchg_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw8_cmpxchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(76);
      expect(op.mnemonic).toBe("i64.atomic.rmw8.cmpxchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw16_cmpxchg_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw16_cmpxchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(77);
      expect(op.mnemonic).toBe("i64.atomic.rmw16.cmpxchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

    test('i64_atomic_rmw32_cmpxchg_u', () => {
      const op = (OpCodes as any).i64_atomic_rmw32_cmpxchg_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(78);
      expect(op.mnemonic).toBe("i64.atomic.rmw32.cmpxchg_u");
      expect(op.prefix).toBe(254);
      expect(op.feature).toBe("threads");
    });

  });

  describe('relaxed-simd', () => {
    test('i8x16_relaxed_swizzle', () => {
      const op = (OpCodes as any).i8x16_relaxed_swizzle;
      expect(op).toBeDefined();
      expect(op.value).toBe(256);
      expect(op.mnemonic).toBe("i8x16.relaxed_swizzle");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i32x4_relaxed_trunc_f32x4_s', () => {
      const op = (OpCodes as any).i32x4_relaxed_trunc_f32x4_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(257);
      expect(op.mnemonic).toBe("i32x4.relaxed_trunc_f32x4_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i32x4_relaxed_trunc_f32x4_u', () => {
      const op = (OpCodes as any).i32x4_relaxed_trunc_f32x4_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(258);
      expect(op.mnemonic).toBe("i32x4.relaxed_trunc_f32x4_u");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i32x4_relaxed_trunc_f64x2_s_zero', () => {
      const op = (OpCodes as any).i32x4_relaxed_trunc_f64x2_s_zero;
      expect(op).toBeDefined();
      expect(op.value).toBe(259);
      expect(op.mnemonic).toBe("i32x4.relaxed_trunc_f64x2_s_zero");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i32x4_relaxed_trunc_f64x2_u_zero', () => {
      const op = (OpCodes as any).i32x4_relaxed_trunc_f64x2_u_zero;
      expect(op).toBeDefined();
      expect(op.value).toBe(260);
      expect(op.mnemonic).toBe("i32x4.relaxed_trunc_f64x2_u_zero");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f32x4_relaxed_madd', () => {
      const op = (OpCodes as any).f32x4_relaxed_madd;
      expect(op).toBeDefined();
      expect(op.value).toBe(261);
      expect(op.mnemonic).toBe("f32x4.relaxed_madd");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f32x4_relaxed_nmadd', () => {
      const op = (OpCodes as any).f32x4_relaxed_nmadd;
      expect(op).toBeDefined();
      expect(op.value).toBe(262);
      expect(op.mnemonic).toBe("f32x4.relaxed_nmadd");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f64x2_relaxed_madd', () => {
      const op = (OpCodes as any).f64x2_relaxed_madd;
      expect(op).toBeDefined();
      expect(op.value).toBe(263);
      expect(op.mnemonic).toBe("f64x2.relaxed_madd");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f64x2_relaxed_nmadd', () => {
      const op = (OpCodes as any).f64x2_relaxed_nmadd;
      expect(op).toBeDefined();
      expect(op.value).toBe(264);
      expect(op.mnemonic).toBe("f64x2.relaxed_nmadd");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i8x16_relaxed_laneselect', () => {
      const op = (OpCodes as any).i8x16_relaxed_laneselect;
      expect(op).toBeDefined();
      expect(op.value).toBe(265);
      expect(op.mnemonic).toBe("i8x16.relaxed_laneselect");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i16x8_relaxed_laneselect', () => {
      const op = (OpCodes as any).i16x8_relaxed_laneselect;
      expect(op).toBeDefined();
      expect(op.value).toBe(266);
      expect(op.mnemonic).toBe("i16x8.relaxed_laneselect");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i32x4_relaxed_laneselect', () => {
      const op = (OpCodes as any).i32x4_relaxed_laneselect;
      expect(op).toBeDefined();
      expect(op.value).toBe(267);
      expect(op.mnemonic).toBe("i32x4.relaxed_laneselect");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i64x2_relaxed_laneselect', () => {
      const op = (OpCodes as any).i64x2_relaxed_laneselect;
      expect(op).toBeDefined();
      expect(op.value).toBe(268);
      expect(op.mnemonic).toBe("i64x2.relaxed_laneselect");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f32x4_relaxed_min', () => {
      const op = (OpCodes as any).f32x4_relaxed_min;
      expect(op).toBeDefined();
      expect(op.value).toBe(269);
      expect(op.mnemonic).toBe("f32x4.relaxed_min");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f32x4_relaxed_max', () => {
      const op = (OpCodes as any).f32x4_relaxed_max;
      expect(op).toBeDefined();
      expect(op.value).toBe(270);
      expect(op.mnemonic).toBe("f32x4.relaxed_max");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f64x2_relaxed_min', () => {
      const op = (OpCodes as any).f64x2_relaxed_min;
      expect(op).toBeDefined();
      expect(op.value).toBe(271);
      expect(op.mnemonic).toBe("f64x2.relaxed_min");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('f64x2_relaxed_max', () => {
      const op = (OpCodes as any).f64x2_relaxed_max;
      expect(op).toBeDefined();
      expect(op.value).toBe(272);
      expect(op.mnemonic).toBe("f64x2.relaxed_max");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i16x8_relaxed_q15mulr_s', () => {
      const op = (OpCodes as any).i16x8_relaxed_q15mulr_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(273);
      expect(op.mnemonic).toBe("i16x8.relaxed_q15mulr_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i16x8_relaxed_dot_i8x16_i7x16_s', () => {
      const op = (OpCodes as any).i16x8_relaxed_dot_i8x16_i7x16_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(274);
      expect(op.mnemonic).toBe("i16x8.relaxed_dot_i8x16_i7x16_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

    test('i32x4_relaxed_dot_i8x16_i7x16_add_s', () => {
      const op = (OpCodes as any).i32x4_relaxed_dot_i8x16_i7x16_add_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(275);
      expect(op.mnemonic).toBe("i32x4.relaxed_dot_i8x16_i7x16_add_s");
      expect(op.prefix).toBe(253);
      expect(op.feature).toBe("relaxed-simd");
    });

  });

  describe('gc-struct', () => {
    test('struct_new', () => {
      const op = (OpCodes as any).struct_new;
      expect(op).toBeDefined();
      expect(op.value).toBe(0);
      expect(op.mnemonic).toBe("struct.new");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('struct_new_default', () => {
      const op = (OpCodes as any).struct_new_default;
      expect(op).toBeDefined();
      expect(op.value).toBe(1);
      expect(op.mnemonic).toBe("struct.new_default");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('struct_get', () => {
      const op = (OpCodes as any).struct_get;
      expect(op).toBeDefined();
      expect(op.value).toBe(2);
      expect(op.mnemonic).toBe("struct.get");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('struct_get_s', () => {
      const op = (OpCodes as any).struct_get_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(3);
      expect(op.mnemonic).toBe("struct.get_s");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('struct_get_u', () => {
      const op = (OpCodes as any).struct_get_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(4);
      expect(op.mnemonic).toBe("struct.get_u");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('struct_set', () => {
      const op = (OpCodes as any).struct_set;
      expect(op).toBeDefined();
      expect(op.value).toBe(5);
      expect(op.mnemonic).toBe("struct.set");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

  });

  describe('gc-array', () => {
    test('array_new', () => {
      const op = (OpCodes as any).array_new;
      expect(op).toBeDefined();
      expect(op.value).toBe(6);
      expect(op.mnemonic).toBe("array.new");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_new_default', () => {
      const op = (OpCodes as any).array_new_default;
      expect(op).toBeDefined();
      expect(op.value).toBe(7);
      expect(op.mnemonic).toBe("array.new_default");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_new_fixed', () => {
      const op = (OpCodes as any).array_new_fixed;
      expect(op).toBeDefined();
      expect(op.value).toBe(8);
      expect(op.mnemonic).toBe("array.new_fixed");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_new_data', () => {
      const op = (OpCodes as any).array_new_data;
      expect(op).toBeDefined();
      expect(op.value).toBe(9);
      expect(op.mnemonic).toBe("array.new_data");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_new_elem', () => {
      const op = (OpCodes as any).array_new_elem;
      expect(op).toBeDefined();
      expect(op.value).toBe(10);
      expect(op.mnemonic).toBe("array.new_elem");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_get', () => {
      const op = (OpCodes as any).array_get;
      expect(op).toBeDefined();
      expect(op.value).toBe(11);
      expect(op.mnemonic).toBe("array.get");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_get_s', () => {
      const op = (OpCodes as any).array_get_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(12);
      expect(op.mnemonic).toBe("array.get_s");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_get_u', () => {
      const op = (OpCodes as any).array_get_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(13);
      expect(op.mnemonic).toBe("array.get_u");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_set', () => {
      const op = (OpCodes as any).array_set;
      expect(op).toBeDefined();
      expect(op.value).toBe(14);
      expect(op.mnemonic).toBe("array.set");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_len', () => {
      const op = (OpCodes as any).array_len;
      expect(op).toBeDefined();
      expect(op.value).toBe(15);
      expect(op.mnemonic).toBe("array.len");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_fill', () => {
      const op = (OpCodes as any).array_fill;
      expect(op).toBeDefined();
      expect(op.value).toBe(16);
      expect(op.mnemonic).toBe("array.fill");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_copy', () => {
      const op = (OpCodes as any).array_copy;
      expect(op).toBeDefined();
      expect(op.value).toBe(17);
      expect(op.mnemonic).toBe("array.copy");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_init_data', () => {
      const op = (OpCodes as any).array_init_data;
      expect(op).toBeDefined();
      expect(op.value).toBe(18);
      expect(op.mnemonic).toBe("array.init_data");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('array_init_elem', () => {
      const op = (OpCodes as any).array_init_elem;
      expect(op).toBeDefined();
      expect(op.value).toBe(19);
      expect(op.mnemonic).toBe("array.init_elem");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

  });

  describe('gc-cast', () => {
    test('ref_test', () => {
      const op = (OpCodes as any).ref_test;
      expect(op).toBeDefined();
      expect(op.value).toBe(20);
      expect(op.mnemonic).toBe("ref.test");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('ref_test_null', () => {
      const op = (OpCodes as any).ref_test_null;
      expect(op).toBeDefined();
      expect(op.value).toBe(21);
      expect(op.mnemonic).toBe("ref.test null");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('ref_cast', () => {
      const op = (OpCodes as any).ref_cast;
      expect(op).toBeDefined();
      expect(op.value).toBe(22);
      expect(op.mnemonic).toBe("ref.cast");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('ref_cast_null', () => {
      const op = (OpCodes as any).ref_cast_null;
      expect(op).toBeDefined();
      expect(op.value).toBe(23);
      expect(op.mnemonic).toBe("ref.cast null");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('br_on_cast', () => {
      const op = (OpCodes as any).br_on_cast;
      expect(op).toBeDefined();
      expect(op.value).toBe(24);
      expect(op.mnemonic).toBe("br_on_cast");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('br_on_cast_fail', () => {
      const op = (OpCodes as any).br_on_cast_fail;
      expect(op).toBeDefined();
      expect(op.value).toBe(25);
      expect(op.mnemonic).toBe("br_on_cast_fail");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

  });

  describe('gc-conversion', () => {
    test('any_convert_extern', () => {
      const op = (OpCodes as any).any_convert_extern;
      expect(op).toBeDefined();
      expect(op.value).toBe(26);
      expect(op.mnemonic).toBe("any.convert_extern");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('extern_convert_any', () => {
      const op = (OpCodes as any).extern_convert_any;
      expect(op).toBeDefined();
      expect(op.value).toBe(27);
      expect(op.mnemonic).toBe("extern.convert_any");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

  });

  describe('gc-i31', () => {
    test('ref_i31', () => {
      const op = (OpCodes as any).ref_i31;
      expect(op).toBeDefined();
      expect(op.value).toBe(28);
      expect(op.mnemonic).toBe("ref.i31");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('i31_get_s', () => {
      const op = (OpCodes as any).i31_get_s;
      expect(op).toBeDefined();
      expect(op.value).toBe(29);
      expect(op.mnemonic).toBe("i31.get_s");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

    test('i31_get_u', () => {
      const op = (OpCodes as any).i31_get_u;
      expect(op).toBeDefined();
      expect(op.value).toBe(30);
      expect(op.mnemonic).toBe("i31.get_u");
      expect(op.prefix).toBe(251);
      expect(op.feature).toBe("gc");
    });

  });

  describe('feature groups', () => {
    test('exception-handling: 6 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'exception-handling');
      expect(ops.length).toBe(6);
    });

    test('tail-call: 2 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'tail-call');
      expect(ops.length).toBe(2);
    });

    test('sign-extend: 5 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'sign-extend');
      expect(ops.length).toBe(5);
    });

    test('sat-trunc: 8 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'sat-trunc');
      expect(ops.length).toBe(8);
      ops.forEach((op: any) => expect(op.prefix).toBe(252));
    });

    test('bulk-memory: 7 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'bulk-memory');
      expect(ops.length).toBe(7);
      ops.forEach((op: any) => expect(op.prefix).toBe(252));
    });

    test('reference-types: 8 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'reference-types');
      expect(ops.length).toBe(8);
    });

    test('simd: 236 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'simd');
      expect(ops.length).toBe(236);
      ops.forEach((op: any) => expect(op.prefix).toBe(253));
    });

    test('threads: 67 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'threads');
      expect(ops.length).toBe(67);
      ops.forEach((op: any) => expect(op.prefix).toBe(254));
    });

    test('relaxed-simd: 20 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'relaxed-simd');
      expect(ops.length).toBe(20);
      ops.forEach((op: any) => expect(op.prefix).toBe(253));
    });

    test('gc: 31 opcodes', () => {
      const ops = Object.values(OpCodes).filter((op: any) => op.feature === 'gc');
      expect(ops.length).toBe(31);
      ops.forEach((op: any) => expect(op.prefix).toBe(251));
    });

  });
});

describe('Emitter methods', () => {
  describe('control-flow', () => {
    test('unreachable', () => {
      expect(typeof (OpCodeEmitter.prototype as any).unreachable).toBe('function');
    });

    test('nop', () => {
      expect(typeof (OpCodeEmitter.prototype as any).nop).toBe('function');
    });

    test('block', () => {
      expect(typeof (OpCodeEmitter.prototype as any).block).toBe('function');
    });

    test('loop', () => {
      expect(typeof (OpCodeEmitter.prototype as any).loop).toBe('function');
    });

    test('if', () => {
      expect(typeof (OpCodeEmitter.prototype as any).if).toBe('function');
    });

    test('else', () => {
      expect(typeof (OpCodeEmitter.prototype as any).else).toBe('function');
    });

    test('end', () => {
      expect(typeof (OpCodeEmitter.prototype as any).end).toBe('function');
    });

    test('br', () => {
      expect(typeof (OpCodeEmitter.prototype as any).br).toBe('function');
    });

    test('br_if', () => {
      expect(typeof (OpCodeEmitter.prototype as any).br_if).toBe('function');
    });

    test('br_table', () => {
      expect(typeof (OpCodeEmitter.prototype as any).br_table).toBe('function');
    });

    test('return', () => {
      expect(typeof (OpCodeEmitter.prototype as any).return).toBe('function');
    });

  });

  describe('exception-handling', () => {
    test('try', () => {
      expect(typeof (OpCodeEmitter.prototype as any).try).toBe('function');
    });

    test('catch', () => {
      expect(typeof (OpCodeEmitter.prototype as any).catch).toBe('function');
    });

    test('throw', () => {
      expect(typeof (OpCodeEmitter.prototype as any).throw).toBe('function');
    });

    test('rethrow', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rethrow).toBe('function');
    });

    test('delegate', () => {
      expect(typeof (OpCodeEmitter.prototype as any).delegate).toBe('function');
    });

    test('catch_all', () => {
      expect(typeof (OpCodeEmitter.prototype as any).catch_all).toBe('function');
    });

  });

  describe('call', () => {
    test('call', () => {
      expect(typeof (OpCodeEmitter.prototype as any).call).toBe('function');
    });

    test('call_indirect', () => {
      expect(typeof (OpCodeEmitter.prototype as any).call_indirect).toBe('function');
    });

    test('return_call', () => {
      expect(typeof (OpCodeEmitter.prototype as any).return_call).toBe('function');
    });

    test('return_call_indirect', () => {
      expect(typeof (OpCodeEmitter.prototype as any).return_call_indirect).toBe('function');
    });

  });

  describe('parametric', () => {
    test('drop', () => {
      expect(typeof (OpCodeEmitter.prototype as any).drop).toBe('function');
    });

    test('select', () => {
      expect(typeof (OpCodeEmitter.prototype as any).select).toBe('function');
    });

  });

  describe('variable', () => {
    test('get_local', () => {
      expect(typeof (OpCodeEmitter.prototype as any).get_local).toBe('function');
    });

    test('set_local', () => {
      expect(typeof (OpCodeEmitter.prototype as any).set_local).toBe('function');
    });

    test('tee_local', () => {
      expect(typeof (OpCodeEmitter.prototype as any).tee_local).toBe('function');
    });

    test('get_global', () => {
      expect(typeof (OpCodeEmitter.prototype as any).get_global).toBe('function');
    });

    test('set_global', () => {
      expect(typeof (OpCodeEmitter.prototype as any).set_global).toBe('function');
    });

  });

  describe('memory', () => {
    test('load_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load_i32).toBe('function');
    });

    test('load_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load_i64).toBe('function');
    });

    test('load_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load_f32).toBe('function');
    });

    test('load_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load_f64).toBe('function');
    });

    test('load8_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8_i32).toBe('function');
    });

    test('load8_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8_i32_u).toBe('function');
    });

    test('load16_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16_i32).toBe('function');
    });

    test('load16_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16_i32_u).toBe('function');
    });

    test('load8_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8_i64).toBe('function');
    });

    test('load8_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8_i64_u).toBe('function');
    });

    test('load16_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16_i64).toBe('function');
    });

    test('load16_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16_i64_u).toBe('function');
    });

    test('load32_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load32_i64).toBe('function');
    });

    test('load32_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load32_i64_u).toBe('function');
    });

    test('store_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store_i32).toBe('function');
    });

    test('store_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store_i64).toBe('function');
    });

    test('store_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store_f32).toBe('function');
    });

    test('store_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store_f64).toBe('function');
    });

    test('store8_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store8_i32).toBe('function');
    });

    test('store16_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store16_i32).toBe('function');
    });

    test('store8_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store8_i64).toBe('function');
    });

    test('store16_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store16_i64).toBe('function');
    });

    test('store32_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store32_i64).toBe('function');
    });

    test('mem_size', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mem_size).toBe('function');
    });

    test('mem_grow', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mem_grow).toBe('function');
    });

  });

  describe('constant', () => {
    test('const_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).const_i32).toBe('function');
    });

    test('const_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).const_i64).toBe('function');
    });

    test('const_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).const_f32).toBe('function');
    });

    test('const_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).const_f64).toBe('function');
    });

  });

  describe('i32-comparison', () => {
    test('eqz_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eqz_i32).toBe('function');
    });

    test('eq_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_i32).toBe('function');
    });

    test('ne_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_i32).toBe('function');
    });

    test('lt_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_i32).toBe('function');
    });

    test('lt_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_i32_u).toBe('function');
    });

    test('gt_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_i32).toBe('function');
    });

    test('gt_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_i32_u).toBe('function');
    });

    test('le_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_i32).toBe('function');
    });

    test('le_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_i32_u).toBe('function');
    });

    test('ge_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_i32).toBe('function');
    });

    test('ge_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_i32_u).toBe('function');
    });

  });

  describe('i64-comparison', () => {
    test('eqz_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eqz_i64).toBe('function');
    });

    test('eq_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_i64).toBe('function');
    });

    test('ne_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_i64).toBe('function');
    });

    test('lt_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_i64).toBe('function');
    });

    test('lt_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_i64_u).toBe('function');
    });

    test('gt_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_i64).toBe('function');
    });

    test('gt_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_i64_u).toBe('function');
    });

    test('le_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_i64).toBe('function');
    });

    test('le_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_i64_u).toBe('function');
    });

    test('ge_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_i64).toBe('function');
    });

    test('ge_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_i64_u).toBe('function');
    });

  });

  describe('f32-comparison', () => {
    test('eq_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_f32).toBe('function');
    });

    test('ne_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_f32).toBe('function');
    });

    test('lt_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_f32).toBe('function');
    });

    test('gt_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_f32).toBe('function');
    });

    test('le_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_f32).toBe('function');
    });

    test('ge_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_f32).toBe('function');
    });

  });

  describe('f64-comparison', () => {
    test('eq_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_f64).toBe('function');
    });

    test('ne_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_f64).toBe('function');
    });

    test('lt_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_f64).toBe('function');
    });

    test('gt_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_f64).toBe('function');
    });

    test('le_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_f64).toBe('function');
    });

    test('ge_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_f64).toBe('function');
    });

  });

  describe('i32-bitwise', () => {
    test('clz_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).clz_i32).toBe('function');
    });

    test('ctz_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ctz_i32).toBe('function');
    });

    test('popcnt_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).popcnt_i32).toBe('function');
    });

    test('and_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).and_i32).toBe('function');
    });

    test('or_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).or_i32).toBe('function');
    });

    test('xor_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).xor_i32).toBe('function');
    });

    test('shl_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shl_i32).toBe('function');
    });

    test('shr_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_i32).toBe('function');
    });

    test('shr_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_i32_u).toBe('function');
    });

    test('rotl_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rotl_i32).toBe('function');
    });

    test('rotr_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rotr_i32).toBe('function');
    });

  });

  describe('i32-arithmetic', () => {
    test('add_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_i32).toBe('function');
    });

    test('sub_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_i32).toBe('function');
    });

    test('mul_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_i32).toBe('function');
    });

    test('div_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_i32).toBe('function');
    });

    test('div_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_i32_u).toBe('function');
    });

    test('rem_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rem_i32).toBe('function');
    });

    test('rem_i32_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rem_i32_u).toBe('function');
    });

  });

  describe('i64-bitwise', () => {
    test('clz_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).clz_i64).toBe('function');
    });

    test('ctz_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ctz_i64).toBe('function');
    });

    test('popcnt_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).popcnt_i64).toBe('function');
    });

    test('and_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).and_i64).toBe('function');
    });

    test('or_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).or_i64).toBe('function');
    });

    test('xor_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).xor_i64).toBe('function');
    });

    test('shl_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shl_i64).toBe('function');
    });

    test('shr_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_i64).toBe('function');
    });

    test('shr_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_i64_u).toBe('function');
    });

    test('rotl_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rotl_i64).toBe('function');
    });

    test('rotr_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rotr_i64).toBe('function');
    });

  });

  describe('i64-arithmetic', () => {
    test('add_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_i64).toBe('function');
    });

    test('sub_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_i64).toBe('function');
    });

    test('mul_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_i64).toBe('function');
    });

    test('div_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_i64).toBe('function');
    });

    test('div_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_i64_u).toBe('function');
    });

    test('rem_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rem_i64).toBe('function');
    });

    test('rem_i64_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).rem_i64_u).toBe('function');
    });

  });

  describe('f32-arithmetic', () => {
    test('abs_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_f32).toBe('function');
    });

    test('neg_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_f32).toBe('function');
    });

    test('ceil_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ceil_f32).toBe('function');
    });

    test('floor_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).floor_f32).toBe('function');
    });

    test('trunc_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f32).toBe('function');
    });

    test('nearest_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).nearest_f32).toBe('function');
    });

    test('sqrt_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sqrt_f32).toBe('function');
    });

    test('add_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_f32).toBe('function');
    });

    test('sub_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_f32).toBe('function');
    });

    test('mul_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_f32).toBe('function');
    });

    test('div_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_f32).toBe('function');
    });

    test('min_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_f32).toBe('function');
    });

    test('max_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_f32).toBe('function');
    });

    test('copysign_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).copysign_f32).toBe('function');
    });

  });

  describe('f64-arithmetic', () => {
    test('abs_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_f64).toBe('function');
    });

    test('neg_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_f64).toBe('function');
    });

    test('ceil_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ceil_f64).toBe('function');
    });

    test('floor_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).floor_f64).toBe('function');
    });

    test('trunc_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f64).toBe('function');
    });

    test('nearest_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).nearest_f64).toBe('function');
    });

    test('sqrt_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sqrt_f64).toBe('function');
    });

    test('add_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_f64).toBe('function');
    });

    test('sub_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_f64).toBe('function');
    });

    test('mul_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_f64).toBe('function');
    });

    test('div_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_f64).toBe('function');
    });

    test('min_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_f64).toBe('function');
    });

    test('max_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_f64).toBe('function');
    });

    test('copysign_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).copysign_f64).toBe('function');
    });

  });

  describe('conversion', () => {
    test('wrap_i64_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).wrap_i64_i32).toBe('function');
    });

    test('trunc_f32_s_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f32_s_i32).toBe('function');
    });

    test('trunc_f32_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f32_u_i32).toBe('function');
    });

    test('trunc_f64_s_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f64_s_i32).toBe('function');
    });

    test('trunc_f64_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f64_u_i32).toBe('function');
    });

    test('extend_i32_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_i32_s_i64).toBe('function');
    });

    test('extend_i32_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_i32_u_i64).toBe('function');
    });

    test('trunc_f32_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f32_s_i64).toBe('function');
    });

    test('trunc_f32_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f32_u_i64).toBe('function');
    });

    test('trunc_f64_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f64_s_i64).toBe('function');
    });

    test('trunc_f64_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f64_u_i64).toBe('function');
    });

    test('convert_i32_s_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i32_s_f32).toBe('function');
    });

    test('convert_i32_u_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i32_u_f32).toBe('function');
    });

    test('convert_i64_s_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i64_s_f32).toBe('function');
    });

    test('convert_i64_u_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i64_u_f32).toBe('function');
    });

    test('demote_f64_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).demote_f64_f32).toBe('function');
    });

    test('convert_i32_s_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i32_s_f64).toBe('function');
    });

    test('convert_i32_u_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i32_u_f64).toBe('function');
    });

    test('convert_i64_s_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i64_s_f64).toBe('function');
    });

    test('convert_i64_u_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i64_u_f64).toBe('function');
    });

    test('promote_f32_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).promote_f32_f64).toBe('function');
    });

    test('reinterpret_f32_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).reinterpret_f32_i32).toBe('function');
    });

    test('reinterpret_f64_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).reinterpret_f64_i64).toBe('function');
    });

    test('reinterpret_i32_f32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).reinterpret_i32_f32).toBe('function');
    });

    test('reinterpret_i64_f64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).reinterpret_i64_f64).toBe('function');
    });

  });

  describe('sign-extend', () => {
    test('extend8_s_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend8_s_i32).toBe('function');
    });

    test('extend16_s_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend16_s_i32).toBe('function');
    });

    test('extend8_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend8_s_i64).toBe('function');
    });

    test('extend16_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend16_s_i64).toBe('function');
    });

    test('extend32_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend32_s_i64).toBe('function');
    });

  });

  describe('sat-trunc', () => {
    test('trunc_sat_f32_s_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f32_s_i32).toBe('function');
    });

    test('trunc_sat_f32_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f32_u_i32).toBe('function');
    });

    test('trunc_sat_f64_s_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f64_s_i32).toBe('function');
    });

    test('trunc_sat_f64_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f64_u_i32).toBe('function');
    });

    test('trunc_sat_f32_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f32_s_i64).toBe('function');
    });

    test('trunc_sat_f32_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f32_u_i64).toBe('function');
    });

    test('trunc_sat_f64_s_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f64_s_i64).toBe('function');
    });

    test('trunc_sat_f64_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f64_u_i64).toBe('function');
    });

  });

  describe('bulk-memory', () => {
    test('memory_init', () => {
      expect(typeof (OpCodeEmitter.prototype as any).memory_init).toBe('function');
    });

    test('data_drop', () => {
      expect(typeof (OpCodeEmitter.prototype as any).data_drop).toBe('function');
    });

    test('memory_copy', () => {
      expect(typeof (OpCodeEmitter.prototype as any).memory_copy).toBe('function');
    });

    test('memory_fill', () => {
      expect(typeof (OpCodeEmitter.prototype as any).memory_fill).toBe('function');
    });

    test('table_init', () => {
      expect(typeof (OpCodeEmitter.prototype as any).table_init).toBe('function');
    });

    test('elem_drop', () => {
      expect(typeof (OpCodeEmitter.prototype as any).elem_drop).toBe('function');
    });

    test('table_copy', () => {
      expect(typeof (OpCodeEmitter.prototype as any).table_copy).toBe('function');
    });

  });

  describe('reference-types', () => {
    test('table_grow', () => {
      expect(typeof (OpCodeEmitter.prototype as any).table_grow).toBe('function');
    });

    test('table_size', () => {
      expect(typeof (OpCodeEmitter.prototype as any).table_size).toBe('function');
    });

    test('table_fill', () => {
      expect(typeof (OpCodeEmitter.prototype as any).table_fill).toBe('function');
    });

    test('ref_null', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_null).toBe('function');
    });

    test('ref_is_null', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_is_null).toBe('function');
    });

    test('ref_func', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_func).toBe('function');
    });

    test('table_get', () => {
      expect(typeof (OpCodeEmitter.prototype as any).table_get).toBe('function');
    });

    test('table_set', () => {
      expect(typeof (OpCodeEmitter.prototype as any).table_set).toBe('function');
    });

  });

  describe('simd', () => {
    test('load_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load_v128).toBe('function');
    });

    test('load8x8_s_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8x8_s_v128).toBe('function');
    });

    test('load8x8_u_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8x8_u_v128).toBe('function');
    });

    test('load16x4_s_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16x4_s_v128).toBe('function');
    });

    test('load16x4_u_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16x4_u_v128).toBe('function');
    });

    test('load32x2_s_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load32x2_s_v128).toBe('function');
    });

    test('load32x2_u_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load32x2_u_v128).toBe('function');
    });

    test('load8_splat_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8_splat_v128).toBe('function');
    });

    test('load16_splat_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16_splat_v128).toBe('function');
    });

    test('load32_splat_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load32_splat_v128).toBe('function');
    });

    test('load64_splat_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load64_splat_v128).toBe('function');
    });

    test('store_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store_v128).toBe('function');
    });

    test('const_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).const_v128).toBe('function');
    });

    test('shuffle_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shuffle_i8x16).toBe('function');
    });

    test('swizzle_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).swizzle_i8x16).toBe('function');
    });

    test('splat_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).splat_i8x16).toBe('function');
    });

    test('splat_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).splat_i16x8).toBe('function');
    });

    test('splat_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).splat_i32x4).toBe('function');
    });

    test('splat_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).splat_i64x2).toBe('function');
    });

    test('splat_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).splat_f32x4).toBe('function');
    });

    test('splat_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).splat_f64x2).toBe('function');
    });

    test('extract_lane_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_s_i8x16).toBe('function');
    });

    test('extract_lane_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_u_i8x16).toBe('function');
    });

    test('replace_lane_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).replace_lane_i8x16).toBe('function');
    });

    test('extract_lane_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_s_i16x8).toBe('function');
    });

    test('extract_lane_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_u_i16x8).toBe('function');
    });

    test('replace_lane_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).replace_lane_i16x8).toBe('function');
    });

    test('extract_lane_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_i32x4).toBe('function');
    });

    test('replace_lane_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).replace_lane_i32x4).toBe('function');
    });

    test('extract_lane_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_i64x2).toBe('function');
    });

    test('replace_lane_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).replace_lane_i64x2).toBe('function');
    });

    test('extract_lane_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_f32x4).toBe('function');
    });

    test('replace_lane_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).replace_lane_f32x4).toBe('function');
    });

    test('extract_lane_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extract_lane_f64x2).toBe('function');
    });

    test('replace_lane_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).replace_lane_f64x2).toBe('function');
    });

    test('eq_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_i8x16).toBe('function');
    });

    test('ne_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_i8x16).toBe('function');
    });

    test('lt_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_s_i8x16).toBe('function');
    });

    test('lt_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_u_i8x16).toBe('function');
    });

    test('gt_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_s_i8x16).toBe('function');
    });

    test('gt_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_u_i8x16).toBe('function');
    });

    test('le_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_s_i8x16).toBe('function');
    });

    test('le_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_u_i8x16).toBe('function');
    });

    test('ge_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_s_i8x16).toBe('function');
    });

    test('ge_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_u_i8x16).toBe('function');
    });

    test('eq_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_i16x8).toBe('function');
    });

    test('ne_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_i16x8).toBe('function');
    });

    test('lt_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_s_i16x8).toBe('function');
    });

    test('lt_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_u_i16x8).toBe('function');
    });

    test('gt_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_s_i16x8).toBe('function');
    });

    test('gt_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_u_i16x8).toBe('function');
    });

    test('le_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_s_i16x8).toBe('function');
    });

    test('le_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_u_i16x8).toBe('function');
    });

    test('ge_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_s_i16x8).toBe('function');
    });

    test('ge_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_u_i16x8).toBe('function');
    });

    test('eq_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_i32x4).toBe('function');
    });

    test('ne_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_i32x4).toBe('function');
    });

    test('lt_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_s_i32x4).toBe('function');
    });

    test('lt_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_u_i32x4).toBe('function');
    });

    test('gt_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_s_i32x4).toBe('function');
    });

    test('gt_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_u_i32x4).toBe('function');
    });

    test('le_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_s_i32x4).toBe('function');
    });

    test('le_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_u_i32x4).toBe('function');
    });

    test('ge_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_s_i32x4).toBe('function');
    });

    test('ge_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_u_i32x4).toBe('function');
    });

    test('eq_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_f32x4).toBe('function');
    });

    test('ne_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_f32x4).toBe('function');
    });

    test('lt_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_f32x4).toBe('function');
    });

    test('gt_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_f32x4).toBe('function');
    });

    test('le_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_f32x4).toBe('function');
    });

    test('ge_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_f32x4).toBe('function');
    });

    test('eq_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_f64x2).toBe('function');
    });

    test('ne_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_f64x2).toBe('function');
    });

    test('lt_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_f64x2).toBe('function');
    });

    test('gt_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_f64x2).toBe('function');
    });

    test('le_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_f64x2).toBe('function');
    });

    test('ge_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_f64x2).toBe('function');
    });

    test('not_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).not_v128).toBe('function');
    });

    test('and_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).and_v128).toBe('function');
    });

    test('andnot_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).andnot_v128).toBe('function');
    });

    test('or_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).or_v128).toBe('function');
    });

    test('xor_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).xor_v128).toBe('function');
    });

    test('bitselect_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).bitselect_v128).toBe('function');
    });

    test('any_true_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).any_true_v128).toBe('function');
    });

    test('load8_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load8_lane_v128).toBe('function');
    });

    test('load16_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load16_lane_v128).toBe('function');
    });

    test('load32_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load32_lane_v128).toBe('function');
    });

    test('load64_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load64_lane_v128).toBe('function');
    });

    test('store8_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store8_lane_v128).toBe('function');
    });

    test('store16_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store16_lane_v128).toBe('function');
    });

    test('store32_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store32_lane_v128).toBe('function');
    });

    test('store64_lane_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).store64_lane_v128).toBe('function');
    });

    test('load32_zero_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load32_zero_v128).toBe('function');
    });

    test('load64_zero_v128', () => {
      expect(typeof (OpCodeEmitter.prototype as any).load64_zero_v128).toBe('function');
    });

    test('trunc_sat_f32x4_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f32x4_s_i32x4).toBe('function');
    });

    test('trunc_sat_f32x4_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f32x4_u_i32x4).toBe('function');
    });

    test('abs_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_i8x16).toBe('function');
    });

    test('neg_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_i8x16).toBe('function');
    });

    test('popcnt_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).popcnt_i8x16).toBe('function');
    });

    test('all_true_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).all_true_i8x16).toBe('function');
    });

    test('bitmask_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).bitmask_i8x16).toBe('function');
    });

    test('narrow_i16x8_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).narrow_i16x8_s_i8x16).toBe('function');
    });

    test('narrow_i16x8_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).narrow_i16x8_u_i8x16).toBe('function');
    });

    test('ceil_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ceil_f32x4).toBe('function');
    });

    test('floor_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).floor_f32x4).toBe('function');
    });

    test('trunc_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f32x4).toBe('function');
    });

    test('nearest_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).nearest_f32x4).toBe('function');
    });

    test('shl_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shl_i8x16).toBe('function');
    });

    test('shr_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_s_i8x16).toBe('function');
    });

    test('shr_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_u_i8x16).toBe('function');
    });

    test('add_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_i8x16).toBe('function');
    });

    test('add_sat_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_sat_s_i8x16).toBe('function');
    });

    test('add_sat_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_sat_u_i8x16).toBe('function');
    });

    test('sub_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_i8x16).toBe('function');
    });

    test('sub_sat_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_sat_s_i8x16).toBe('function');
    });

    test('sub_sat_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_sat_u_i8x16).toBe('function');
    });

    test('ceil_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ceil_f64x2).toBe('function');
    });

    test('floor_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).floor_f64x2).toBe('function');
    });

    test('min_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_s_i8x16).toBe('function');
    });

    test('min_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_u_i8x16).toBe('function');
    });

    test('max_s_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_s_i8x16).toBe('function');
    });

    test('max_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_u_i8x16).toBe('function');
    });

    test('trunc_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_f64x2).toBe('function');
    });

    test('avgr_u_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).avgr_u_i8x16).toBe('function');
    });

    test('extadd_pairwise_i8x16_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extadd_pairwise_i8x16_s_i16x8).toBe('function');
    });

    test('extadd_pairwise_i8x16_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extadd_pairwise_i8x16_u_i16x8).toBe('function');
    });

    test('extadd_pairwise_i16x8_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extadd_pairwise_i16x8_s_i32x4).toBe('function');
    });

    test('extadd_pairwise_i16x8_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extadd_pairwise_i16x8_u_i32x4).toBe('function');
    });

    test('abs_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_i16x8).toBe('function');
    });

    test('neg_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_i16x8).toBe('function');
    });

    test('q15mulr_sat_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).q15mulr_sat_s_i16x8).toBe('function');
    });

    test('all_true_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).all_true_i16x8).toBe('function');
    });

    test('bitmask_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).bitmask_i16x8).toBe('function');
    });

    test('narrow_i32x4_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).narrow_i32x4_s_i16x8).toBe('function');
    });

    test('narrow_i32x4_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).narrow_i32x4_u_i16x8).toBe('function');
    });

    test('extend_low_i8x16_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_low_i8x16_s_i16x8).toBe('function');
    });

    test('extend_high_i8x16_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_high_i8x16_s_i16x8).toBe('function');
    });

    test('extend_low_i8x16_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_low_i8x16_u_i16x8).toBe('function');
    });

    test('extend_high_i8x16_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_high_i8x16_u_i16x8).toBe('function');
    });

    test('shl_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shl_i16x8).toBe('function');
    });

    test('shr_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_s_i16x8).toBe('function');
    });

    test('shr_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_u_i16x8).toBe('function');
    });

    test('add_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_i16x8).toBe('function');
    });

    test('add_sat_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_sat_s_i16x8).toBe('function');
    });

    test('add_sat_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_sat_u_i16x8).toBe('function');
    });

    test('sub_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_i16x8).toBe('function');
    });

    test('sub_sat_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_sat_s_i16x8).toBe('function');
    });

    test('sub_sat_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_sat_u_i16x8).toBe('function');
    });

    test('nearest_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).nearest_f64x2).toBe('function');
    });

    test('mul_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_i16x8).toBe('function');
    });

    test('min_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_s_i16x8).toBe('function');
    });

    test('min_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_u_i16x8).toBe('function');
    });

    test('max_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_s_i16x8).toBe('function');
    });

    test('max_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_u_i16x8).toBe('function');
    });

    test('avgr_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).avgr_u_i16x8).toBe('function');
    });

    test('extmul_low_i8x16_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_low_i8x16_s_i16x8).toBe('function');
    });

    test('extmul_high_i8x16_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_high_i8x16_s_i16x8).toBe('function');
    });

    test('extmul_low_i8x16_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_low_i8x16_u_i16x8).toBe('function');
    });

    test('extmul_high_i8x16_u_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_high_i8x16_u_i16x8).toBe('function');
    });

    test('abs_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_i32x4).toBe('function');
    });

    test('neg_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_i32x4).toBe('function');
    });

    test('all_true_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).all_true_i32x4).toBe('function');
    });

    test('bitmask_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).bitmask_i32x4).toBe('function');
    });

    test('extend_low_i16x8_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_low_i16x8_s_i32x4).toBe('function');
    });

    test('extend_high_i16x8_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_high_i16x8_s_i32x4).toBe('function');
    });

    test('extend_low_i16x8_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_low_i16x8_u_i32x4).toBe('function');
    });

    test('extend_high_i16x8_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_high_i16x8_u_i32x4).toBe('function');
    });

    test('shl_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shl_i32x4).toBe('function');
    });

    test('shr_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_s_i32x4).toBe('function');
    });

    test('shr_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_u_i32x4).toBe('function');
    });

    test('add_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_i32x4).toBe('function');
    });

    test('convert_i32x4_s_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i32x4_s_f32x4).toBe('function');
    });

    test('convert_i32x4_u_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_i32x4_u_f32x4).toBe('function');
    });

    test('sub_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_i32x4).toBe('function');
    });

    test('mul_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_i32x4).toBe('function');
    });

    test('min_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_s_i32x4).toBe('function');
    });

    test('min_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_u_i32x4).toBe('function');
    });

    test('max_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_s_i32x4).toBe('function');
    });

    test('max_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_u_i32x4).toBe('function');
    });

    test('dot_i16x8_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).dot_i16x8_s_i32x4).toBe('function');
    });

    test('extmul_low_i16x8_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_low_i16x8_s_i32x4).toBe('function');
    });

    test('extmul_high_i16x8_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_high_i16x8_s_i32x4).toBe('function');
    });

    test('extmul_low_i16x8_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_low_i16x8_u_i32x4).toBe('function');
    });

    test('extmul_high_i16x8_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_high_i16x8_u_i32x4).toBe('function');
    });

    test('abs_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_i64x2).toBe('function');
    });

    test('neg_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_i64x2).toBe('function');
    });

    test('all_true_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).all_true_i64x2).toBe('function');
    });

    test('bitmask_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).bitmask_i64x2).toBe('function');
    });

    test('extend_low_i32x4_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_low_i32x4_s_i64x2).toBe('function');
    });

    test('extend_high_i32x4_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_high_i32x4_s_i64x2).toBe('function');
    });

    test('extend_low_i32x4_u_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_low_i32x4_u_i64x2).toBe('function');
    });

    test('extend_high_i32x4_u_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extend_high_i32x4_u_i64x2).toBe('function');
    });

    test('shl_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shl_i64x2).toBe('function');
    });

    test('shr_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_s_i64x2).toBe('function');
    });

    test('shr_u_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).shr_u_i64x2).toBe('function');
    });

    test('add_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_i64x2).toBe('function');
    });

    test('sub_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_i64x2).toBe('function');
    });

    test('mul_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_i64x2).toBe('function');
    });

    test('eq_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).eq_i64x2).toBe('function');
    });

    test('ne_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ne_i64x2).toBe('function');
    });

    test('lt_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).lt_s_i64x2).toBe('function');
    });

    test('gt_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).gt_s_i64x2).toBe('function');
    });

    test('le_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).le_s_i64x2).toBe('function');
    });

    test('ge_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ge_s_i64x2).toBe('function');
    });

    test('extmul_low_i32x4_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_low_i32x4_s_i64x2).toBe('function');
    });

    test('extmul_high_i32x4_s_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_high_i32x4_s_i64x2).toBe('function');
    });

    test('extmul_low_i32x4_u_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_low_i32x4_u_i64x2).toBe('function');
    });

    test('extmul_high_i32x4_u_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extmul_high_i32x4_u_i64x2).toBe('function');
    });

    test('abs_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_f32x4).toBe('function');
    });

    test('neg_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_f32x4).toBe('function');
    });

    test('sqrt_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sqrt_f32x4).toBe('function');
    });

    test('add_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_f32x4).toBe('function');
    });

    test('sub_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_f32x4).toBe('function');
    });

    test('mul_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_f32x4).toBe('function');
    });

    test('div_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_f32x4).toBe('function');
    });

    test('min_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_f32x4).toBe('function');
    });

    test('max_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_f32x4).toBe('function');
    });

    test('pmin_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).pmin_f32x4).toBe('function');
    });

    test('pmax_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).pmax_f32x4).toBe('function');
    });

    test('abs_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).abs_f64x2).toBe('function');
    });

    test('neg_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).neg_f64x2).toBe('function');
    });

    test('sqrt_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sqrt_f64x2).toBe('function');
    });

    test('add_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).add_f64x2).toBe('function');
    });

    test('sub_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).sub_f64x2).toBe('function');
    });

    test('mul_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).mul_f64x2).toBe('function');
    });

    test('div_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).div_f64x2).toBe('function');
    });

    test('min_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).min_f64x2).toBe('function');
    });

    test('max_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).max_f64x2).toBe('function');
    });

    test('pmin_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).pmin_f64x2).toBe('function');
    });

    test('pmax_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).pmax_f64x2).toBe('function');
    });

    test('trunc_sat_f64x2_s_zero_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f64x2_s_zero_i32x4).toBe('function');
    });

    test('trunc_sat_f64x2_u_zero_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).trunc_sat_f64x2_u_zero_i32x4).toBe('function');
    });

    test('convert_low_i32x4_s_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_low_i32x4_s_f64x2).toBe('function');
    });

    test('convert_low_i32x4_u_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).convert_low_i32x4_u_f64x2).toBe('function');
    });

    test('demote_f64x2_zero_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).demote_f64x2_zero_f32x4).toBe('function');
    });

    test('promote_low_f32x4_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).promote_low_f32x4_f64x2).toBe('function');
    });

  });

  describe('atomics', () => {
    test('atomic_notify', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_notify).toBe('function');
    });

    test('atomic_wait32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_wait32).toBe('function');
    });

    test('atomic_wait64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_wait64).toBe('function');
    });

    test('atomic_fence', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_fence).toBe('function');
    });

    test('atomic_load_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_load_i32).toBe('function');
    });

    test('atomic_load_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_load_i64).toBe('function');
    });

    test('atomic_load8_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_load8_u_i32).toBe('function');
    });

    test('atomic_load16_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_load16_u_i32).toBe('function');
    });

    test('atomic_load8_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_load8_u_i64).toBe('function');
    });

    test('atomic_load16_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_load16_u_i64).toBe('function');
    });

    test('atomic_load32_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_load32_u_i64).toBe('function');
    });

    test('atomic_store_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_store_i32).toBe('function');
    });

    test('atomic_store_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_store_i64).toBe('function');
    });

    test('atomic_store8_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_store8_i32).toBe('function');
    });

    test('atomic_store16_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_store16_i32).toBe('function');
    });

    test('atomic_store8_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_store8_i64).toBe('function');
    });

    test('atomic_store16_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_store16_i64).toBe('function');
    });

    test('atomic_store32_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_store32_i64).toBe('function');
    });

    test('atomic_rmw_add_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_add_i32).toBe('function');
    });

    test('atomic_rmw_add_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_add_i64).toBe('function');
    });

    test('atomic_rmw8_add_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_add_u_i32).toBe('function');
    });

    test('atomic_rmw16_add_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_add_u_i32).toBe('function');
    });

    test('atomic_rmw8_add_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_add_u_i64).toBe('function');
    });

    test('atomic_rmw16_add_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_add_u_i64).toBe('function');
    });

    test('atomic_rmw32_add_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw32_add_u_i64).toBe('function');
    });

    test('atomic_rmw_sub_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_sub_i32).toBe('function');
    });

    test('atomic_rmw_sub_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_sub_i64).toBe('function');
    });

    test('atomic_rmw8_sub_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_sub_u_i32).toBe('function');
    });

    test('atomic_rmw16_sub_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_sub_u_i32).toBe('function');
    });

    test('atomic_rmw8_sub_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_sub_u_i64).toBe('function');
    });

    test('atomic_rmw16_sub_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_sub_u_i64).toBe('function');
    });

    test('atomic_rmw32_sub_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw32_sub_u_i64).toBe('function');
    });

    test('atomic_rmw_and_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_and_i32).toBe('function');
    });

    test('atomic_rmw_and_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_and_i64).toBe('function');
    });

    test('atomic_rmw8_and_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_and_u_i32).toBe('function');
    });

    test('atomic_rmw16_and_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_and_u_i32).toBe('function');
    });

    test('atomic_rmw8_and_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_and_u_i64).toBe('function');
    });

    test('atomic_rmw16_and_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_and_u_i64).toBe('function');
    });

    test('atomic_rmw32_and_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw32_and_u_i64).toBe('function');
    });

    test('atomic_rmw_or_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_or_i32).toBe('function');
    });

    test('atomic_rmw_or_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_or_i64).toBe('function');
    });

    test('atomic_rmw8_or_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_or_u_i32).toBe('function');
    });

    test('atomic_rmw16_or_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_or_u_i32).toBe('function');
    });

    test('atomic_rmw8_or_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_or_u_i64).toBe('function');
    });

    test('atomic_rmw16_or_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_or_u_i64).toBe('function');
    });

    test('atomic_rmw32_or_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw32_or_u_i64).toBe('function');
    });

    test('atomic_rmw_xor_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_xor_i32).toBe('function');
    });

    test('atomic_rmw_xor_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_xor_i64).toBe('function');
    });

    test('atomic_rmw8_xor_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_xor_u_i32).toBe('function');
    });

    test('atomic_rmw16_xor_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_xor_u_i32).toBe('function');
    });

    test('atomic_rmw8_xor_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_xor_u_i64).toBe('function');
    });

    test('atomic_rmw16_xor_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_xor_u_i64).toBe('function');
    });

    test('atomic_rmw32_xor_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw32_xor_u_i64).toBe('function');
    });

    test('atomic_rmw_xchg_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_xchg_i32).toBe('function');
    });

    test('atomic_rmw_xchg_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_xchg_i64).toBe('function');
    });

    test('atomic_rmw8_xchg_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_xchg_u_i32).toBe('function');
    });

    test('atomic_rmw16_xchg_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_xchg_u_i32).toBe('function');
    });

    test('atomic_rmw8_xchg_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_xchg_u_i64).toBe('function');
    });

    test('atomic_rmw16_xchg_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_xchg_u_i64).toBe('function');
    });

    test('atomic_rmw32_xchg_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw32_xchg_u_i64).toBe('function');
    });

    test('atomic_rmw_cmpxchg_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_cmpxchg_i32).toBe('function');
    });

    test('atomic_rmw_cmpxchg_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw_cmpxchg_i64).toBe('function');
    });

    test('atomic_rmw8_cmpxchg_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_cmpxchg_u_i32).toBe('function');
    });

    test('atomic_rmw16_cmpxchg_u_i32', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_cmpxchg_u_i32).toBe('function');
    });

    test('atomic_rmw8_cmpxchg_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw8_cmpxchg_u_i64).toBe('function');
    });

    test('atomic_rmw16_cmpxchg_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw16_cmpxchg_u_i64).toBe('function');
    });

    test('atomic_rmw32_cmpxchg_u_i64', () => {
      expect(typeof (OpCodeEmitter.prototype as any).atomic_rmw32_cmpxchg_u_i64).toBe('function');
    });

  });

  describe('relaxed-simd', () => {
    test('relaxed_swizzle_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_swizzle_i8x16).toBe('function');
    });

    test('relaxed_trunc_f32x4_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_trunc_f32x4_s_i32x4).toBe('function');
    });

    test('relaxed_trunc_f32x4_u_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_trunc_f32x4_u_i32x4).toBe('function');
    });

    test('relaxed_trunc_f64x2_s_zero_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_trunc_f64x2_s_zero_i32x4).toBe('function');
    });

    test('relaxed_trunc_f64x2_u_zero_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_trunc_f64x2_u_zero_i32x4).toBe('function');
    });

    test('relaxed_madd_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_madd_f32x4).toBe('function');
    });

    test('relaxed_nmadd_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_nmadd_f32x4).toBe('function');
    });

    test('relaxed_madd_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_madd_f64x2).toBe('function');
    });

    test('relaxed_nmadd_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_nmadd_f64x2).toBe('function');
    });

    test('relaxed_laneselect_i8x16', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_laneselect_i8x16).toBe('function');
    });

    test('relaxed_laneselect_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_laneselect_i16x8).toBe('function');
    });

    test('relaxed_laneselect_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_laneselect_i32x4).toBe('function');
    });

    test('relaxed_laneselect_i64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_laneselect_i64x2).toBe('function');
    });

    test('relaxed_min_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_min_f32x4).toBe('function');
    });

    test('relaxed_max_f32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_max_f32x4).toBe('function');
    });

    test('relaxed_min_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_min_f64x2).toBe('function');
    });

    test('relaxed_max_f64x2', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_max_f64x2).toBe('function');
    });

    test('relaxed_q15mulr_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_q15mulr_s_i16x8).toBe('function');
    });

    test('relaxed_dot_i8x16_i7x16_s_i16x8', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_dot_i8x16_i7x16_s_i16x8).toBe('function');
    });

    test('relaxed_dot_i8x16_i7x16_add_s_i32x4', () => {
      expect(typeof (OpCodeEmitter.prototype as any).relaxed_dot_i8x16_i7x16_add_s_i32x4).toBe('function');
    });

  });

  describe('gc-struct', () => {
    test('struct_new', () => {
      expect(typeof (OpCodeEmitter.prototype as any).struct_new).toBe('function');
    });

    test('struct_new_default', () => {
      expect(typeof (OpCodeEmitter.prototype as any).struct_new_default).toBe('function');
    });

    test('struct_get', () => {
      expect(typeof (OpCodeEmitter.prototype as any).struct_get).toBe('function');
    });

    test('struct_get_s', () => {
      expect(typeof (OpCodeEmitter.prototype as any).struct_get_s).toBe('function');
    });

    test('struct_get_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).struct_get_u).toBe('function');
    });

    test('struct_set', () => {
      expect(typeof (OpCodeEmitter.prototype as any).struct_set).toBe('function');
    });

  });

  describe('gc-array', () => {
    test('array_new', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_new).toBe('function');
    });

    test('array_new_default', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_new_default).toBe('function');
    });

    test('array_new_fixed', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_new_fixed).toBe('function');
    });

    test('array_new_data', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_new_data).toBe('function');
    });

    test('array_new_elem', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_new_elem).toBe('function');
    });

    test('array_get', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_get).toBe('function');
    });

    test('array_get_s', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_get_s).toBe('function');
    });

    test('array_get_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_get_u).toBe('function');
    });

    test('array_set', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_set).toBe('function');
    });

    test('array_len', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_len).toBe('function');
    });

    test('array_fill', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_fill).toBe('function');
    });

    test('array_copy', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_copy).toBe('function');
    });

    test('array_init_data', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_init_data).toBe('function');
    });

    test('array_init_elem', () => {
      expect(typeof (OpCodeEmitter.prototype as any).array_init_elem).toBe('function');
    });

  });

  describe('gc-cast', () => {
    test('ref_test', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_test).toBe('function');
    });

    test('ref_test_null', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_test_null).toBe('function');
    });

    test('ref_cast', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_cast).toBe('function');
    });

    test('ref_cast_null', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_cast_null).toBe('function');
    });

    test('br_on_cast', () => {
      expect(typeof (OpCodeEmitter.prototype as any).br_on_cast).toBe('function');
    });

    test('br_on_cast_fail', () => {
      expect(typeof (OpCodeEmitter.prototype as any).br_on_cast_fail).toBe('function');
    });

  });

  describe('gc-conversion', () => {
    test('any_convert_extern', () => {
      expect(typeof (OpCodeEmitter.prototype as any).any_convert_extern).toBe('function');
    });

    test('extern_convert_any', () => {
      expect(typeof (OpCodeEmitter.prototype as any).extern_convert_any).toBe('function');
    });

  });

  describe('gc-i31', () => {
    test('ref_i31', () => {
      expect(typeof (OpCodeEmitter.prototype as any).ref_i31).toBe('function');
    });

    test('i31_get_s', () => {
      expect(typeof (OpCodeEmitter.prototype as any).i31_get_s).toBe('function');
    });

    test('i31_get_u', () => {
      expect(typeof (OpCodeEmitter.prototype as any).i31_get_u).toBe('function');
    });

  });

});
