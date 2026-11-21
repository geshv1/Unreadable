/* System 1 — Human pictograms.
   A jointed pictogram (head, capsule torso, two-segment limbs) driven by pose objects.
   Angles are radians from "straight down"; positive = forward (side view) or outward (front view).
   Figures auto-ground: the lowest knee/foot always touches y. */
(function () {
  const M = window.M;
  const base = { lean: 0, hd: 0, hf: 0, la1: 0, la2: 0, ra1: 0, ra2: 0, ll1: 0, ll2: 0, rl1: 0, rl2: 0, spread: 0 };
  const P = {};
  P.side = { ...base };
  P.front = { ...base, spread: 1, la1: 0.1, la2: 0.05, ra1: 0.1, ra2: 0.05, ll1: 0.035, rl1: 0.035 };
  P.frontDown = { ...P.front, hd: 0.035, la1: 0.04, la2: 0, ra1: 0.04, ra2: 0 };
  P.frontCalm = { ...P.front, la1: 0.3, la2: 0.42, ra1: 0.3, ra2: 0.42, ll1: 0.06, rl1: 0.06 };
  P.frontOpen = { ...P.front, la1: 2.3, la2: 2.55, ra1: 2.3, ra2: 2.55, ll1: 0.1, rl1: 0.1 };
  P.meditate = { ...P.front, la1: 0.38, la2: 0.62, ra1: 0.38, ra2: 0.62, ll1: 1.35, ll2: -1.55, rl1: 1.35, rl2: -1.55 };
  P.think = { ...base, lean: 0.05, hd: 0.012, hf: 0.015, ra1: 0.62, ra2: 2.9, la1: 0.05, la2: 0.2 };
  P.sideDown = { ...base, lean: 0.2, hd: 0.035, hf: 0.02, la1: 0.1, la2: 0.14, ra1: 0.1, ra2: 0.14 };
  P.point = { ...base, ra1: 1.45, ra2: 1.5, la1: 0.02, la2: 0.1 };
  M.Pose = P;

  /** procedural walk cycle; ph in radians, amp 0 (still) … 1 (walk) … 1.5 (run) */
  M.walkPose = (ph, amp = 1, extra = {}) => {
    const s = Math.sin(ph), c = Math.cos(ph), A = 0.46 * amp;
    const rl1 = s * A, ll1 = -s * A;
    const rl2 = rl1 - Math.max(0, c) * 0.95 * amp;
    const ll2 = ll1 - Math.max(0, -c) * 0.95 * amp;
    const ra1 = -s * 0.52 * amp, la1 = s * 0.52 * amp;
    return { ...base, lean: 0.05 * amp, rl1, rl2, ll1, ll2, ra1, ra2: ra1 + 0.3 * amp, la1, la2: la1 + 0.3 * amp, ...extra };
  };
  /** walk phase for a distance travelled (px) at figure height h */
  M.walkPhase = (dist, h, amp = 1) => (dist / (h * 0.9 * Math.max(0.6, amp))) * M.TAU;

  M.blendPose = (a, b, t) => {
    const o = {};
    for (const k in base) o[k] = M.lerp(a[k] ?? 0, b[k] ?? 0, t);
    return o;
  };

  /**
   * o: { x, y (ground), h, pose, dir (1 right / -1 left), color, alpha, halo (true), bg }
   */
  M.figure = (ctx, o) => {
    const U = o.h, dir = o.dir || 1, p = o.pose || P.front;
    const col = o.color || M.C.white, bg = o.bg || M.C.bg;
    const front = p.spread > 0.5;
    const TW = (front ? 0.15 : 0.13) * U, LW = 0.084 * U, AW = (front ? 0.07 : 0.062) * U, GAP = (o.gap ?? (front ? 0.018 : 0.011)) * U;
    const TH = 0.245 * U, SH = 0.235 * U, UA = 0.17 * U, FA = 0.16 * U, TL = 0.27 * U, HR = 0.088 * U;
    const hipX = front ? 0.04 * U : 0;
    const limb = (ox, oy, a1, a2, l1, l2, s) => {
      const j = { x: ox + Math.sin(a1) * l1 * s, y: oy + Math.cos(a1) * l1 };
      const e = { x: j.x + Math.sin(a2) * l2 * s, y: j.y + Math.cos(a2) * l2 };
      return [{ x: ox, y: oy }, j, e];
    };
    const sL = front ? -1 : dir, sR = front ? 1 : dir;
    const legL = limb(-hipX, 0, p.ll1, p.ll2, TH, SH, sL);
    const legR = limb(hipX, 0, p.rl1, p.rl2, TH, SH, sR);
    const low = Math.max(legL[1].y, legL[2].y, legR[1].y, legR[2].y) + LW / 2;

    const ax = { x: Math.sin(p.lean) * dir, y: -Math.cos(p.lean) };
    const sh = { x: ax.x * TL, y: ax.y * TL };
    const headD = TW / 2 + GAP * 1.3 + HR;
    const head = { x: sh.x + ax.x * headD + p.hf * U * dir, y: sh.y + ax.y * headD + p.hd * U };
    const shX = front ? TW / 2 + GAP + AW / 2 : 0;
    const px = -ax.y, py = ax.x;
    const shY = 0.02 * U;
    const shL = { x: sh.x - px * shX - ax.x * shY, y: sh.y - py * shX - ax.y * shY };
    const shR = { x: sh.x + px * shX - ax.x * shY, y: sh.y + py * shX - ax.y * shY };
    const armL = limb(shL.x, shL.y, p.la1, p.la2, UA, FA, sL);
    const armR = limb(shR.x, shR.y, p.ra1, p.ra2, UA, FA, sR);

    ctx.save();
    ctx.translate(o.x, o.y - low);
    ctx.globalAlpha *= o.alpha ?? 1;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const halo = o.halo !== false;
    const line = (pts, w, haloOn, a = 1) => {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      if (haloOn && halo) {
        ctx.strokeStyle = bg;
        ctx.lineWidth = w + GAP * 2;
        ctx.stroke();
      }
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * a;
      ctx.strokeStyle = col;
      ctx.lineWidth = w;
      ctx.stroke();
      ctx.globalAlpha = ga;
    };
    const torso = () => line([{ x: -ax.x * 0.012 * U, y: 0.012 * U }, sh], TW, false);
    const headDot = () => {
      ctx.beginPath();
      ctx.arc(head.x, head.y, HR, 0, M.TAU);
      ctx.fillStyle = col;
      ctx.fill();
    };
    if (front) {
      line(legL, LW, false);
      line(legR, LW, false);
      torso();
      headDot();
      line(armL, AW, true);
      line(armR, AW, true);
    } else {
      line(armL, AW, false, 0.45);
      line(legL, LW, false, 0.45);
      torso();
      headDot();
      line(legR, LW, true);
      line(armR, AW, true);
    }
    ctx.restore();
    return { head: { x: o.x + head.x, y: o.y - low + head.y }, top: o.y - low + head.y - HR };
  };
})();
