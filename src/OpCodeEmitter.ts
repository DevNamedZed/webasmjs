import OpCodes from './OpCodes';

export default abstract class OpCodeEmitter {
  unreachable(): any {
    return this.emit(OpCodes.unreachable);
  }

  nop(): any {
    return this.emit(OpCodes.nop);
  }

  block(blockType: any, label?: any): any {
    return this.emit(OpCodes.block, blockType, label);
  }

  loop(blockType: any, label?: any): any {
    return this.emit(OpCodes.loop, blockType, label);
  }

  if(blockType: any, label?: any): any {
    return this.emit(OpCodes.if, blockType, label);
  }

  else(): any {
    return this.emit(OpCodes.else);
  }

  try(blockType: any, label?: any): any {
    return this.emit(OpCodes.try, blockType, label);
  }

  catch(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.catch, varUInt32);
  }

  throw(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.throw, varUInt32);
  }

  rethrow(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.rethrow, varUInt32);
  }

  end(): any {
    return this.emit(OpCodes.end);
  }

  br(labelBuilder: any): any {
    return this.emit(OpCodes.br, labelBuilder);
  }

  br_if(labelBuilder: any): any {
    return this.emit(OpCodes.br_if, labelBuilder);
  }

  br_table(defaultLabelBuilder: any, ...labelBuilders: any[]): any {
    return this.emit(OpCodes.br_table, defaultLabelBuilder, labelBuilders);
  }

  return(): any {
    return this.emit(OpCodes.return);
  }

  call(functionBuilder: any): any {
    return this.emit(OpCodes.call, functionBuilder);
  }

  call_indirect(funcTypeBuilder: any, tableIndex?: number): any {
    return this.emit(OpCodes.call_indirect, funcTypeBuilder, tableIndex);
  }

  return_call(functionBuilder: any): any {
    return this.emit(OpCodes.return_call, functionBuilder);
  }

  return_call_indirect(funcTypeBuilder: any, tableIndex?: number): any {
    return this.emit(OpCodes.return_call_indirect, funcTypeBuilder, tableIndex);
  }

  delegate(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.delegate, varUInt32);
  }

  catch_all(): any {
    return this.emit(OpCodes.catch_all);
  }

  drop(): any {
    return this.emit(OpCodes.drop);
  }

  select(): any {
    return this.emit(OpCodes.select);
  }

  get_local(local: any): any {
    return this.emit(OpCodes.get_local, local);
  }

  set_local(local: any): any {
    return this.emit(OpCodes.set_local, local);
  }

  tee_local(local: any): any {
    return this.emit(OpCodes.tee_local, local);
  }

  get_global(global: any): any {
    return this.emit(OpCodes.get_global, global);
  }

  set_global(global: any): any {
    return this.emit(OpCodes.set_global, global);
  }

  load_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_load, alignment, offset);
  }

  load_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_load, alignment, offset);
  }

  load_f32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.f32_load, alignment, offset);
  }

  load_f64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.f64_load, alignment, offset);
  }

  load8_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_load8_s, alignment, offset);
  }

  load8_i32_u(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_load8_u, alignment, offset);
  }

  load16_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_load16_s, alignment, offset);
  }

  load16_i32_u(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_load16_u, alignment, offset);
  }

  load8_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_load8_s, alignment, offset);
  }

  load8_i64_u(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_load8_u, alignment, offset);
  }

  load16_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_load16_s, alignment, offset);
  }

  load16_i64_u(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_load16_u, alignment, offset);
  }

  load32_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_load32_s, alignment, offset);
  }

  load32_i64_u(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_load32_u, alignment, offset);
  }

  store_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_store, alignment, offset);
  }

  store_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_store, alignment, offset);
  }

  store_f32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.f32_store, alignment, offset);
  }

  store_f64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.f64_store, alignment, offset);
  }

  store8_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_store8, alignment, offset);
  }

  store16_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_store16, alignment, offset);
  }

  store8_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_store8, alignment, offset);
  }

  store16_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_store16, alignment, offset);
  }

  store32_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_store32, alignment, offset);
  }

  mem_size(varUInt1: number): any {
    return this.emit(OpCodes.mem_size, varUInt1);
  }

  mem_grow(varUInt1: number): any {
    return this.emit(OpCodes.mem_grow, varUInt1);
  }

  const_i32(varInt32: number): any {
    return this.emit(OpCodes.i32_const, varInt32);
  }

  const_i64(varInt64: number | bigint): any {
    return this.emit(OpCodes.i64_const, varInt64);
  }

  const_f32(float32: number): any {
    return this.emit(OpCodes.f32_const, float32);
  }

  const_f64(float64: number): any {
    return this.emit(OpCodes.f64_const, float64);
  }

  eqz_i32(): any {
    return this.emit(OpCodes.i32_eqz);
  }

  eq_i32(): any {
    return this.emit(OpCodes.i32_eq);
  }

  ne_i32(): any {
    return this.emit(OpCodes.i32_ne);
  }

  lt_i32(): any {
    return this.emit(OpCodes.i32_lt_s);
  }

  lt_i32_u(): any {
    return this.emit(OpCodes.i32_lt_u);
  }

  gt_i32(): any {
    return this.emit(OpCodes.i32_gt_s);
  }

  gt_i32_u(): any {
    return this.emit(OpCodes.i32_gt_u);
  }

  le_i32(): any {
    return this.emit(OpCodes.i32_le_s);
  }

  le_i32_u(): any {
    return this.emit(OpCodes.i32_le_u);
  }

  ge_i32(): any {
    return this.emit(OpCodes.i32_ge_s);
  }

  ge_i32_u(): any {
    return this.emit(OpCodes.i32_ge_u);
  }

  eqz_i64(): any {
    return this.emit(OpCodes.i64_eqz);
  }

  eq_i64(): any {
    return this.emit(OpCodes.i64_eq);
  }

  ne_i64(): any {
    return this.emit(OpCodes.i64_ne);
  }

  lt_i64(): any {
    return this.emit(OpCodes.i64_lt_s);
  }

  lt_i64_u(): any {
    return this.emit(OpCodes.i64_lt_u);
  }

  gt_i64(): any {
    return this.emit(OpCodes.i64_gt_s);
  }

  gt_i64_u(): any {
    return this.emit(OpCodes.i64_gt_u);
  }

  le_i64(): any {
    return this.emit(OpCodes.i64_le_s);
  }

  le_i64_u(): any {
    return this.emit(OpCodes.i64_le_u);
  }

  ge_i64(): any {
    return this.emit(OpCodes.i64_ge_s);
  }

  ge_i64_u(): any {
    return this.emit(OpCodes.i64_ge_u);
  }

  eq_f32(): any {
    return this.emit(OpCodes.f32_eq);
  }

  ne_f32(): any {
    return this.emit(OpCodes.f32_ne);
  }

  lt_f32(): any {
    return this.emit(OpCodes.f32_lt);
  }

  gt_f32(): any {
    return this.emit(OpCodes.f32_gt);
  }

  le_f32(): any {
    return this.emit(OpCodes.f32_le);
  }

  ge_f32(): any {
    return this.emit(OpCodes.f32_ge);
  }

  eq_f64(): any {
    return this.emit(OpCodes.f64_eq);
  }

  ne_f64(): any {
    return this.emit(OpCodes.f64_ne);
  }

  lt_f64(): any {
    return this.emit(OpCodes.f64_lt);
  }

  gt_f64(): any {
    return this.emit(OpCodes.f64_gt);
  }

  le_f64(): any {
    return this.emit(OpCodes.f64_le);
  }

  ge_f64(): any {
    return this.emit(OpCodes.f64_ge);
  }

  clz_i32(): any {
    return this.emit(OpCodes.i32_clz);
  }

  ctz_i32(): any {
    return this.emit(OpCodes.i32_ctz);
  }

  popcnt_i32(): any {
    return this.emit(OpCodes.i32_popcnt);
  }

  add_i32(): any {
    return this.emit(OpCodes.i32_add);
  }

  sub_i32(): any {
    return this.emit(OpCodes.i32_sub);
  }

  mul_i32(): any {
    return this.emit(OpCodes.i32_mul);
  }

  div_i32(): any {
    return this.emit(OpCodes.i32_div_s);
  }

  div_i32_u(): any {
    return this.emit(OpCodes.i32_div_u);
  }

  rem_i32(): any {
    return this.emit(OpCodes.i32_rem_s);
  }

  rem_i32_u(): any {
    return this.emit(OpCodes.i32_rem_u);
  }

  and_i32(): any {
    return this.emit(OpCodes.i32_and);
  }

  or_i32(): any {
    return this.emit(OpCodes.i32_or);
  }

  xor_i32(): any {
    return this.emit(OpCodes.i32_xor);
  }

  shl_i32(): any {
    return this.emit(OpCodes.i32_shl);
  }

  shr_i32(): any {
    return this.emit(OpCodes.i32_shr_s);
  }

  shr_i32_u(): any {
    return this.emit(OpCodes.i32_shr_u);
  }

  rotl_i32(): any {
    return this.emit(OpCodes.i32_rotl);
  }

  rotr_i32(): any {
    return this.emit(OpCodes.i32_rotr);
  }

  clz_i64(): any {
    return this.emit(OpCodes.i64_clz);
  }

  ctz_i64(): any {
    return this.emit(OpCodes.i64_ctz);
  }

  popcnt_i64(): any {
    return this.emit(OpCodes.i64_popcnt);
  }

  add_i64(): any {
    return this.emit(OpCodes.i64_add);
  }

  sub_i64(): any {
    return this.emit(OpCodes.i64_sub);
  }

  mul_i64(): any {
    return this.emit(OpCodes.i64_mul);
  }

  div_i64(): any {
    return this.emit(OpCodes.i64_div_s);
  }

  div_i64_u(): any {
    return this.emit(OpCodes.i64_div_u);
  }

  rem_i64(): any {
    return this.emit(OpCodes.i64_rem_s);
  }

  rem_i64_u(): any {
    return this.emit(OpCodes.i64_rem_u);
  }

  and_i64(): any {
    return this.emit(OpCodes.i64_and);
  }

  or_i64(): any {
    return this.emit(OpCodes.i64_or);
  }

  xor_i64(): any {
    return this.emit(OpCodes.i64_xor);
  }

  shl_i64(): any {
    return this.emit(OpCodes.i64_shl);
  }

  shr_i64(): any {
    return this.emit(OpCodes.i64_shr_s);
  }

  shr_i64_u(): any {
    return this.emit(OpCodes.i64_shr_u);
  }

  rotl_i64(): any {
    return this.emit(OpCodes.i64_rotl);
  }

  rotr_i64(): any {
    return this.emit(OpCodes.i64_rotr);
  }

  abs_f32(): any {
    return this.emit(OpCodes.f32_abs);
  }

  neg_f32(): any {
    return this.emit(OpCodes.f32_neg);
  }

  ceil_f32(): any {
    return this.emit(OpCodes.f32_ceil);
  }

  floor_f32(): any {
    return this.emit(OpCodes.f32_floor);
  }

  trunc_f32(): any {
    return this.emit(OpCodes.f32_trunc);
  }

  nearest_f32(): any {
    return this.emit(OpCodes.f32_nearest);
  }

  sqrt_f32(): any {
    return this.emit(OpCodes.f32_sqrt);
  }

  add_f32(): any {
    return this.emit(OpCodes.f32_add);
  }

  sub_f32(): any {
    return this.emit(OpCodes.f32_sub);
  }

  mul_f32(): any {
    return this.emit(OpCodes.f32_mul);
  }

  div_f32(): any {
    return this.emit(OpCodes.f32_div);
  }

  min_f32(): any {
    return this.emit(OpCodes.f32_min);
  }

  max_f32(): any {
    return this.emit(OpCodes.f32_max);
  }

  copysign_f32(): any {
    return this.emit(OpCodes.f32_copysign);
  }

  abs_f64(): any {
    return this.emit(OpCodes.f64_abs);
  }

  neg_f64(): any {
    return this.emit(OpCodes.f64_neg);
  }

  ceil_f64(): any {
    return this.emit(OpCodes.f64_ceil);
  }

  floor_f64(): any {
    return this.emit(OpCodes.f64_floor);
  }

  trunc_f64(): any {
    return this.emit(OpCodes.f64_trunc);
  }

  nearest_f64(): any {
    return this.emit(OpCodes.f64_nearest);
  }

  sqrt_f64(): any {
    return this.emit(OpCodes.f64_sqrt);
  }

  add_f64(): any {
    return this.emit(OpCodes.f64_add);
  }

  sub_f64(): any {
    return this.emit(OpCodes.f64_sub);
  }

  mul_f64(): any {
    return this.emit(OpCodes.f64_mul);
  }

  div_f64(): any {
    return this.emit(OpCodes.f64_div);
  }

  min_f64(): any {
    return this.emit(OpCodes.f64_min);
  }

  max_f64(): any {
    return this.emit(OpCodes.f64_max);
  }

  copysign_f64(): any {
    return this.emit(OpCodes.f64_copysign);
  }

  wrap_i64_i32(): any {
    return this.emit(OpCodes.i32_wrap_i64);
  }

  trunc_f32_s_i32(): any {
    return this.emit(OpCodes.i32_trunc_f32_s);
  }

  trunc_f32_u_i32(): any {
    return this.emit(OpCodes.i32_trunc_f32_u);
  }

  trunc_f64_s_i32(): any {
    return this.emit(OpCodes.i32_trunc_f64_s);
  }

  trunc_f64_u_i32(): any {
    return this.emit(OpCodes.i32_trunc_f64_u);
  }

  extend_i32_s_i64(): any {
    return this.emit(OpCodes.i64_extend_i32_s);
  }

  extend_i32_u_i64(): any {
    return this.emit(OpCodes.i64_extend_i32_u);
  }

  trunc_f32_s_i64(): any {
    return this.emit(OpCodes.i64_trunc_f32_s);
  }

  trunc_f32_u_i64(): any {
    return this.emit(OpCodes.i64_trunc_f32_u);
  }

  trunc_f64_s_i64(): any {
    return this.emit(OpCodes.i64_trunc_f64_s);
  }

  trunc_f64_u_i64(): any {
    return this.emit(OpCodes.i64_trunc_f64_u);
  }

  convert_i32_s_f32(): any {
    return this.emit(OpCodes.f32_convert_i32_s);
  }

  convert_i32_u_f32(): any {
    return this.emit(OpCodes.f32_convert_i32_u);
  }

  convert_i64_s_f32(): any {
    return this.emit(OpCodes.f32_convert_i64_s);
  }

  convert_i64_u_f32(): any {
    return this.emit(OpCodes.f32_convert_i64_u);
  }

  demote_f64_f32(): any {
    return this.emit(OpCodes.f32_demote_f64);
  }

  convert_i32_s_f64(): any {
    return this.emit(OpCodes.f64_convert_i32_s);
  }

  convert_i32_u_f64(): any {
    return this.emit(OpCodes.f64_convert_i32_u);
  }

  convert_i64_s_f64(): any {
    return this.emit(OpCodes.f64_convert_i64_s);
  }

  convert_i64_u_f64(): any {
    return this.emit(OpCodes.f64_convert_i64_u);
  }

  promote_f32_f64(): any {
    return this.emit(OpCodes.f64_promote_f32);
  }

  reinterpret_f32_i32(): any {
    return this.emit(OpCodes.i32_reinterpret_f32);
  }

  reinterpret_f64_i64(): any {
    return this.emit(OpCodes.i64_reinterpret_f64);
  }

  reinterpret_i32_f32(): any {
    return this.emit(OpCodes.f32_reinterpret_i32);
  }

  reinterpret_i64_f64(): any {
    return this.emit(OpCodes.f64_reinterpret_i64);
  }

  extend8_s_i32(): any {
    return this.emit(OpCodes.i32_extend8_s);
  }

  extend16_s_i32(): any {
    return this.emit(OpCodes.i32_extend16_s);
  }

  extend8_s_i64(): any {
    return this.emit(OpCodes.i64_extend8_s);
  }

  extend16_s_i64(): any {
    return this.emit(OpCodes.i64_extend16_s);
  }

  extend32_s_i64(): any {
    return this.emit(OpCodes.i64_extend32_s);
  }

  trunc_sat_f32_s_i32(): any {
    return this.emit(OpCodes.i32_trunc_sat_f32_s);
  }

  trunc_sat_f32_u_i32(): any {
    return this.emit(OpCodes.i32_trunc_sat_f32_u);
  }

  trunc_sat_f64_s_i32(): any {
    return this.emit(OpCodes.i32_trunc_sat_f64_s);
  }

  trunc_sat_f64_u_i32(): any {
    return this.emit(OpCodes.i32_trunc_sat_f64_u);
  }

  trunc_sat_f32_s_i64(): any {
    return this.emit(OpCodes.i64_trunc_sat_f32_s);
  }

  trunc_sat_f32_u_i64(): any {
    return this.emit(OpCodes.i64_trunc_sat_f32_u);
  }

  trunc_sat_f64_s_i64(): any {
    return this.emit(OpCodes.i64_trunc_sat_f64_s);
  }

  trunc_sat_f64_u_i64(): any {
    return this.emit(OpCodes.i64_trunc_sat_f64_u);
  }

  memory_init(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.memory_init, alignment, offset);
  }

  data_drop(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.data_drop, varUInt32);
  }

  memory_copy(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.memory_copy, alignment, offset);
  }

  memory_fill(varUInt1: number): any {
    return this.emit(OpCodes.memory_fill, varUInt1);
  }

  table_init(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.table_init, alignment, offset);
  }

  elem_drop(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.elem_drop, varUInt32);
  }

  table_copy(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.table_copy, alignment, offset);
  }

  table_grow(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.table_grow, varUInt32);
  }

  table_size(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.table_size, varUInt32);
  }

  table_fill(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.table_fill, varUInt32);
  }

  ref_null(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.ref_null, varUInt32);
  }

  ref_is_null(): any {
    return this.emit(OpCodes.ref_is_null);
  }

  ref_func(functionBuilder: any): any {
    return this.emit(OpCodes.ref_func, functionBuilder);
  }

  table_get(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.table_get, varUInt32);
  }

  table_set(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.table_set, varUInt32);
  }

  load_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load, alignment, offset);
  }

  load8x8_s_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load8x8_s, alignment, offset);
  }

  load8x8_u_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load8x8_u, alignment, offset);
  }

  load16x4_s_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load16x4_s, alignment, offset);
  }

  load16x4_u_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load16x4_u, alignment, offset);
  }

  load32x2_s_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load32x2_s, alignment, offset);
  }

  load32x2_u_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load32x2_u, alignment, offset);
  }

  load8_splat_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load8_splat, alignment, offset);
  }

  load16_splat_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load16_splat, alignment, offset);
  }

  load32_splat_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load32_splat, alignment, offset);
  }

  load64_splat_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load64_splat, alignment, offset);
  }

  store_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_store, alignment, offset);
  }

  const_v128(bytes: Uint8Array): any {
    return this.emit(OpCodes.v128_const, bytes);
  }

  shuffle_i8x16(mask: Uint8Array): any {
    return this.emit(OpCodes.i8x16_shuffle, mask);
  }

  swizzle_i8x16(): any {
    return this.emit(OpCodes.i8x16_swizzle);
  }

  splat_i8x16(): any {
    return this.emit(OpCodes.i8x16_splat);
  }

  splat_i16x8(): any {
    return this.emit(OpCodes.i16x8_splat);
  }

  splat_i32x4(): any {
    return this.emit(OpCodes.i32x4_splat);
  }

  splat_i64x2(): any {
    return this.emit(OpCodes.i64x2_splat);
  }

  splat_f32x4(): any {
    return this.emit(OpCodes.f32x4_splat);
  }

  splat_f64x2(): any {
    return this.emit(OpCodes.f64x2_splat);
  }

  extract_lane_s_i8x16(laneIndex: number): any {
    return this.emit(OpCodes.i8x16_extract_lane_s, laneIndex);
  }

  extract_lane_u_i8x16(laneIndex: number): any {
    return this.emit(OpCodes.i8x16_extract_lane_u, laneIndex);
  }

  replace_lane_i8x16(laneIndex: number): any {
    return this.emit(OpCodes.i8x16_replace_lane, laneIndex);
  }

  extract_lane_s_i16x8(laneIndex: number): any {
    return this.emit(OpCodes.i16x8_extract_lane_s, laneIndex);
  }

  extract_lane_u_i16x8(laneIndex: number): any {
    return this.emit(OpCodes.i16x8_extract_lane_u, laneIndex);
  }

  replace_lane_i16x8(laneIndex: number): any {
    return this.emit(OpCodes.i16x8_replace_lane, laneIndex);
  }

  extract_lane_i32x4(laneIndex: number): any {
    return this.emit(OpCodes.i32x4_extract_lane, laneIndex);
  }

  replace_lane_i32x4(laneIndex: number): any {
    return this.emit(OpCodes.i32x4_replace_lane, laneIndex);
  }

  extract_lane_i64x2(laneIndex: number): any {
    return this.emit(OpCodes.i64x2_extract_lane, laneIndex);
  }

  replace_lane_i64x2(laneIndex: number): any {
    return this.emit(OpCodes.i64x2_replace_lane, laneIndex);
  }

  extract_lane_f32x4(laneIndex: number): any {
    return this.emit(OpCodes.f32x4_extract_lane, laneIndex);
  }

  replace_lane_f32x4(laneIndex: number): any {
    return this.emit(OpCodes.f32x4_replace_lane, laneIndex);
  }

  extract_lane_f64x2(laneIndex: number): any {
    return this.emit(OpCodes.f64x2_extract_lane, laneIndex);
  }

  replace_lane_f64x2(laneIndex: number): any {
    return this.emit(OpCodes.f64x2_replace_lane, laneIndex);
  }

  eq_i8x16(): any {
    return this.emit(OpCodes.i8x16_eq);
  }

  ne_i8x16(): any {
    return this.emit(OpCodes.i8x16_ne);
  }

  lt_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_lt_s);
  }

  lt_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_lt_u);
  }

  gt_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_gt_s);
  }

  gt_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_gt_u);
  }

  le_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_le_s);
  }

  le_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_le_u);
  }

  ge_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_ge_s);
  }

  ge_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_ge_u);
  }

  eq_i16x8(): any {
    return this.emit(OpCodes.i16x8_eq);
  }

  ne_i16x8(): any {
    return this.emit(OpCodes.i16x8_ne);
  }

  lt_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_lt_s);
  }

  lt_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_lt_u);
  }

  gt_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_gt_s);
  }

  gt_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_gt_u);
  }

  le_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_le_s);
  }

  le_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_le_u);
  }

  ge_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_ge_s);
  }

  ge_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_ge_u);
  }

  eq_i32x4(): any {
    return this.emit(OpCodes.i32x4_eq);
  }

  ne_i32x4(): any {
    return this.emit(OpCodes.i32x4_ne);
  }

  lt_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_lt_s);
  }

  lt_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_lt_u);
  }

  gt_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_gt_s);
  }

  gt_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_gt_u);
  }

  le_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_le_s);
  }

  le_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_le_u);
  }

  ge_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_ge_s);
  }

  ge_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_ge_u);
  }

  eq_f32x4(): any {
    return this.emit(OpCodes.f32x4_eq);
  }

  ne_f32x4(): any {
    return this.emit(OpCodes.f32x4_ne);
  }

  lt_f32x4(): any {
    return this.emit(OpCodes.f32x4_lt);
  }

  gt_f32x4(): any {
    return this.emit(OpCodes.f32x4_gt);
  }

  le_f32x4(): any {
    return this.emit(OpCodes.f32x4_le);
  }

  ge_f32x4(): any {
    return this.emit(OpCodes.f32x4_ge);
  }

  eq_f64x2(): any {
    return this.emit(OpCodes.f64x2_eq);
  }

  ne_f64x2(): any {
    return this.emit(OpCodes.f64x2_ne);
  }

  lt_f64x2(): any {
    return this.emit(OpCodes.f64x2_lt);
  }

  gt_f64x2(): any {
    return this.emit(OpCodes.f64x2_gt);
  }

  le_f64x2(): any {
    return this.emit(OpCodes.f64x2_le);
  }

  ge_f64x2(): any {
    return this.emit(OpCodes.f64x2_ge);
  }

  not_v128(): any {
    return this.emit(OpCodes.v128_not);
  }

  and_v128(): any {
    return this.emit(OpCodes.v128_and);
  }

  andnot_v128(): any {
    return this.emit(OpCodes.v128_andnot);
  }

  or_v128(): any {
    return this.emit(OpCodes.v128_or);
  }

  xor_v128(): any {
    return this.emit(OpCodes.v128_xor);
  }

  bitselect_v128(): any {
    return this.emit(OpCodes.v128_bitselect);
  }

  any_true_v128(): any {
    return this.emit(OpCodes.v128_any_true);
  }

  load8_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load8_lane, alignment, offset);
  }

  load16_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load16_lane, alignment, offset);
  }

  load32_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load32_lane, alignment, offset);
  }

  load64_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load64_lane, alignment, offset);
  }

  store8_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_store8_lane, alignment, offset);
  }

  store16_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_store16_lane, alignment, offset);
  }

  store32_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_store32_lane, alignment, offset);
  }

  store64_lane_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_store64_lane, alignment, offset);
  }

  load32_zero_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load32_zero, alignment, offset);
  }

  load64_zero_v128(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.v128_load64_zero, alignment, offset);
  }

  trunc_sat_f32x4_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_trunc_sat_f32x4_s);
  }

  trunc_sat_f32x4_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_trunc_sat_f32x4_u);
  }

  abs_i8x16(): any {
    return this.emit(OpCodes.i8x16_abs);
  }

  neg_i8x16(): any {
    return this.emit(OpCodes.i8x16_neg);
  }

  popcnt_i8x16(): any {
    return this.emit(OpCodes.i8x16_popcnt);
  }

  all_true_i8x16(): any {
    return this.emit(OpCodes.i8x16_all_true);
  }

  bitmask_i8x16(): any {
    return this.emit(OpCodes.i8x16_bitmask);
  }

  narrow_i16x8_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_narrow_i16x8_s);
  }

  narrow_i16x8_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_narrow_i16x8_u);
  }

  ceil_f32x4(): any {
    return this.emit(OpCodes.f32x4_ceil);
  }

  floor_f32x4(): any {
    return this.emit(OpCodes.f32x4_floor);
  }

  trunc_f32x4(): any {
    return this.emit(OpCodes.f32x4_trunc);
  }

  nearest_f32x4(): any {
    return this.emit(OpCodes.f32x4_nearest);
  }

  shl_i8x16(): any {
    return this.emit(OpCodes.i8x16_shl);
  }

  shr_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_shr_s);
  }

  shr_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_shr_u);
  }

  add_i8x16(): any {
    return this.emit(OpCodes.i8x16_add);
  }

  add_sat_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_add_sat_s);
  }

  add_sat_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_add_sat_u);
  }

  sub_i8x16(): any {
    return this.emit(OpCodes.i8x16_sub);
  }

  sub_sat_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_sub_sat_s);
  }

  sub_sat_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_sub_sat_u);
  }

  ceil_f64x2(): any {
    return this.emit(OpCodes.f64x2_ceil);
  }

  floor_f64x2(): any {
    return this.emit(OpCodes.f64x2_floor);
  }

  min_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_min_s);
  }

  min_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_min_u);
  }

  max_s_i8x16(): any {
    return this.emit(OpCodes.i8x16_max_s);
  }

  max_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_max_u);
  }

  trunc_f64x2(): any {
    return this.emit(OpCodes.f64x2_trunc);
  }

  avgr_u_i8x16(): any {
    return this.emit(OpCodes.i8x16_avgr_u);
  }

  extadd_pairwise_i8x16_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_extadd_pairwise_i8x16_s);
  }

  extadd_pairwise_i8x16_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_extadd_pairwise_i8x16_u);
  }

  extadd_pairwise_i16x8_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_extadd_pairwise_i16x8_s);
  }

  extadd_pairwise_i16x8_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_extadd_pairwise_i16x8_u);
  }

  abs_i16x8(): any {
    return this.emit(OpCodes.i16x8_abs);
  }

  neg_i16x8(): any {
    return this.emit(OpCodes.i16x8_neg);
  }

  q15mulr_sat_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_q15mulr_sat_s);
  }

  all_true_i16x8(): any {
    return this.emit(OpCodes.i16x8_all_true);
  }

  bitmask_i16x8(): any {
    return this.emit(OpCodes.i16x8_bitmask);
  }

  narrow_i32x4_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_narrow_i32x4_s);
  }

  narrow_i32x4_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_narrow_i32x4_u);
  }

  extend_low_i8x16_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_extend_low_i8x16_s);
  }

  extend_high_i8x16_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_extend_high_i8x16_s);
  }

  extend_low_i8x16_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_extend_low_i8x16_u);
  }

  extend_high_i8x16_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_extend_high_i8x16_u);
  }

  shl_i16x8(): any {
    return this.emit(OpCodes.i16x8_shl);
  }

  shr_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_shr_s);
  }

  shr_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_shr_u);
  }

  add_i16x8(): any {
    return this.emit(OpCodes.i16x8_add);
  }

  add_sat_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_add_sat_s);
  }

  add_sat_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_add_sat_u);
  }

  sub_i16x8(): any {
    return this.emit(OpCodes.i16x8_sub);
  }

  sub_sat_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_sub_sat_s);
  }

  sub_sat_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_sub_sat_u);
  }

  nearest_f64x2(): any {
    return this.emit(OpCodes.f64x2_nearest);
  }

  mul_i16x8(): any {
    return this.emit(OpCodes.i16x8_mul);
  }

  min_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_min_s);
  }

  min_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_min_u);
  }

  max_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_max_s);
  }

  max_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_max_u);
  }

  avgr_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_avgr_u);
  }

  extmul_low_i8x16_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_extmul_low_i8x16_s);
  }

  extmul_high_i8x16_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_extmul_high_i8x16_s);
  }

  extmul_low_i8x16_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_extmul_low_i8x16_u);
  }

  extmul_high_i8x16_u_i16x8(): any {
    return this.emit(OpCodes.i16x8_extmul_high_i8x16_u);
  }

  abs_i32x4(): any {
    return this.emit(OpCodes.i32x4_abs);
  }

  neg_i32x4(): any {
    return this.emit(OpCodes.i32x4_neg);
  }

  all_true_i32x4(): any {
    return this.emit(OpCodes.i32x4_all_true);
  }

  bitmask_i32x4(): any {
    return this.emit(OpCodes.i32x4_bitmask);
  }

  extend_low_i16x8_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_extend_low_i16x8_s);
  }

  extend_high_i16x8_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_extend_high_i16x8_s);
  }

  extend_low_i16x8_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_extend_low_i16x8_u);
  }

  extend_high_i16x8_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_extend_high_i16x8_u);
  }

  shl_i32x4(): any {
    return this.emit(OpCodes.i32x4_shl);
  }

  shr_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_shr_s);
  }

  shr_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_shr_u);
  }

  add_i32x4(): any {
    return this.emit(OpCodes.i32x4_add);
  }

  convert_i32x4_s_f32x4(): any {
    return this.emit(OpCodes.f32x4_convert_i32x4_s);
  }

  convert_i32x4_u_f32x4(): any {
    return this.emit(OpCodes.f32x4_convert_i32x4_u);
  }

  sub_i32x4(): any {
    return this.emit(OpCodes.i32x4_sub);
  }

  mul_i32x4(): any {
    return this.emit(OpCodes.i32x4_mul);
  }

  min_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_min_s);
  }

  min_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_min_u);
  }

  max_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_max_s);
  }

  max_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_max_u);
  }

  dot_i16x8_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_dot_i16x8_s);
  }

  extmul_low_i16x8_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_extmul_low_i16x8_s);
  }

  extmul_high_i16x8_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_extmul_high_i16x8_s);
  }

  extmul_low_i16x8_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_extmul_low_i16x8_u);
  }

  extmul_high_i16x8_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_extmul_high_i16x8_u);
  }

  abs_i64x2(): any {
    return this.emit(OpCodes.i64x2_abs);
  }

  neg_i64x2(): any {
    return this.emit(OpCodes.i64x2_neg);
  }

  all_true_i64x2(): any {
    return this.emit(OpCodes.i64x2_all_true);
  }

  bitmask_i64x2(): any {
    return this.emit(OpCodes.i64x2_bitmask);
  }

  extend_low_i32x4_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_extend_low_i32x4_s);
  }

  extend_high_i32x4_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_extend_high_i32x4_s);
  }

  extend_low_i32x4_u_i64x2(): any {
    return this.emit(OpCodes.i64x2_extend_low_i32x4_u);
  }

  extend_high_i32x4_u_i64x2(): any {
    return this.emit(OpCodes.i64x2_extend_high_i32x4_u);
  }

  shl_i64x2(): any {
    return this.emit(OpCodes.i64x2_shl);
  }

  shr_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_shr_s);
  }

  shr_u_i64x2(): any {
    return this.emit(OpCodes.i64x2_shr_u);
  }

  add_i64x2(): any {
    return this.emit(OpCodes.i64x2_add);
  }

  sub_i64x2(): any {
    return this.emit(OpCodes.i64x2_sub);
  }

  mul_i64x2(): any {
    return this.emit(OpCodes.i64x2_mul);
  }

  eq_i64x2(): any {
    return this.emit(OpCodes.i64x2_eq);
  }

  ne_i64x2(): any {
    return this.emit(OpCodes.i64x2_ne);
  }

  lt_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_lt_s);
  }

  gt_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_gt_s);
  }

  le_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_le_s);
  }

  ge_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_ge_s);
  }

  extmul_low_i32x4_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_extmul_low_i32x4_s);
  }

  extmul_high_i32x4_s_i64x2(): any {
    return this.emit(OpCodes.i64x2_extmul_high_i32x4_s);
  }

  extmul_low_i32x4_u_i64x2(): any {
    return this.emit(OpCodes.i64x2_extmul_low_i32x4_u);
  }

  extmul_high_i32x4_u_i64x2(): any {
    return this.emit(OpCodes.i64x2_extmul_high_i32x4_u);
  }

  abs_f32x4(): any {
    return this.emit(OpCodes.f32x4_abs);
  }

  neg_f32x4(): any {
    return this.emit(OpCodes.f32x4_neg);
  }

  sqrt_f32x4(): any {
    return this.emit(OpCodes.f32x4_sqrt);
  }

  add_f32x4(): any {
    return this.emit(OpCodes.f32x4_add);
  }

  sub_f32x4(): any {
    return this.emit(OpCodes.f32x4_sub);
  }

  mul_f32x4(): any {
    return this.emit(OpCodes.f32x4_mul);
  }

  div_f32x4(): any {
    return this.emit(OpCodes.f32x4_div);
  }

  min_f32x4(): any {
    return this.emit(OpCodes.f32x4_min);
  }

  max_f32x4(): any {
    return this.emit(OpCodes.f32x4_max);
  }

  pmin_f32x4(): any {
    return this.emit(OpCodes.f32x4_pmin);
  }

  pmax_f32x4(): any {
    return this.emit(OpCodes.f32x4_pmax);
  }

  abs_f64x2(): any {
    return this.emit(OpCodes.f64x2_abs);
  }

  neg_f64x2(): any {
    return this.emit(OpCodes.f64x2_neg);
  }

  sqrt_f64x2(): any {
    return this.emit(OpCodes.f64x2_sqrt);
  }

  add_f64x2(): any {
    return this.emit(OpCodes.f64x2_add);
  }

  sub_f64x2(): any {
    return this.emit(OpCodes.f64x2_sub);
  }

  mul_f64x2(): any {
    return this.emit(OpCodes.f64x2_mul);
  }

  div_f64x2(): any {
    return this.emit(OpCodes.f64x2_div);
  }

  min_f64x2(): any {
    return this.emit(OpCodes.f64x2_min);
  }

  max_f64x2(): any {
    return this.emit(OpCodes.f64x2_max);
  }

  pmin_f64x2(): any {
    return this.emit(OpCodes.f64x2_pmin);
  }

  pmax_f64x2(): any {
    return this.emit(OpCodes.f64x2_pmax);
  }

  trunc_sat_f64x2_s_zero_i32x4(): any {
    return this.emit(OpCodes.i32x4_trunc_sat_f64x2_s_zero);
  }

  trunc_sat_f64x2_u_zero_i32x4(): any {
    return this.emit(OpCodes.i32x4_trunc_sat_f64x2_u_zero);
  }

  convert_low_i32x4_s_f64x2(): any {
    return this.emit(OpCodes.f64x2_convert_low_i32x4_s);
  }

  convert_low_i32x4_u_f64x2(): any {
    return this.emit(OpCodes.f64x2_convert_low_i32x4_u);
  }

  demote_f64x2_zero_f32x4(): any {
    return this.emit(OpCodes.f32x4_demote_f64x2_zero);
  }

  promote_low_f32x4_f64x2(): any {
    return this.emit(OpCodes.f64x2_promote_low_f32x4);
  }

  atomic_notify(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.memory_atomic_notify, alignment, offset);
  }

  atomic_wait32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.memory_atomic_wait32, alignment, offset);
  }

  atomic_wait64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.memory_atomic_wait64, alignment, offset);
  }

  atomic_fence(varUInt1: number): any {
    return this.emit(OpCodes.atomic_fence, varUInt1);
  }

  atomic_load_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_load, alignment, offset);
  }

  atomic_load_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_load, alignment, offset);
  }

  atomic_load8_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_load8_u, alignment, offset);
  }

  atomic_load16_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_load16_u, alignment, offset);
  }

  atomic_load8_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_load8_u, alignment, offset);
  }

  atomic_load16_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_load16_u, alignment, offset);
  }

  atomic_load32_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_load32_u, alignment, offset);
  }

  atomic_store_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_store, alignment, offset);
  }

  atomic_store_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_store, alignment, offset);
  }

  atomic_store8_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_store8, alignment, offset);
  }

  atomic_store16_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_store16, alignment, offset);
  }

  atomic_store8_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_store8, alignment, offset);
  }

  atomic_store16_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_store16, alignment, offset);
  }

  atomic_store32_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_store32, alignment, offset);
  }

  atomic_rmw_add_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw_add, alignment, offset);
  }

  atomic_rmw_add_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw_add, alignment, offset);
  }

  atomic_rmw8_add_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw8_add_u, alignment, offset);
  }

  atomic_rmw16_add_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw16_add_u, alignment, offset);
  }

  atomic_rmw8_add_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw8_add_u, alignment, offset);
  }

  atomic_rmw16_add_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw16_add_u, alignment, offset);
  }

  atomic_rmw32_add_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw32_add_u, alignment, offset);
  }

  atomic_rmw_sub_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw_sub, alignment, offset);
  }

  atomic_rmw_sub_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw_sub, alignment, offset);
  }

  atomic_rmw8_sub_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw8_sub_u, alignment, offset);
  }

  atomic_rmw16_sub_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw16_sub_u, alignment, offset);
  }

  atomic_rmw8_sub_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw8_sub_u, alignment, offset);
  }

  atomic_rmw16_sub_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw16_sub_u, alignment, offset);
  }

  atomic_rmw32_sub_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw32_sub_u, alignment, offset);
  }

  atomic_rmw_and_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw_and, alignment, offset);
  }

  atomic_rmw_and_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw_and, alignment, offset);
  }

  atomic_rmw8_and_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw8_and_u, alignment, offset);
  }

  atomic_rmw16_and_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw16_and_u, alignment, offset);
  }

  atomic_rmw8_and_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw8_and_u, alignment, offset);
  }

  atomic_rmw16_and_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw16_and_u, alignment, offset);
  }

  atomic_rmw32_and_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw32_and_u, alignment, offset);
  }

  atomic_rmw_or_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw_or, alignment, offset);
  }

  atomic_rmw_or_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw_or, alignment, offset);
  }

  atomic_rmw8_or_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw8_or_u, alignment, offset);
  }

  atomic_rmw16_or_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw16_or_u, alignment, offset);
  }

  atomic_rmw8_or_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw8_or_u, alignment, offset);
  }

  atomic_rmw16_or_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw16_or_u, alignment, offset);
  }

  atomic_rmw32_or_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw32_or_u, alignment, offset);
  }

  atomic_rmw_xor_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw_xor, alignment, offset);
  }

  atomic_rmw_xor_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw_xor, alignment, offset);
  }

  atomic_rmw8_xor_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw8_xor_u, alignment, offset);
  }

  atomic_rmw16_xor_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw16_xor_u, alignment, offset);
  }

  atomic_rmw8_xor_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw8_xor_u, alignment, offset);
  }

  atomic_rmw16_xor_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw16_xor_u, alignment, offset);
  }

  atomic_rmw32_xor_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw32_xor_u, alignment, offset);
  }

  atomic_rmw_xchg_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw_xchg, alignment, offset);
  }

  atomic_rmw_xchg_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw_xchg, alignment, offset);
  }

  atomic_rmw8_xchg_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw8_xchg_u, alignment, offset);
  }

  atomic_rmw16_xchg_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw16_xchg_u, alignment, offset);
  }

  atomic_rmw8_xchg_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw8_xchg_u, alignment, offset);
  }

  atomic_rmw16_xchg_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw16_xchg_u, alignment, offset);
  }

  atomic_rmw32_xchg_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw32_xchg_u, alignment, offset);
  }

  atomic_rmw_cmpxchg_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw_cmpxchg, alignment, offset);
  }

  atomic_rmw_cmpxchg_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw_cmpxchg, alignment, offset);
  }

  atomic_rmw8_cmpxchg_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw8_cmpxchg_u, alignment, offset);
  }

  atomic_rmw16_cmpxchg_u_i32(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i32_atomic_rmw16_cmpxchg_u, alignment, offset);
  }

  atomic_rmw8_cmpxchg_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw8_cmpxchg_u, alignment, offset);
  }

  atomic_rmw16_cmpxchg_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw16_cmpxchg_u, alignment, offset);
  }

  atomic_rmw32_cmpxchg_u_i64(alignment: number, offset: number | bigint): any {
    return this.emit(OpCodes.i64_atomic_rmw32_cmpxchg_u, alignment, offset);
  }

  relaxed_swizzle_i8x16(): any {
    return this.emit(OpCodes.i8x16_relaxed_swizzle);
  }

  relaxed_trunc_f32x4_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_relaxed_trunc_f32x4_s);
  }

  relaxed_trunc_f32x4_u_i32x4(): any {
    return this.emit(OpCodes.i32x4_relaxed_trunc_f32x4_u);
  }

  relaxed_trunc_f64x2_s_zero_i32x4(): any {
    return this.emit(OpCodes.i32x4_relaxed_trunc_f64x2_s_zero);
  }

  relaxed_trunc_f64x2_u_zero_i32x4(): any {
    return this.emit(OpCodes.i32x4_relaxed_trunc_f64x2_u_zero);
  }

  relaxed_madd_f32x4(): any {
    return this.emit(OpCodes.f32x4_relaxed_madd);
  }

  relaxed_nmadd_f32x4(): any {
    return this.emit(OpCodes.f32x4_relaxed_nmadd);
  }

  relaxed_madd_f64x2(): any {
    return this.emit(OpCodes.f64x2_relaxed_madd);
  }

  relaxed_nmadd_f64x2(): any {
    return this.emit(OpCodes.f64x2_relaxed_nmadd);
  }

  relaxed_laneselect_i8x16(): any {
    return this.emit(OpCodes.i8x16_relaxed_laneselect);
  }

  relaxed_laneselect_i16x8(): any {
    return this.emit(OpCodes.i16x8_relaxed_laneselect);
  }

  relaxed_laneselect_i32x4(): any {
    return this.emit(OpCodes.i32x4_relaxed_laneselect);
  }

  relaxed_laneselect_i64x2(): any {
    return this.emit(OpCodes.i64x2_relaxed_laneselect);
  }

  relaxed_min_f32x4(): any {
    return this.emit(OpCodes.f32x4_relaxed_min);
  }

  relaxed_max_f32x4(): any {
    return this.emit(OpCodes.f32x4_relaxed_max);
  }

  relaxed_min_f64x2(): any {
    return this.emit(OpCodes.f64x2_relaxed_min);
  }

  relaxed_max_f64x2(): any {
    return this.emit(OpCodes.f64x2_relaxed_max);
  }

  relaxed_q15mulr_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_relaxed_q15mulr_s);
  }

  relaxed_dot_i8x16_i7x16_s_i16x8(): any {
    return this.emit(OpCodes.i16x8_relaxed_dot_i8x16_i7x16_s);
  }

  relaxed_dot_i8x16_i7x16_add_s_i32x4(): any {
    return this.emit(OpCodes.i32x4_relaxed_dot_i8x16_i7x16_add_s);
  }

  struct_new(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.struct_new, varUInt32);
  }

  struct_new_default(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.struct_new_default, varUInt32);
  }

  struct_get(typeIndex: number | { index: number }, fieldIndex: number): any {
    return this.emit(OpCodes.struct_get, typeIndex, fieldIndex);
  }

  struct_get_s(typeIndex: number | { index: number }, fieldIndex: number): any {
    return this.emit(OpCodes.struct_get_s, typeIndex, fieldIndex);
  }

  struct_get_u(typeIndex: number | { index: number }, fieldIndex: number): any {
    return this.emit(OpCodes.struct_get_u, typeIndex, fieldIndex);
  }

  struct_set(typeIndex: number | { index: number }, fieldIndex: number): any {
    return this.emit(OpCodes.struct_set, typeIndex, fieldIndex);
  }

  array_new(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.array_new, varUInt32);
  }

  array_new_default(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.array_new_default, varUInt32);
  }

  array_new_fixed(typeIndex: number | { index: number }, index: number): any {
    return this.emit(OpCodes.array_new_fixed, typeIndex, index);
  }

  array_new_data(typeIndex: number | { index: number }, index: number): any {
    return this.emit(OpCodes.array_new_data, typeIndex, index);
  }

  array_new_elem(typeIndex: number | { index: number }, index: number): any {
    return this.emit(OpCodes.array_new_elem, typeIndex, index);
  }

  array_get(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.array_get, varUInt32);
  }

  array_get_s(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.array_get_s, varUInt32);
  }

  array_get_u(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.array_get_u, varUInt32);
  }

  array_set(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.array_set, varUInt32);
  }

  array_len(): any {
    return this.emit(OpCodes.array_len);
  }

  array_fill(varUInt32: number | { index: number }): any {
    return this.emit(OpCodes.array_fill, varUInt32);
  }

  array_copy(typeIndex: number | { index: number }, index: number): any {
    return this.emit(OpCodes.array_copy, typeIndex, index);
  }

  array_init_data(typeIndex: number | { index: number }, index: number): any {
    return this.emit(OpCodes.array_init_data, typeIndex, index);
  }

  array_init_elem(typeIndex: number | { index: number }, index: number): any {
    return this.emit(OpCodes.array_init_elem, typeIndex, index);
  }

  ref_test(heapType: any): any {
    return this.emit(OpCodes.ref_test, heapType);
  }

  ref_test_null(heapType: any): any {
    return this.emit(OpCodes.ref_test_null, heapType);
  }

  ref_cast(heapType: any): any {
    return this.emit(OpCodes.ref_cast, heapType);
  }

  ref_cast_null(heapType: any): any {
    return this.emit(OpCodes.ref_cast_null, heapType);
  }

  br_on_cast(flags: number, labelBuilder: any, heapType1: any, heapType2: any): any {
    return this.emit(OpCodes.br_on_cast, flags, labelBuilder, heapType1, heapType2);
  }

  br_on_cast_fail(flags: number, labelBuilder: any, heapType1: any, heapType2: any): any {
    return this.emit(OpCodes.br_on_cast_fail, flags, labelBuilder, heapType1, heapType2);
  }

  any_convert_extern(): any {
    return this.emit(OpCodes.any_convert_extern);
  }

  extern_convert_any(): any {
    return this.emit(OpCodes.extern_convert_any);
  }

  ref_i31(): any {
    return this.emit(OpCodes.ref_i31);
  }

  i31_get_s(): any {
    return this.emit(OpCodes.i31_get_s);
  }

  i31_get_u(): any {
    return this.emit(OpCodes.i31_get_u);
  }

  abstract emit(opCode: any, ...args: any[]): any;
}
