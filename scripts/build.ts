import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTDIR = path.join(ROOT, 'dist');

const MAIN_IN = path.join(ROOT, 'src', 'index.tsx');
const MAIN_OUT = 'cli.js';

const WORKER_IN = path.join(ROOT, 'src', 'processes', 'log-worker.mjs');
const WORKER_OUT = 'processes/log-worker.mjs';

try {
  console.log('Starting main bundle...');
  await Bun.build({
    entrypoints: [MAIN_IN],
    outdir: OUTDIR,
    target: 'node',
    format: 'esm',
    throw: true,
    packages: 'bundle',
    naming: MAIN_OUT,
  });
  console.log('Finished main bundle');

  console.log('Shimming Yoga.wasm...');
  const CLI_PATH = path.join(OUTDIR, MAIN_OUT);
  const bin = Bun.file(CLI_PATH);
  let content = await new Response(bin).text();
  content = content.replace(
    /var Yoga = await initYoga\(await E\(_\(import\.meta\.url\)\.resolve\("\.\/yoga\.wasm"\)\)\);/g,
    `import initYogaAsm from 'yoga-wasm-web/asm'; const Yoga = initYogaAsm();`
  );
  await Bun.write(CLI_PATH, content);
  console.log('Shimming yoga complete');
} catch (e) {
  console.error('Failed to bundle', e);
}
