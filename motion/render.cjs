// Frame-exact renderer: drives index.html in headless Chromium and pipes PNG frames into ffmpeg.
// usage: node render.cjs --comp preview --out out.mp4 [--fps 60] [--audio vo.mp3] [--stills 1.2,3.4] [--from 0 --to 5]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), [])
);
const comp = args.comp || 'preview';
const fps = Number(args.fps || 60);
const out = args.out || `${comp}.mp4`;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto('file://' + path.resolve(__dirname, 'index.html') + `?comp=${comp}&render=1`);
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.COMP.duration);
  const grab = (t) => page.evaluate((tt) => { window.renderAt(tt); return window.canvas.toDataURL('image/png').slice(22); }, t);

  if (args.stills) {
    for (const s of args.stills.split(',')) {
      const file = out.replace(/\.mp4$/, '') + `-${s}s.png`;
      fs.writeFileSync(file, Buffer.from(await grab(Number(s)), 'base64'));
      console.log('still', file);
    }
    await browser.close();
    return;
  }

  const from = Number(args.from || 0), to = Math.min(Number(args.to || duration), duration);
  const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-'];
  if (args.audio) ff.push('-i', args.audio, '-c:a', 'aac', '-b:a', '192k', '-shortest');
  ff.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', out);
  const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round((to - from) * fps);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    const buf = Buffer.from(await grab(from + f / fps), 'base64');
    if (!proc.stdin.write(buf)) await new Promise((r) => proc.stdin.once('drain', r));
    if (f % 120 === 0) console.log(`frame ${f}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  proc.stdin.end();
  await new Promise((r) => proc.on('close', r));
  await browser.close();
  console.log('wrote', out, `${frames} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})();
