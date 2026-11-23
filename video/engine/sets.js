/* Location backgrounds: dark silhouettes / line art only, so the characters + spotlights stay the focus.
   Each set draws behind the spotlights. Add new sets here (V.sets.name = (g, t) => {...}). */
(function () {
  const V = window.V;
  const F = V.FLOOR;
  const LINE = '#3b3e4a', FILL = '#121319', DIM = '#2a2c36';

  function stroke(g, col = LINE, w = 3) { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; }

  V.sets.stage = () => {};

  V.sets.street = function (g, t) {
    const r = V.rng(21);
    // skyline
    let x = -20;
    const blds = [];
    while (x < V.W + 20) { const w = 90 + r() * 120, h = 260 + r() * 330; blds.push([x, w, h]); x += w + 6; }
    for (const [bx, bw, bh] of blds) {
      const top = F - 40 - bh;
      g.fillStyle = FILL; g.fillRect(bx, top, bw, F - top);
      stroke(g, DIM, 2.5); g.strokeRect(bx, top, bw, F - top);
      for (let wy = top + 30; wy < F - 90; wy += 46) for (let wx = bx + 18; wx < bx + bw - 24; wx += 34) {
        const v = r(); if (v < 0.78) continue;
        g.fillStyle = v > 0.95 ? 'rgba(255,214,150,0.30)' : 'rgba(170,180,210,0.13)'; g.fillRect(wx, wy, 14, 20);
      }
    }
    // pavement / curb
    stroke(g, '#2e3039', 3); g.beginPath(); g.moveTo(0, F - 34); g.lineTo(V.W, F - 34); g.stroke();
    // street lamp (right edge, decorative)
    const lx = 1000;
    stroke(g, '#4a4d5a', 7); g.beginPath(); g.moveTo(lx, F); g.lineTo(lx, 860); g.quadraticCurveTo(lx, 820, lx - 50, 822); g.stroke();
    g.fillStyle = '#4a4d5a'; g.beginPath(); g.moveTo(lx - 80, 822); g.lineTo(lx - 22, 822); g.lineTo(lx - 34, 842); g.lineTo(lx - 68, 842); g.closePath(); g.fill();
    const lg = g.createRadialGradient(lx - 51, 846, 4, lx - 51, 846, 170);
    lg.addColorStop(0, 'rgba(255,226,170,0.55)'); lg.addColorStop(1, 'rgba(255,226,170,0)');
    g.fillStyle = lg; g.beginPath(); g.arc(lx - 51, 846, 170, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(255,226,170,0.06)'; g.beginPath(); g.moveTo(lx - 66, 842); g.lineTo(lx - 36, 842); g.lineTo(lx + 60, F); g.lineTo(lx - 170, F); g.closePath(); g.fill();
  };

  V.sets.room = function (g, t) {
    // window with moon
    const wx = 400, wy = 860, ww = 240, wh = 250;
    g.fillStyle = '#10121a'; g.fillRect(wx, wy, ww, wh);
    g.fillStyle = 'rgba(210,220,255,0.10)'; g.beginPath(); g.arc(wx + 170, wy + 70, 34, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(230,235,255,0.35)'; g.beginPath(); g.arc(wx + 170, wy + 70, 22, 0, 6.283); g.fill();
    stroke(g, '#474a57', 5); g.strokeRect(wx, wy, ww, wh);
    stroke(g, '#474a57', 3); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
    g.fillStyle = 'rgba(200,210,255,0.035)'; g.beginPath(); g.moveTo(wx, wy + wh); g.lineTo(wx + ww, wy + wh); g.lineTo(wx + ww + 120, F); g.lineTo(wx - 60, F); g.closePath(); g.fill();
    // bed (left, behind Reactive)
    g.fillStyle = FILL; g.fillRect(-10, F - 150, 250, 150); stroke(g); g.strokeRect(-10, F - 150, 250, 150);
    g.fillRect(-10, F - 250, 34, 250); g.strokeRect(-10, F - 250, 34, 250);
    g.fillStyle = '#1a1c24'; V.roundRect(g, 30, F - 190, 120, 44, 18); g.fill(); stroke(g); g.stroke();
    // shelf + lamp (right)
    stroke(g, LINE, 4); g.beginPath(); g.moveTo(800, 980); g.lineTo(1000, 980); g.stroke();
    g.fillStyle = '#1a1c24'; g.fillRect(820, 920, 26, 60); g.fillRect(852, 935, 22, 45); g.fillRect(880, 912, 28, 68);
    g.fillStyle = FILL; g.fillRect(880, F - 120, 140, 120); stroke(g); g.strokeRect(880, F - 120, 140, 120);
    stroke(g, '#4a4d5a', 4); g.beginPath(); g.moveTo(950, F - 120); g.lineTo(950, F - 200); g.stroke();
    g.fillStyle = '#4a4d5a'; g.beginPath(); g.moveTo(915, F - 200); g.lineTo(985, F - 200); g.lineTo(970, F - 245); g.lineTo(930, F - 245); g.closePath(); g.fill();
  };

  V.sets.office = function (g, t) {
    // ceiling lights
    for (let i = 0; i < 4; i++) {
      const x = 90 + i * 260;
      g.fillStyle = 'rgba(220,228,255,0.18)'; g.fillRect(x, 790, 150, 8);
    }
    // whiteboard
    g.fillStyle = '#14161e'; g.fillRect(380, 880, 300, 170); stroke(g, '#474a57', 4); g.strokeRect(380, 880, 300, 170);
    stroke(g, '#2f323d', 3); g.beginPath(); g.moveTo(410, 920); g.lineTo(560, 920); g.moveTo(410, 955); g.lineTo(620, 955); g.moveTo(410, 990); g.lineTo(520, 990); g.stroke();
    // back row of desks with monitors
    const desk = (x, y, w) => {
      g.fillStyle = FILL; g.fillRect(x, y, w, 18); stroke(g); g.strokeRect(x, y, w, 18);
      stroke(g, LINE, 3); g.beginPath(); g.moveTo(x + 12, y + 18); g.lineTo(x + 12, F - 60); g.moveTo(x + w - 12, y + 18); g.lineTo(x + w - 12, F - 60); g.stroke();
      const mw = w * 0.42, mx = x + w / 2 - mw / 2;
      g.fillStyle = '#171a24'; g.fillRect(mx, y - 80, mw, 62); stroke(g, '#474a57', 3); g.strokeRect(mx, y - 80, mw, 62);
      g.fillStyle = 'rgba(140,170,255,0.10)'; g.fillRect(mx + 5, y - 75, mw - 10, 52);
      g.fillStyle = LINE; g.fillRect(x + w / 2 - 4, y - 18, 8, 18);
    };
    desk(-40, 1180, 260); desk(820, 1180, 280);
  };

  V.sets.table = function (g, t) {
    // pendant lamp over the table (cord stays faint so it never fights the text)
    stroke(g, 'rgba(70,74,88,0.6)', 3); g.beginPath(); g.moveTo(510, 0); g.lineTo(510, 790); g.stroke();
    g.fillStyle = '#3a3d48'; g.beginPath(); g.moveTo(450, 840); g.lineTo(570, 840); g.lineTo(535, 790); g.lineTo(485, 790); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,236,200,0.9)'; g.beginPath(); g.ellipse(510, 842, 50, 6, 0, 0, 6.283); g.fill();
    g.save(); g.filter = 'blur(10px)';
    const lg = g.createLinearGradient(0, 840, 0, 1180);
    lg.addColorStop(0, 'rgba(255,236,200,0.22)'); lg.addColorStop(1, 'rgba(255,236,200,0.04)');
    g.fillStyle = lg; g.beginPath(); g.moveTo(462, 842); g.lineTo(558, 842); g.lineTo(660, 1180); g.lineTo(360, 1180); g.closePath(); g.fill();
    g.restore();
    // back wall picture frame + plant silhouettes
    g.fillStyle = '#13151c'; g.fillRect(70, 900, 150, 110); stroke(g, '#3f424e', 4); g.strokeRect(70, 900, 150, 110);
    g.fillStyle = FILL; g.fillRect(860, F - 110, 70, 110); stroke(g); g.strokeRect(860, F - 110, 70, 110);
    g.fillStyle = '#1b1e26';
    for (let i = 0; i < 6; i++) { g.beginPath(); g.ellipse(895 + Math.cos(i) * 30, F - 150 - i * 18, 16, 40, i * 0.5 - 1.2, 0, 6.283); g.fill(); }
  };

  // Shared table (drawn as a prop in front of the back figure)
  V.drawTable = function (g) {
    const y = 1178;
    g.fillStyle = '#191a21'; g.strokeStyle = '#4a4d5a'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(372, y + 26); g.lineTo(648, y + 26); g.lineTo(624, y - 16); g.lineTo(396, y - 16); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#24262f'; g.fillRect(372, y + 26, 276, 16); g.strokeRect(372, y + 26, 276, 16);
    g.strokeStyle = '#3b3e4a'; g.lineWidth = 9;
    g.beginPath(); g.moveTo(392, y + 42); g.lineTo(392, V.FLOOR - 4); g.moveTo(628, y + 42); g.lineTo(628, V.FLOOR - 4); g.stroke();
    g.fillStyle = 'rgba(255,236,200,0.10)'; g.beginPath(); g.ellipse(510, y + 6, 110, 12, 0, 0, 6.283); g.fill();
  };

  V.sets.ring = function (g, t) {
    // back ropes + corner posts (red corner left, white corner right) — the original ring
    const posts = [[40, '#E0344A'], [1040, '#e8eaee']];
    const ys = [1000, 1080, 1160];
    for (const y of ys) {
      g.strokeStyle = '#5a1822'; g.lineWidth = 9; g.beginPath(); g.moveTo(40, y); g.lineTo(1040, y); g.stroke();
      g.strokeStyle = 'rgba(255,140,150,0.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(40, y - 3); g.lineTo(1040, y - 3); g.stroke();
    }
    for (const [x, c] of posts) {
      g.fillStyle = '#23252d'; g.fillRect(x - 12, 960, 24, F - 960);
      g.fillStyle = c; V.roundRect(g, x - 17, 970, 34, 210, 10); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, F - 22, V.W, 22);
  };

  // ───────── Pt. 3: minimal line-art sets
  V.sets.dawn = function (g, t) { // window with first light
    const wx = 430, wy = 640, ww = 220, wh = 300;
    const gl = g.createRadialGradient(wx + ww / 2, wy + wh, 10, wx + ww / 2, wy + wh, 420);
    gl.addColorStop(0, 'rgba(255,170,120,0.22)'); gl.addColorStop(1, 'rgba(255,170,120,0)');
    g.fillStyle = gl; g.fillRect(wx - 300, wy - 200, ww + 600, wh + 600);
    g.fillStyle = '#12131a'; g.fillRect(wx, wy, ww, wh);
    const sky = g.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, 'rgba(40,46,80,0.5)'); sky.addColorStop(1, 'rgba(255,150,110,0.35)');
    g.fillStyle = sky; g.fillRect(wx, wy, ww, wh);
    stroke(g, '#4a4d5a', 5); g.strokeRect(wx, wy, ww, wh);
    stroke(g, '#4a4d5a', 3); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke();
  };
  V.sets.yard = function (g, t) { // building site: one scaffold silhouette
    stroke(g, '#34363f', 5);
    for (const x of [40, 1040]) { g.beginPath(); g.moveTo(x, F); g.lineTo(x, 760); g.stroke(); }
    for (const y of [900, 1060, 1220]) { g.beginPath(); g.moveTo(40, y); g.lineTo(150, y); g.moveTo(930, y); g.lineTo(1040, y); g.stroke(); }
  };
  V.sets.gym = function (g, t) { // squat rack + mirror line
    stroke(g, '#3b3e4a', 6);
    const rack = (x) => { g.beginPath(); g.moveTo(x, F); g.lineTo(x, 820); g.moveTo(x + 120, F); g.lineTo(x + 120, 820); g.moveTo(x - 10, 820); g.lineTo(x + 130, 820); g.stroke();
      g.fillStyle = '#23252d'; g.fillRect(x - 40, 960, 200, 14); };
    rack(-40); rack(980);
    stroke(g, '#2a2c35', 3); g.beginPath(); g.moveTo(180, 700); g.lineTo(900, 700); g.stroke();
  };
  V.sets.night = function (g, t) { // empty court: one floodlight off, moon
    g.fillStyle = 'rgba(230,235,255,0.5)'; g.beginPath(); g.arc(860, 640, 30, 0, 6.283); g.fill();
    g.fillStyle = 'rgba(230,235,255,0.08)'; g.beginPath(); g.arc(860, 640, 70, 0, 6.283); g.fill();
    stroke(g, '#3b3e4a', 6); g.beginPath(); g.moveTo(1010, F); g.lineTo(1010, 760); g.stroke();
    g.fillStyle = '#2a2c35'; g.fillRect(960, 730, 100, 36);
  };

  // ───────── Pt. 5 sets (cinematic, still minimal)
  V.sets.club = function (g, t) { // dark room, two neon strips, haze, a bar line
    for (const [x, c] of [[160, 'rgba(224,52,74,'], [920, 'rgba(200,210,255,']]) {
      const a = 0.55 + 0.25 * Math.sin(t * 5 + x);
      g.save(); g.shadowColor = c + '1)'; g.shadowBlur = 40; g.strokeStyle = c + a + ')'; g.lineWidth = 10; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, 640); g.lineTo(x, 1180); g.stroke(); g.restore();
    }
    const hz = g.createLinearGradient(0, 900, 0, V.FLOOR); hz.addColorStop(0, 'rgba(120,120,160,0)'); hz.addColorStop(1, 'rgba(120,120,160,0.10)');
    g.fillStyle = hz; g.fillRect(-300, 900, V.W + 600, V.FLOOR - 900);
    stroke(g, '#2c2e38', 4); g.beginPath(); g.moveTo(-200, 1130); g.lineTo(1280, 1130); g.stroke();
  };
  V.sets.rooftop = function (g, t) { // night sky, distant city bokeh, roof ledge, water tower
    stroke(g, '#3b3e4a', 5); g.beginPath(); g.moveTo(-300, 1330); g.lineTo(1400, 1330); g.stroke();
    stroke(g, '#3b3e4a', 5);
    g.strokeRect(960, 560, 150, 170); g.beginPath(); g.moveTo(980, 730); g.lineTo(970, 1330); g.moveTo(1090, 730); g.lineTo(1100, 1330); g.stroke();
  };
  V.sets.cafe = function (g, t) { // two pendant lamps + window
    for (const x of [225, 815]) {
      stroke(g, 'rgba(70,74,88,0.7)', 3); g.beginPath(); g.moveTo(x, -400); g.lineTo(x, 900); g.stroke();
      g.fillStyle = '#3a3d48'; g.beginPath(); g.moveTo(x - 50, 950); g.lineTo(x + 50, 950); g.lineTo(x + 26, 900); g.lineTo(x - 26, 900); g.closePath(); g.fill();
      g.save(); g.filter = 'blur(12px)';
      const lg = g.createLinearGradient(0, 950, 0, 1200); lg.addColorStop(0, 'rgba(255,226,180,0.30)'); lg.addColorStop(1, 'rgba(255,226,180,0.02)');
      g.fillStyle = lg; g.beginPath(); g.moveTo(x - 46, 952); g.lineTo(x + 46, 952); g.lineTo(x + 150, 1200); g.lineTo(x - 150, 1200); g.closePath(); g.fill(); g.restore();
    }
  };
  V.sets.rainstreet = function (g, t) { // one street lamp (centre-right), wet floor sheen
    const lx = 1060;
    stroke(g, '#4a4d5a', 8); g.beginPath(); g.moveTo(lx, V.FLOOR); g.lineTo(lx, 700); g.quadraticCurveTo(lx, 660, lx - 60, 662); g.stroke();
    g.fillStyle = '#4a4d5a'; g.beginPath(); g.moveTo(lx - 96, 662); g.lineTo(lx - 30, 662); g.lineTo(lx - 44, 684); g.lineTo(lx - 82, 684); g.closePath(); g.fill();
    g.save(); g.filter = 'blur(16px)';
    g.fillStyle = 'rgba(255,226,170,0.16)'; g.beginPath(); g.moveTo(lx - 82, 684); g.lineTo(lx - 44, 684); g.lineTo(lx + 140, V.FLOOR); g.lineTo(lx - 330, V.FLOOR); g.closePath(); g.fill(); g.restore();
    const sh = g.createLinearGradient(0, V.FLOOR, 0, V.FLOOR + 160); sh.addColorStop(0, 'rgba(255,226,170,0.10)'); sh.addColorStop(1, 'rgba(255,226,170,0)');
    g.fillStyle = sh; g.fillRect(500, V.FLOOR, 700, 160);
  };
})();
