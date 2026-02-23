import * as esbuild from 'esbuild';

esbuild.buildSync({
  entryPoints: ['playground/playground.ts'],
  bundle: true,
  outfile: 'playground/playground.bundle.js',
  format: 'iife',
  globalName: 'webasmPlayground',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
});

console.log('Playground bundle built successfully.');
