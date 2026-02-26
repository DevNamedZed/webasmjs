import { parse } from './parser/parser';
import { compile } from './compiler/compiler';
import { programs } from './programs';

async function main() {
  const filter = process.argv[2];

  const selected = filter
    ? programs.filter(p => p.name === filter)
    : programs;

  if (selected.length === 0) {
    console.error(`Unknown program: ${filter}`);
    console.error(`Available: ${programs.map(p => p.name).join(', ')}`);
    process.exit(1);
  }

  for (const program of selected) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${program.name} — ${program.description}`);
    console.log(`${'='.repeat(60)}\n`);

    console.log('Source:');
    console.log(program.source.trim());
    console.log();

    const ast = parse(program.source);
    const result = compile(ast, program.name);

    console.log('Generated WAT:');
    console.log(result.wat);

    console.log(`Binary size: ${result.bytes.length} bytes`);
    console.log(`Valid: ${result.valid}`);
    console.log();

    if (result.valid) {
      console.log('Output:');
      try {
        await result.run(
          (value) => console.log(`  ${value}`),
          (str) => console.log(`  ${str}`),
        );
      } catch (err: any) {
        console.log(`  (instantiation not supported: ${err.message})`);
      }
    }
  }
}

main().catch(console.error);
