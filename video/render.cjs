#!/usr/bin/env node
/* Render an episode to MP4 (H.264, no audio) + frame-0 PNG + cut list.
   Usage:
     node video/render.cjs ep02-control                 # full render
     node video/render.cjs ep02-control --stills 0,3,9  # only PNG stills at these seconds (for checking)
     node video/render.cjs ep02-control --sections      # frame 0 + middle frame of each scene -> out/sections/
     node video/render.cjs ep02-control --timeline      # only write out/<title>-timeline.json (then: python3 video/sfx/mix.py it)
     node video/render.cjs ep02-control --nosfx         # skip the sound-effects mix
     node video/render.cjs ep02-control --debug         # overlay TikTok safe zones on stills            */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const ep = args.find((a) => !a.startsWith('--')) || 'ep02-control';
const opt = (k) => { const i = args.indexOf('--' + k); return i < 0 ? null : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true; };
const outDir = path.resolve(__dirname, 'out');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });   // lets the page draw local image assets
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => { console.error('PAGE ERROR', e); process.exitCode = 1; });
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  const url = 'file://' + path.resolve(__dirname, 'engine/index.html') + `?ep=${ep}${opt('debug') ? '&debug' : ''}`;
  await page.goto(url);
  const info = await page.evaluate(() => V.ready);
  const name = (await page.evaluate(() => V.ep.title)) || ep;
  const total = Math.round(info.duration * info.fps);
  const grab = (i) => page.evaluate((i) => { V.renderFrame(i); return document.getElementById('c').toDataURL('image/png'); }, i);
  const png = (d) => Buffer.from(d.split(',')[1], 'base64');

  // timeline (scene times + resolved sound cues) for video/sfx/mix.py
  fs.writeFileSync(path.join(outDir, `${name}-timeline.json`), JSON.stringify(info, null, 1));
  if (opt('timeline')) { console.log('wrote timeline'); await browser.close(); return; }

  // --sections: frame 0 + the middle frame of every scene as PNGs (out/sections/)
  if (opt('sections')) {
    const dir = path.join(outDir, `${name}-sections` + (opt('debug') ? '-debug' : ''));
    fs.mkdirSync(dir, { recursive: true });
    const picks = [[0, '00-frame0']].concat(info.scenes.map((s, k) => [Math.round(((s.start + s.end) / 2) * info.fps), `${String(k + 1).padStart(2, '0')}-${s.id}`]));
    for (const [i, nm] of picks) { fs.writeFileSync(path.join(dir, `${nm}.png`), png(await grab(i))); console.log('wrote', nm, 'frame', i); }
    await browser.close();
    return;
  }
  const stills = opt('stills');
  if (stills) {
    for (const s of String(stills).split(',')) {
      const i = Math.min(total - 1, Math.round(parseFloat(s) * info.fps));
      const f = path.join(outDir, `still-${String(i).padStart(4, '0')}.png`);
      fs.writeFileSync(f, png(await grab(i)));
      console.log('wrote', f);
    }
    await browser.close();
    return;
  }

  const mp4 = path.join(outDir, `${name}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(info.fps), '-c:v', 'png', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(info.fps),
    '-profile:v', 'high', '-movflags', '+faststart', '-an', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error('ffmpeg ' + c)) : res())));

  const t0 = Date.now();
  for (let i = 0; i < total; i++) {
    const buf = png(await grab(i));
    if (i === 0) fs.writeFileSync(path.join(outDir, `${name}-frame0.png`), buf);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) process.stdout.write(`frame ${i}/${total} (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
  }
  ff.stdin.end();
  await done;
  await browser.close();

  // cut list for sound design
  const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`; };
  const lines = [`${name} — scene transitions (${info.duration}s @ ${info.fps}fps)`, ''];
  for (const s of info.scenes) lines.push(`${fmt(s.start)}  frame ${String(Math.round(s.start * info.fps)).padStart(3)}  ${s.id}`);
  lines.push('', 'Cuts (whoosh starts ~0.16s before, bass hit on the cut):');
  for (const c of info.cuts) lines.push(`  ${fmt(c.t)}  (${c.t.toFixed(2)}s, frame ${Math.round(c.t * info.fps)})  -> ${c.scene}`);
  fs.writeFileSync(path.join(outDir, `${name}-cuts.txt`), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  console.log('wrote', mp4);
  if (!opt('nosfx') && (info.sfx || []).length) {
    const r = require('child_process').spawnSync('python3', [path.join(__dirname, 'sfx/mix.py'), path.join(outDir, `${name}-timeline.json`)], { stdio: 'inherit' });
    if (r.status) throw new Error('sfx mix failed');
  }
})().catch((e) => { console.error(e); process.exit(1); });
