import OpCodes from './OpCodes';

export default class OpCodeEmitter {

unreachable() {return this.emit(OpCodes.unreachable);};

nop() {return this.emit(OpCodes.nop);};

block(blockType, label = null) {return this.emit(OpCodes.block,blockType, label);};

loop(blockType, label = null) {return this.emit(OpCodes.loop,blockType, label);};

if(blockType, label = null) {return this.emit(OpCodes.if,blockType, label);};

else() {return this.emit(OpCodes.else);};

end() {return this.emit(OpCodes.end);};

br(labelBuilder) {return this.emit(OpCodes.br,labelBuilder);};

br_if(labelBuilder) {return this.emit(OpCodes.br_if,labelBuilder);};

br_table(defaultLabelBuilder, ...labelBuilders) {return this.emit(OpCodes.br_table,defaultLabelBuilder, labelBuilders);};

return() {return this.emit(OpCodes.return);};

call(functionBuilder) {return this.emit(OpCodes.call,functionBuilder);};

call_indirect(funcTypeBuilder) {return this.emit(OpCodes.call_indirect,funcTypeBuilder);};

drop() {return this.emit(OpCodes.drop);};

select() {return this.emit(OpCodes.select);};

get_local(local) {return this.emit(OpCodes.get_local,local);};

set_local(local) {return this.emit(OpCodes.set_local,local);};

tee_local(local) {return this.emit(OpCodes.tee_local,local);};

get_global(global) {return this.emit(OpCodes.get_global,global);};

set_global(global) {return this.emit(OpCodes.set_global,global);};

load_i32(alignment, offset) {return this.emit(OpCodes.i32_load,alignment, offset);};

load_i64(alignment, offset) {return this.emit(OpCodes.i64_load,alignment, offset);};

load_f32(alignment, offset) {return this.emit(OpCodes.f32_load,alignment, offset);};

load_f64(alignment, offset) {return this.emit(OpCodes.f64_load,alignment, offset);};

load8_i32(alignment, offset) {return this.emit(OpCodes.i32_load8_s,alignment, offset);};

load8_i32_u(alignment, offset) {return this.emit(OpCodes.i32_load8_u,alignment, offset);};

load16_i32(alignment, offset) {return this.emit(OpCodes.i32_load16_s,alignment, offset);};

load16_i32_u(alignment, offset) {return this.emit(OpCodes.i32_load16_u,alignment, offset);};

load8_i64(alignment, offset) {return this.emit(OpCodes.i64_load8_s,alignment, offset);};

load8_i64_u(alignment, offset) {return this.emit(OpCodes.i64_load8_u,alignment, offset);};

load16_i64(alignment, offset) {return this.emit(OpCodes.i64_load16_s,alignment, offset);};

load16_i64_u(alignment, offset) {return this.emit(OpCodes.i64_load16_u,alignment, offset);};

load32_i64(alignment, offset) {return this.emit(OpCodes.i64_load32_s,alignment, offset);};

load32_i64_u(alignment, offset) {return this.emit(OpCodes.i64_load32_u,alignment, offset);};

store_i32(alignment, offset) {return this.emit(OpCodes.i32_store,alignment, offset);};

store_i64(alignment, offset) {return this.emit(OpCodes.i64_store,alignment, offset);};

store_f32(alignment, offset) {return this.emit(OpCodes.f32_store,alignment, offset);};

store_f64(alignment, offset) {return this.emit(OpCodes.f64_store,alignment, offset);};

store8_i32(alignment, offset) {return this.emit(OpCodes.i32_store8,alignment, offset);};

store16_i32(alignment, offset) {return this.emit(OpCodes.i32_store16,alignment, offset);};

store8_i64(alignment, offset) {return this.emit(OpCodes.i64_store8,alignment, offset);};

store16_i64(alignment, offset) {return this.emit(OpCodes.i64_store16,alignment, offset);};

store32_i64(alignment, offset) {return this.emit(OpCodes.i64_store32,alignment, offset);};

mem_size(varUInt1) {return this.emit(OpCodes.mem_size,varUInt1);};

mem_grow(varUInt1) {return this.emit(OpCodes.mem_grow,varUInt1);};

const_i32(varInt32) {return this.emit(OpCodes.i32_const,varInt32);};

const_i64(varInt64) {return this.emit(OpCodes.i64_const,varInt64);};

const_f32(float32) {return this.emit(OpCodes.f32_const,float32);};

const_f64(float64) {return this.emit(OpCodes.f64_const,float64);};

eqz_i32() {return this.emit(OpCodes.i32_eqz);};

eq_i32() {return this.emit(OpCodes.i32_eq);};

ne_i32() {return this.emit(OpCodes.i32_ne);};

lt_i32() {return this.emit(OpCodes.i32_lt_s);};

lt_i32_u() {return this.emit(OpCodes.i32_lt_u);};

gt_i32() {return this.emit(OpCodes.i32_gt_s);};

gt_i32_u() {return this.emit(OpCodes.i32_gt_u);};

le_i32() {return this.emit(OpCodes.i32_le_s);};

le_i32_u() {return this.emit(OpCodes.i32_le_u);};

ge_i32() {return this.emit(OpCodes.i32_ge_s);};

ge_i32_u() {return this.emit(OpCodes.i32_ge_u);};

eqz_i64() {return this.emit(OpCodes.i64_eqz);};

eq_i64() {return this.emit(OpCodes.i64_eq);};

ne_i64() {return this.emit(OpCodes.i64_ne);};

lt_i64() {return this.emit(OpCodes.i64_lt_s);};

lt_i64_u() {return this.emit(OpCodes.i64_lt_u);};

gt_i64() {return this.emit(OpCodes.i64_gt_s);};

gt_i64_u() {return this.emit(OpCodes.i64_gt_u);};

le_i64() {return this.emit(OpCodes.i64_le_s);};

le_i64_u() {return this.emit(OpCodes.i64_le_u);};

ge_i64() {return this.emit(OpCodes.i64_ge_s);};

ge_i64_u() {return this.emit(OpCodes.i64_ge_u);};

eq_f32() {return this.emit(OpCodes.f32_eq);};

ne_f32() {return this.emit(OpCodes.f32_ne);};

lt_f32() {return this.emit(OpCodes.f32_lt);};

gt_f32() {return this.emit(OpCodes.f32_gt);};

le_f32() {return this.emit(OpCodes.f32_le);};

ge_f32() {return this.emit(OpCodes.f32_ge);};

eq_f64() {return this.emit(OpCodes.f64_eq);};

ne_f64() {return this.emit(OpCodes.f64_ne);};

lt_f64() {return this.emit(OpCodes.f64_lt);};

gt_f64() {return this.emit(OpCodes.f64_gt);};

le_f64() {return this.emit(OpCodes.f64_le);};

ge_f64() {return this.emit(OpCodes.f64_ge);};

clz_i32() {return this.emit(OpCodes.i32_clz);};

ctz_i32() {return this.emit(OpCodes.i32_ctz);};

popcnt_i32() {return this.emit(OpCodes.i32_popcnt);};

add_i32() {return this.emit(OpCodes.i32_add);};

sub_i32() {return this.emit(OpCodes.i32_sub);};

mul_i32() {return this.emit(OpCodes.i32_mul);};

div_i32() {return this.emit(OpCodes.i32_div_s);};

div_i32_u() {return this.emit(OpCodes.i32_div_u);};

rem_i32() {return this.emit(OpCodes.i32_rem_s);};

rem_i32_u() {return this.emit(OpCodes.i32_rem_u);};

and_i32() {return this.emit(OpCodes.i32_and);};

or_i32() {return this.emit(OpCodes.i32_or);};

xor_i32() {return this.emit(OpCodes.i32_xor);};

shl_i32() {return this.emit(OpCodes.i32_shl);};

shr_i32() {return this.emit(OpCodes.i32_shr_s);};

shr_i32_u() {return this.emit(OpCodes.i32_shr_u);};

rotl_i32() {return this.emit(OpCodes.i32_rotl);};

rotr_i32() {return this.emit(OpCodes.i32_rotr);};

clz_i64() {return this.emit(OpCodes.i64_clz);};

ctz_i64() {return this.emit(OpCodes.i64_ctz);};

popcnt_i64() {return this.emit(OpCodes.i64_popcnt);};

add_i64() {return this.emit(OpCodes.i64_add);};

sub_i64() {return this.emit(OpCodes.i64_sub);};

mul_i64() {return this.emit(OpCodes.i64_mul);};

div_i64() {return this.emit(OpCodes.i64_div_s);};

div_i64_u() {return this.emit(OpCodes.i64_div_u);};

rem_i64() {return this.emit(OpCodes.i64_rem_s);};

rem_i64_u() {return this.emit(OpCodes.i64_rem_u);};

and_i64() {return this.emit(OpCodes.i64_and);};

or_i64() {return this.emit(OpCodes.i64_or);};

xor_i64() {return this.emit(OpCodes.i64_xor);};

shl_i64() {return this.emit(OpCodes.i64_shl);};

shr_i64() {return this.emit(OpCodes.i64_shr_s);};

shr_i64_u() {return this.emit(OpCodes.i64_shr_u);};

rotl_i64() {return this.emit(OpCodes.i64_rotl);};

rotr_i64() {return this.emit(OpCodes.i64_rotr);};

abs_f32() {return this.emit(OpCodes.f32_abs);};

neg_f32() {return this.emit(OpCodes.f32_neg);};

ceil_f32() {return this.emit(OpCodes.f32_ceil);};

floor_f32() {return this.emit(OpCodes.f32_floor);};

trunc_f32() {return this.emit(OpCodes.f32_trunc);};

nearest_f32() {return this.emit(OpCodes.f32_nearest);};

sqrt_f32() {return this.emit(OpCodes.f32_sqrt);};

add_f32() {return this.emit(OpCodes.f32_add);};

sub_f32() {return this.emit(OpCodes.f32_sub);};

mul_f32() {return this.emit(OpCodes.f32_mul);};

div_f32() {return this.emit(OpCodes.f32_div);};

min_f32() {return this.emit(OpCodes.f32_min);};

max_f32() {return this.emit(OpCodes.f32_max);};

copysign_f32() {return this.emit(OpCodes.f32_copysign);};

abs_f64() {return this.emit(OpCodes.f64_abs);};

neg_f64() {return this.emit(OpCodes.f64_neg);};

ceil_f64() {return this.emit(OpCodes.f64_ceil);};

floor_f64() {return this.emit(OpCodes.f64_floor);};

trunc_f64() {return this.emit(OpCodes.f64_trunc);};

nearest_f64() {return this.emit(OpCodes.f64_nearest);};

sqrt_f64() {return this.emit(OpCodes.f64_sqrt);};

add_f64() {return this.emit(OpCodes.f64_add);};

sub_f64() {return this.emit(OpCodes.f64_sub);};

mul_f64() {return this.emit(OpCodes.f64_mul);};

div_f64() {return this.emit(OpCodes.f64_div);};

min_f64() {return this.emit(OpCodes.f64_min);};

max_f64() {return this.emit(OpCodes.f64_max);};

copysign_f64() {return this.emit(OpCodes.f64_copysign);};

wrapi64_i32() {return this.emit(OpCodes.i32_wrapi64);};

trunc_i32_f32() {return this.emit(OpCodes.i32_trunc_sf32);};

trunc_i32_f32_u() {return this.emit(OpCodes.i32_trunc_uf32);};

trunc_i32_f64() {return this.emit(OpCodes.i32_trunc_sf64);};

trunc_i32_f64_u() {return this.emit(OpCodes.i32_trunc_uf64);};

extend_i64_i32() {return this.emit(OpCodes.i64_extend_si32);};

extend_i64_i32_u() {return this.emit(OpCodes.i64_extend_ui32);};

trunc_i64_f32() {return this.emit(OpCodes.i64_trunc_sf32);};

trunc_i64_f32_u() {return this.emit(OpCodes.i64_trunc_uf32);};

trunc_i64_f64() {return this.emit(OpCodes.i64_trunc_sf64);};

trunc_i64_f64_u() {return this.emit(OpCodes.i64_trunc_uf64);};

convert_f32_i32() {return this.emit(OpCodes.f32_convert_si32);};

convert_f32_i32_u() {return this.emit(OpCodes.f32_convert_ui32);};

convert_f32_i64() {return this.emit(OpCodes.f32_convert_si64);};

convert_f32_i64_u() {return this.emit(OpCodes.f32_convert_ui64);};

demote_f64_f32() {return this.emit(OpCodes.f32_demotef64);};

convert_f64_i32() {return this.emit(OpCodes.f64_convert_si32);};

convert_f64_i32_u() {return this.emit(OpCodes.f64_convert_ui32);};

convert_f64_i64() {return this.emit(OpCodes.f64_convert_si64);};

convert_f64_i64_u() {return this.emit(OpCodes.f64_convert_ui64);};

promote_f32_f64() {return this.emit(OpCodes.f64_promotef32);};

reinterpret_f32_i32() {return this.emit(OpCodes.i32_reinterpretf32);};

reinterpret_f64_i64() {return this.emit(OpCodes.i64_reinterpretf64);};

reinterpret_i32_f32() {return this.emit(OpCodes.f32_reinterpreti32);};

reinterpret_i64_f64() {return this.emit(OpCodes.f64_reinterpreti64);};

emit(opCode, ...args) { throw new Error('Not Implemented') }



}