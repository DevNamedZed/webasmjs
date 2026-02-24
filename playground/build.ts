import * as esbuild from 'esbuild';

const buildOptions: esbuild.BuildOptions = {
  entryPoints: ['playground/playground.ts'],
  bundle: true,
  outfile: 'playground/playground.bundle.js',
  format: 'iife',
  globalName: 'webasmPlayground',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
};

const serve = process.argv.includes('--serve');

if (serve) {
  (async () => {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    const { host, port } = await ctx.serve({ servedir: 'playground', port: 3000 });
    console.log(`Playground dev server running at http://localhost:${port}`);
    console.log('Watching for changes...');
  })();
} else {
  esbuild.buildSync(buildOptions);
  console.log('Playground bundle built successfully.');
}
