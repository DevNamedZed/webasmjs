import type { Program } from './types';

export const programs: Program[] = [
  {
    name: 'hello',
    description: 'Basic arithmetic and print',
    source: `
x = 10
y = 20
print x + y
print x * y - 5
print (x + y) * 2
`,
  },

  {
    name: 'strings',
    description: 'String printing via linear memory',
    source: `
print "hello world"
print "MiniPy compiles to WebAssembly!"
x = 42
print x
print "done"
`,
  },

  {
    name: 'lists',
    description: 'List operations with GC arrays',
    source: `
nums = [3, 1, 4, 1, 5]
print nums[0]
print nums[2]
print len(nums)
print nums[0] + nums[4]
`,
  },

  {
    name: 'objects',
    description: 'Object literals with GC structs',
    source: `
point = {x: 10, y: 20}
print point.x
print point.y
print point.x + point.y
`,
  },

  {
    name: 'loops',
    description: 'While loops and for-in loops',
    source: `
# While loop: sum 0..9
i = 0
sum = 0
while i < 10:
    sum = sum + i
    i = i + 1
end
print sum

# For-in loop over a list
nums = [10, 20, 30, 40, 50]
total = 0
for n in nums:
    total = total + n
end
print total
`,
  },

  {
    name: 'functions',
    description: 'User-defined functions with def/return',
    source: `
def square(x):
    return x * x
end

def add(a, b):
    return a + b
end

print square(7)
print add(100, 200)
print square(3) + square(4)
`,
  },

  {
    name: 'operators',
    description: 'Division, modulo, comparisons, and logic',
    source: `
# Division and modulo
print 100 / 3
print 100 % 3

# All comparisons
print 5 > 3
print 5 < 3
print 5 >= 5
print 5 <= 4
print 5 == 5
print 5 != 5

# Logical operators
x = 10
if x > 5 and x < 20:
    print 1
end

if x > 100 or x == 10:
    print 1
end

if not x == 5:
    print 1
end

# Unary minus
print -42 + 50
`,
  },

  {
    name: 'combined',
    description: 'All features: functions, objects, lists, loops, strings, logic',
    source: `
print "=== MiniPy Demo ==="

# Define a function
def sum_list(nums):
    total = 0
    i = 0
    while i < len(nums):
        total = total + nums[i]
        i = i + 1
    end
    return total
end

# Use objects and lists
p = {x: 3, y: 4}
nums = [10, 20, 30, 40, 50]

# Call our function
total = sum_list(nums)
print total

# For-in loop
doubled = 0
for n in nums:
    doubled = doubled + n * 2
end
print doubled

# Object field access + arithmetic
print p.x + p.y

# Conditional with logic
if total > 100 and p.x + p.y == 7:
    print 1
else:
    print 0
end

print "=== done ==="
`,
  },
];
