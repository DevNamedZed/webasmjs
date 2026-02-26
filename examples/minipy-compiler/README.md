# MiniPy Compiler

A tiny Python-like language that compiles to WebAssembly using [webasmjs](https://github.com/DevNamedZed/webasmjs). This is a showcase example demonstrating how to use webasmjs as a compiler backend, including WebAssembly GC features (structs and arrays), linear memory, and multi-function modules.

## Quick Start

```bash
npm install
npm start           # Run all example programs
npm start hello     # Run a specific program
```

## The Language

MiniPy supports integers, strings, lists (GC arrays), objects (GC structs), functions, and control flow.

```python
# Variables and arithmetic
x = 10
y = 20
print x + y * 2

# Strings
print "hello world"

# Functions
def square(n):
    return n * n
end
print square(7)

# Lists — compiled to WebAssembly GC arrays
nums = [3, 1, 4, 1, 5]
print nums[0]
print len(nums)

# Objects — compiled to WebAssembly GC structs
point = {x: 10, y: 20}
print point.x + point.y

# For-in loops over lists
for n in nums:
    print n
end

# While loops
i = 0
while i < 10:
    i = i + 1
end

# Conditionals with logic
if x > 5 and y < 100:
    print 1
else:
    print 0
end
```

## Language Reference

### Types

Types are inferred from the first assignment:

| MiniPy | WebAssembly |
|--------|-------------|
| `42` (integer) | `i32` |
| `"hello"` (string) | Linear memory data segment |
| `[1, 2, 3]` (list) | GC array of `i32` |
| `{x: 10, y: 20}` (object) | GC struct with named fields |

### Statements

| Syntax | Description |
|--------|-------------|
| `x = expr` | Variable assignment |
| `print expr` | Print a value (integer or string) |
| `if expr: ... end` | Conditional |
| `if expr: ... else: ... end` | Conditional with else |
| `while expr: ... end` | While loop |
| `for x in list: ... end` | Iterate over a list |
| `def name(args): ... end` | Function definition |
| `return expr` | Return from function |

### Expressions

| Syntax | Description |
|--------|-------------|
| `42` | Integer literal |
| `"hello"` | String literal |
| `x` | Variable |
| `x + y`, `x - y`, `x * y` | Arithmetic |
| `x / y`, `x % y` | Division and modulo |
| `x > y`, `x < y`, `x >= y`, `x <= y` | Comparison |
| `x == y`, `x != y` | Equality |
| `x and y`, `x or y`, `not x` | Logical (short-circuit) |
| `-x` | Unary negation |
| `f(x, y)` | Function call |
| `[1, 2, 3]` | List literal |
| `nums[i]` | List access |
| `len(nums)` | List length |
| `{x: 10, y: 20}` | Object literal |
| `point.x` | Field access |
| `(expr)` | Grouping |

## How It Works

The compiler has three phases:

### 1. Parse (`parser.ts`)
Tokenizes source text and parses it into an AST using recursive descent. Supports operator precedence: `or` < `and` < `not` < comparisons < `+`/`-` < `*`/`/`/`%` < unary < atoms.

### 2. Analyze (`compiler.ts`)
Walks the AST to:
- Infer variable types from their first assignment
- Collect unique object shapes (each becomes a GC struct type)
- Collect string literals (laid out in linear memory as data segments)
- Infer function parameter types from call sites

### 3. Emit (`compiler.ts`)
Uses the webasmjs API to build a WebAssembly module:

- `ModuleBuilder` creates the module with GC features enabled
- `importFunction` imports `print` and `print_str` from the host
- `defineMemory` + `defineData` stores string data in linear memory
- `defineArrayType` defines a GC array type for lists
- `defineStructType` defines GC struct types for each object shape
- `defineFunction` emits each user-defined function with proper parameter types
- `defineFunction` emits the `main` function with:
  - `declareLocal` for each variable (i32 for ints, `ref null $type` for GC values)
  - i32 arithmetic, comparison, and logic opcodes
  - `array.new_fixed`, `array.get`, `array.len` for list operations
  - `struct.new`, `struct.get` for object operations
  - `block`/`loop`/`br_if`/`br` for while and for-in loops
  - `if`/`else`/`end` for conditionals
  - Short-circuit `and`/`or` using `if (result i32)` blocks

## webasmjs Features Demonstrated

| Feature | Usage |
|---------|-------|
| `ModuleBuilder` | Module creation with `target: 'latest'` for GC |
| `importFunction` | Host `print` and `print_str` functions |
| `defineMemory` | Linear memory for string data |
| `defineData` | String literals as data segments |
| `exportMemory` | Export memory for host access |
| `defineArrayType` | GC array type for lists |
| `defineStructType` | GC struct types for objects |
| `defineFunction` | Multiple functions (user-defined + main) |
| `withExport` | Export the main entry point |
| `declareLocal` | Variable storage (i32 and ref types) |
| `refNullType` | Concrete nullable reference types for GC locals and params |
| GC opcodes | `struct.new`, `struct.get`, `array.new_fixed`, `array.get`, `array.len` |
| Control flow | `block`, `loop`, `if`/`else`, `br`, `br_if`, `return` |
| i32 arithmetic | `add`, `sub`, `mul`, `div_s`, `rem_s` |
| i32 comparison | `gt_s`, `lt_s`, `ge_s`, `le_s`, `eq`, `ne`, `eqz`, `ge_u` |
| `TextModuleWriter` | WAT output via `mod.toString()` |
| Binary output | `mod.toBytes()` + `WebAssembly.validate()` |
| Instantiation | `WebAssembly.instantiate()` for end-to-end execution |

## Example Programs

| Name | Description | Features |
|------|-------------|----------|
| `hello` | Basic arithmetic and print | i32 ops, variables |
| `strings` | String printing | Linear memory, data segments |
| `lists` | List operations | GC arrays |
| `objects` | Object literals | GC structs |
| `loops` | While and for-in loops | Control flow, GC array iteration |
| `functions` | User-defined functions | Multi-function modules |
| `operators` | All operators and logic | Division, modulo, comparisons, and/or/not |
| `combined` | Everything together | All features in one program |

## Requirements

- Node.js 22+ (for WebAssembly GC support)
