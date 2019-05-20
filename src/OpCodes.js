export default {
  "unreachable": {
    "value": 0,
    "mnemonic": "unreachable",
    "stackBehavior": "None"
  },
  "nop": {
    "value": 1,
    "mnemonic": "nop",
    "stackBehavior": "None"
  },
  "block": {
    "value": 2,
    "mnemonic": "block",
    "immediate": "BlockSignature",
    "controlFlow": "Push",
    "stackBehavior": "None"
  },
  "loop": {
    "value": 3,
    "mnemonic": "loop",
    "immediate": "BlockSignature",
    "controlFlow": "Push",
    "stackBehavior": "None"
  },
  "if": {
    "value": 4,
    "mnemonic": "if",
    "immediate": "BlockSignature",
    "controlFlow": "Push",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32"
    ]
  },
  "else": {
    "value": 5,
    "mnemonic": "else",
    "stackBehavior": "None"
  },
  "end": {
    "value": 11,
    "mnemonic": "end",
    "controlFlow": "Pop",
    "stackBehavior": "None"
  },
  "br": {
    "value": 12,
    "mnemonic": "br",
    "immediate": "RelativeDepth",
    "stackBehavior": "None"
  },
  "br_if": {
    "value": 13,
    "mnemonic": "br_if",
    "immediate": "RelativeDepth",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32"
    ]
  },
  "br_table": {
    "value": 14,
    "mnemonic": "br_table",
    "immediate": "BranchTable",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32"
    ]
  },
  "return": {
    "value": 15,
    "mnemonic": "return",
    "stackBehavior": "None"
  },
  "call": {
    "value": 16,
    "mnemonic": "call",
    "immediate": "Function",
    "stackBehavior": "PopPush",
    "popOperands": [],
    "pushOperands": []
  },
  "call_indirect": {
    "value": 17,
    "mnemonic": "call_indirect",
    "immediate": "IndirectFunction",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": []
  },
  "drop": {
    "value": 26,
    "mnemonic": "drop",
    "stackBehavior": "Pop",
    "popOperands": [
      "Any"
    ]
  },
  "select": {
    "value": 27,
    "mnemonic": "select",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Any",
      "Any",
      "Int32"
    ],
    "pushOperands": [
      "Any"
    ]
  },
  "get_local": {
    "value": 32,
    "mnemonic": "get_local",
    "immediate": "Local",
    "stackBehavior": "Push",
    "pushOperands": [
      "Any"
    ]
  },
  "set_local": {
    "value": 33,
    "mnemonic": "set_local",
    "immediate": "Local",
    "stackBehavior": "Pop",
    "popOperands": [
      "Any"
    ]
  },
  "tee_local": {
    "value": 34,
    "mnemonic": "tee_local",
    "immediate": "Local",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Any"
    ],
    "pushOperands": [
      "Any"
    ]
  },
  "get_global": {
    "value": 35,
    "mnemonic": "get_global",
    "immediate": "Global",
    "stackBehavior": "Push",
    "pushOperands": [
      "Any"
    ]
  },
  "set_global": {
    "value": 36,
    "mnemonic": "set_global",
    "immediate": "Global",
    "stackBehavior": "Pop",
    "popOperands": [
      "Any"
    ]
  },
  "i32_load": {
    "value": 40,
    "mnemonic": "i32.load",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_load": {
    "value": 41,
    "mnemonic": "i64.load",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "f32_load": {
    "value": 42,
    "mnemonic": "f32.load",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f64_load": {
    "value": 43,
    "mnemonic": "f64.load",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "i32_load8_s": {
    "value": 44,
    "mnemonic": "i32.load8_s",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_load8_u": {
    "value": 45,
    "mnemonic": "i32.load8_u",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_load16_s": {
    "value": 46,
    "mnemonic": "i32.load16_s",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_load16_u": {
    "value": 47,
    "mnemonic": "i32.load16_u",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_load8_s": {
    "value": 48,
    "mnemonic": "i64.load8_s",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_load8_u": {
    "value": 49,
    "mnemonic": "i64.load8_u",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_load16_s": {
    "value": 50,
    "mnemonic": "i64.load16_s",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_load16_u": {
    "value": 51,
    "mnemonic": "i64.load16_u",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_load32_s": {
    "value": 52,
    "mnemonic": "i64.load32_s",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_load32_u": {
    "value": 53,
    "mnemonic": "i64.load32_u",
    "immediate": "MemoryImmediate",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i32_store": {
    "value": 54,
    "mnemonic": "i32.store",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Int32"
    ]
  },
  "i64_store": {
    "value": 55,
    "mnemonic": "i64.store",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Int64"
    ]
  },
  "f32_store": {
    "value": 56,
    "mnemonic": "f32.store",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Float32"
    ]
  },
  "f64_store": {
    "value": 57,
    "mnemonic": "f64.store",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Float64"
    ]
  },
  "i32_store8": {
    "value": 58,
    "mnemonic": "i32.store8",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Int32"
    ]
  },
  "i32_store16": {
    "value": 59,
    "mnemonic": "i32.store16",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Int32"
    ]
  },
  "i64_store8": {
    "value": 60,
    "mnemonic": "i64.store8",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Int64"
    ]
  },
  "i64_store16": {
    "value": 61,
    "mnemonic": "i64.store16",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Int64"
    ]
  },
  "i64_store32": {
    "value": 62,
    "mnemonic": "i64.store32",
    "immediate": "MemoryImmediate",
    "stackBehavior": "Pop",
    "popOperands": [
      "Int32",
      "Int64"
    ]
  },
  "mem_size": {
    "value": 63,
    "mnemonic": "mem.size",
    "immediate": "VarUInt1",
    "stackBehavior": "Push",
    "pushOperands": [
      "Int32"
    ]
  },
  "mem_grow": {
    "value": 64,
    "mnemonic": "mem.grow",
    "immediate": "VarUInt1",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_const": {
    "value": 65,
    "mnemonic": "i32.const",
    "immediate": "VarInt32",
    "stackBehavior": "Push",
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_const": {
    "value": 66,
    "mnemonic": "i64.const",
    "immediate": "VarInt64",
    "stackBehavior": "Push",
    "pushOperands": [
      "Int64"
    ]
  },
  "f32_const": {
    "value": 67,
    "mnemonic": "f32.const",
    "immediate": "Float32",
    "stackBehavior": "Push",
    "pushOperands": [
      "Float32"
    ]
  },
  "f64_const": {
    "value": 68,
    "mnemonic": "f64.const",
    "immediate": "Float64",
    "stackBehavior": "Push",
    "pushOperands": [
      "Float64"
    ]
  },
  "i32_eqz": {
    "value": 69,
    "mnemonic": "i32.eqz",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_eq": {
    "value": 70,
    "mnemonic": "i32.eq",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_ne": {
    "value": 71,
    "mnemonic": "i32.ne",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_lt_s": {
    "value": 72,
    "mnemonic": "i32.lt_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_lt_u": {
    "value": 73,
    "mnemonic": "i32.lt_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_gt_s": {
    "value": 74,
    "mnemonic": "i32.gt_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_gt_u": {
    "value": 75,
    "mnemonic": "i32.gt_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_le_s": {
    "value": 76,
    "mnemonic": "i32.le_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_le_u": {
    "value": 77,
    "mnemonic": "i32.le_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_ge_s": {
    "value": 78,
    "mnemonic": "i32.ge_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_ge_u": {
    "value": 79,
    "mnemonic": "i32.ge_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_eqz": {
    "value": 80,
    "mnemonic": "i64.eqz",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_eq": {
    "value": 81,
    "mnemonic": "i64.eq",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_ne": {
    "value": 82,
    "mnemonic": "i64.ne",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_lt_s": {
    "value": 83,
    "mnemonic": "i64.lt_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_lt_u": {
    "value": 84,
    "mnemonic": "i64.lt_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_gt_s": {
    "value": 85,
    "mnemonic": "i64.gt_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_gt_u": {
    "value": 86,
    "mnemonic": "i64.gt_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_le_s": {
    "value": 87,
    "mnemonic": "i64.le_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_le_u": {
    "value": 88,
    "mnemonic": "i64.le_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_ge_s": {
    "value": 89,
    "mnemonic": "i64.ge_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_ge_u": {
    "value": 90,
    "mnemonic": "i64.ge_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f32_eq": {
    "value": 91,
    "mnemonic": "f32.eq",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f32_ne": {
    "value": 92,
    "mnemonic": "f32.ne",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f32_lt": {
    "value": 93,
    "mnemonic": "f32.lt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f32_gt": {
    "value": 94,
    "mnemonic": "f32.gt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f32_le": {
    "value": 95,
    "mnemonic": "f32.le",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f32_ge": {
    "value": 96,
    "mnemonic": "f32.ge",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f64_eq": {
    "value": 97,
    "mnemonic": "f64.eq",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f64_ne": {
    "value": 98,
    "mnemonic": "f64.ne",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f64_lt": {
    "value": 99,
    "mnemonic": "f64.lt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f64_gt": {
    "value": 100,
    "mnemonic": "f64.gt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f64_le": {
    "value": 101,
    "mnemonic": "f64.le",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "f64_ge": {
    "value": 102,
    "mnemonic": "f64.ge",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_clz": {
    "value": 103,
    "mnemonic": "i32.clz",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_ctz": {
    "value": 104,
    "mnemonic": "i32.ctz",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_popcnt": {
    "value": 105,
    "mnemonic": "i32.popcnt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_add": {
    "value": 106,
    "mnemonic": "i32.add",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_sub": {
    "value": 107,
    "mnemonic": "i32.sub",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_mul": {
    "value": 108,
    "mnemonic": "i32.mul",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_div_s": {
    "value": 109,
    "mnemonic": "i32.div_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_div_u": {
    "value": 110,
    "mnemonic": "i32.div_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_rem_s": {
    "value": 111,
    "mnemonic": "i32.rem_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_rem_u": {
    "value": 112,
    "mnemonic": "i32.rem_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_and": {
    "value": 113,
    "mnemonic": "i32.and",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_or": {
    "value": 114,
    "mnemonic": "i32.or",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_xor": {
    "value": 115,
    "mnemonic": "i32.xor",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_shl": {
    "value": 116,
    "mnemonic": "i32.shl",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_shr_s": {
    "value": 117,
    "mnemonic": "i32.shr_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_shr_u": {
    "value": 118,
    "mnemonic": "i32.shr_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_rotl": {
    "value": 119,
    "mnemonic": "i32.rotl",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_rotr": {
    "value": 120,
    "mnemonic": "i32.rotr",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32",
      "Int32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_clz": {
    "value": 121,
    "mnemonic": "i64.clz",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_ctz": {
    "value": 122,
    "mnemonic": "i64.ctz",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_popcnt": {
    "value": 123,
    "mnemonic": "i64.popcnt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_add": {
    "value": 124,
    "mnemonic": "i64.add",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_sub": {
    "value": 125,
    "mnemonic": "i64.sub",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_mul": {
    "value": 126,
    "mnemonic": "i64.mul",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_div_s": {
    "value": 127,
    "mnemonic": "i64.div_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_div_u": {
    "value": 128,
    "mnemonic": "i64.div_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_rem_s": {
    "value": 129,
    "mnemonic": "i64.rem_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_rem_u": {
    "value": 130,
    "mnemonic": "i64.rem_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_and": {
    "value": 131,
    "mnemonic": "i64.and",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_or": {
    "value": 132,
    "mnemonic": "i64.or",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_xor": {
    "value": 133,
    "mnemonic": "i64.xor",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_shl": {
    "value": 134,
    "mnemonic": "i64.shl",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_shr_s": {
    "value": 135,
    "mnemonic": "i64.shr_s",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_shr_u": {
    "value": 136,
    "mnemonic": "i64.shr_u",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_rotl": {
    "value": 137,
    "mnemonic": "i64.rotl",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_rotr": {
    "value": 138,
    "mnemonic": "i64.rotr",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64",
      "Int64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "f32_abs": {
    "value": 139,
    "mnemonic": "f32.abs",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_neg": {
    "value": 140,
    "mnemonic": "f32.neg",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_ceil": {
    "value": 141,
    "mnemonic": "f32.ceil",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_floor": {
    "value": 142,
    "mnemonic": "f32.floor",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_trunc": {
    "value": 143,
    "mnemonic": "f32.trunc",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_nearest": {
    "value": 144,
    "mnemonic": "f32.nearest",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_sqrt": {
    "value": 145,
    "mnemonic": "f32.sqrt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_add": {
    "value": 146,
    "mnemonic": "f32.add",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_sub": {
    "value": 147,
    "mnemonic": "f32.sub",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_mul": {
    "value": 148,
    "mnemonic": "f32.mul",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_div": {
    "value": 149,
    "mnemonic": "f32.div",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_min": {
    "value": 150,
    "mnemonic": "f32.min",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_max": {
    "value": 151,
    "mnemonic": "f32.max",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_copysign": {
    "value": 152,
    "mnemonic": "f32.copysign",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32",
      "Float32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f64_abs": {
    "value": 153,
    "mnemonic": "f64.abs",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_neg": {
    "value": 154,
    "mnemonic": "f64.neg",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_ceil": {
    "value": 155,
    "mnemonic": "f64.ceil",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_floor": {
    "value": 156,
    "mnemonic": "f64.floor",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_trunc": {
    "value": 157,
    "mnemonic": "f64.trunc",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_nearest": {
    "value": 158,
    "mnemonic": "f64.nearest",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_sqrt": {
    "value": 159,
    "mnemonic": "f64.sqrt",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_add": {
    "value": 160,
    "mnemonic": "f64.add",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_sub": {
    "value": 161,
    "mnemonic": "f64.sub",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_mul": {
    "value": 162,
    "mnemonic": "f64.mul",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_div": {
    "value": 163,
    "mnemonic": "f64.div",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_min": {
    "value": 164,
    "mnemonic": "f64.min",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_max": {
    "value": 165,
    "mnemonic": "f64.max",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_copysign": {
    "value": 166,
    "mnemonic": "f64.copysign",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64",
      "Float64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "i32_wrapi64": {
    "value": 167,
    "mnemonic": "i32.wrap/i64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_trunc_sf32": {
    "value": 168,
    "mnemonic": "i32.trunc_s/f32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_trunc_uf32": {
    "value": 169,
    "mnemonic": "i32.trunc_u/f32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_trunc_sf64": {
    "value": 170,
    "mnemonic": "i32.trunc_s/f64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i32_trunc_uf64": {
    "value": 171,
    "mnemonic": "i32.trunc_u/f64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_extend_si32": {
    "value": 172,
    "mnemonic": "i64.extend_s/i32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_extend_ui32": {
    "value": 173,
    "mnemonic": "i64.extend_u/i32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_trunc_sf32": {
    "value": 174,
    "mnemonic": "i64.trunc_s/f32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_trunc_uf32": {
    "value": 175,
    "mnemonic": "i64.trunc_u/f32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_trunc_sf64": {
    "value": 176,
    "mnemonic": "i64.trunc_s/f64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "i64_trunc_uf64": {
    "value": 177,
    "mnemonic": "i64.trunc_u/f64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "f32_convert_si32": {
    "value": 178,
    "mnemonic": "f32.convert_s/i32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_convert_ui32": {
    "value": 179,
    "mnemonic": "f32.convert_u/i32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_convert_si64": {
    "value": 180,
    "mnemonic": "f32.convert_s/i64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_convert_ui64": {
    "value": 181,
    "mnemonic": "f32.convert_u/i64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f32_demotef64": {
    "value": 182,
    "mnemonic": "f32.demote/f64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f64_convert_si32": {
    "value": 183,
    "mnemonic": "f64.convert_s/i32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_convert_ui32": {
    "value": 184,
    "mnemonic": "f64.convert_u/i32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_convert_si64": {
    "value": 185,
    "mnemonic": "f64.convert_s/i64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_convert_ui64": {
    "value": 186,
    "mnemonic": "f64.convert_u/i64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "f64_promotef32": {
    "value": 187,
    "mnemonic": "f64.promote/f32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Float64"
    ]
  },
  "i32_reinterpretf32": {
    "value": 188,
    "mnemonic": "i32.reinterpret/f32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float32"
    ],
    "pushOperands": [
      "Int32"
    ]
  },
  "i64_reinterpretf64": {
    "value": 189,
    "mnemonic": "i64.reinterpret/f64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Float64"
    ],
    "pushOperands": [
      "Int64"
    ]
  },
  "f32_reinterpreti32": {
    "value": 190,
    "mnemonic": "f32.reinterpret/i32",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int32"
    ],
    "pushOperands": [
      "Float32"
    ]
  },
  "f64_reinterpreti64": {
    "value": 191,
    "mnemonic": "f64.reinterpret/i64",
    "stackBehavior": "PopPush",
    "popOperands": [
      "Int64"
    ],
    "pushOperands": [
      "Float64"
    ]
  }
}