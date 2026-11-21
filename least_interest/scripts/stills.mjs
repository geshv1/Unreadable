// Usage: node scripts/stills.mjs outDir frame1 frame2 ...   (bundles once, renders many stills)
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const [, , outDir, ...frames] = process.argv;
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'LeastInterest', browserExecutable});
for (const fr of frames) {
  await renderStill({serveUrl, composition, frame: Number(fr), output: `${outDir}/f${fr}.png`, browserExecutable, chromiumOptions: {gl: 'swangle'}});
  process.stdout.write(fr + ' ');
}
console.log('\nTOTAL', composition.durationInFrames);
