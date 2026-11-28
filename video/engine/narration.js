/* Narration captions (voiceover style): one phrase at a time at the top, words light up as they are spoken.
   episode.narration = [{ at, text, red: ['word', ...], wps?: seconds per word, times?: [per-word times] }]
   Upcoming words sit faint (ghost) and fade/rise in on their time; key words in red.
   episode.panel = { top, bottom, feather }: black letterbox around the scene (cinema panel look). */
(function () {
  const V = window.V;
  const SERIF = '"Cormorant Garamond", "Instrument Serif", serif';
  const CX = 540, MAXW = 880;

  V.narrationWords = function (ep) {
    if (ep._nw) return ep._nw;
    const out = [];
    ep.narration.forEach((p, k) => {
      const words = p.text.split(/\s+/).filter(Boolean);
      const reds = (p.red || []).map((w) => w.toLowerCase());
      let t = p.at;
      const end = p.end != null ? p.end : k + 1 < ep.narration.length ? ep.narration[k + 1].at : Infinity;
      words.forEach((w, i) => {
        const tot = words.reduce((a, x) => a + x.length + 2, 0), before = words.slice(0, i).reduce((a, x) => a + x.length + 2, 0);
        const wt = p.times ? p.at + p.times[i] : p.span ? p.at + p.span * before / tot : t;
        out.push({ phrase: k, w, t: wt, end, red: reds.includes(w.toLowerCase()) || reds.includes(w.toLowerCase().replace(/[.,!?;:…]+$/, '')) });
        t += (p.wps || 0.3) + (/[,]$/.test(w) ? 0.12 : /[.!?…]$/.test(w) ? 0.22 : 0);
      });
    });
    return (ep._nw = out);
  };

  V.drawNarration = function (g, t) {
    const ep = V.ep;
    const all = V.narrationWords(ep);
    const cur = all.filter((w) => t >= ep.narration[w.phrase].at - 0.02 && t < w.end);
    if (!cur.length) return;
    const size = ep.narrationSize || 86;
    g.save();
    g.font = `italic 500 ${size}px ${SERIF}`;
    g.textBaseline = 'alphabetic';
    const space = g.measureText(' ').width;
    // wrap into lines
    const lines = [[]]; let lw = 0;
    for (const w of cur) {
      const ww = g.measureText(w.w).width;
      if (lines[lines.length - 1].length && lw + space + ww > MAXW) { lines.push([]); lw = 0; }
      lines[lines.length - 1].push({ ...w, width: ww }); lw += (lw ? space : 0) + ww;
    }
    const y0 = (ep.narrationY || 430) - (lines.length - 1) * size * 0.55;
    const fadeOut = cur[0].end !== Infinity ? V.clamp((cur[0].end - t) / 0.12) : 1;
    lines.forEach((ln, li) => {
      const total = ln.reduce((a, w) => a + w.width, 0) + space * (ln.length - 1);
      let x = CX - total / 2;
      const y = y0 + li * size * 1.08;
      for (const w of ln) {
        const u = V.clamp((t - w.t) / 0.14);
        const a = (0.16 + 0.84 * V.ease.out(u)) * fadeOut;
        g.globalAlpha = a;
        g.shadowColor = 'rgba(0,0,0,0.9)'; g.shadowBlur = u > 0 ? 18 : 0;
        g.fillStyle = w.red && u > 0 ? V.COL.red : '#F4F5F7';
        g.fillText(w.w, x, y + (1 - V.ease.out(u)) * 8);
        x += w.width + space;
      }
    });
    g.restore();
  };

  // is the narrator speaking at time t? returns mouth openness 0..1 (syllable-ish flap while a word is being said)
  V.speaking = function (t) {
    const ws = V.narrationWords(V.ep);
    for (const w of ws) if (t >= w.t && t < w.t + Math.max(0.2, w.w.length * 0.045)) return 0.35 + 0.65 * Math.abs(Math.sin((t - w.t) * 22));
    return 0;
  };

  V.drawPanel = function (g, p) {
    const f = p.feather || 90;
    g.save();
    let gr = g.createLinearGradient(0, p.top - f, 0, p.top + f * 0.5);
    gr.addColorStop(0, 'rgba(5,5,7,1)'); gr.addColorStop(1, 'rgba(5,5,7,0)');
    g.fillStyle = '#050507'; g.fillRect(0, 0, V.W, p.top - f);
    g.fillStyle = gr; g.fillRect(0, p.top - f, V.W, f * 1.5);
    gr = g.createLinearGradient(0, p.bottom - f * 0.5, 0, p.bottom + f);
    gr.addColorStop(0, 'rgba(5,5,7,0)'); gr.addColorStop(1, 'rgba(5,5,7,1)');
    g.fillStyle = gr; g.fillRect(0, p.bottom - f * 0.5, V.W, f * 1.5);
    g.fillStyle = '#050507'; g.fillRect(0, p.bottom + f, V.W, V.H);
    g.restore();
  };
})();
