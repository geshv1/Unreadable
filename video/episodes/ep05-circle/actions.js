/* Scene actions for Pt. 5 "Different circle." — the company you keep.
   World coordinates; each scene's camera (cam) is applied by the player. Extra figures: 'other' (charcoal,
   grey outline) for Reactive's crowd, 'ally' (charcoal, white rim) for Steady's circle. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const headPt = (f) => V.figPoint(f, 'H');
  const say = (g, o) => V.darkBubble(g, Object.assign({ size: 56, font: `700 56px ${V.FONT.sans}` }, o));
  const X = (o) => V.X(Object.assign({ pose: PO.stand }, o));
  const C = (o) => V.X(Object.assign({ kind: 'crowd', pose: PO.stand }, o));   // background crowd

  function shadowbox(tl, per = 0.6, off = 0) {
    const p = (tl + off) / per, k = p % 1, n = Math.floor(p);
    const amt = k < 0.38 ? Math.sin((k / 0.38) * Math.PI) : 0;
    return V.shift(V.lerpPose(V.breathe(PO.guard, tl, 1.4, 6), n % 3 === 2 ? PO.cross2 : PO.jab, amt), Math.sin((tl + off) * 6) * 1.2, 0, true);
  }
  function phoneGlow(g, f) { const h = V.figPoint(f, 'hF'); g.save(); g.fillStyle = 'rgba(160,200,255,0.85)'; g.shadowColor = '#9fc3ff'; g.shadowBlur = 26; V.roundRect(g, h[0] - 12, h[1] - 44, 24, 40, 5); g.fill(); g.restore(); }

  // ─────────────────────────────── COLD OPEN — slow push-in, a dark crowd behind them
  const CROWD = [60, 150, 235, 430, 520, 610, 800, 890, 980, 1060].map((x, i) => ({ x, i }));
  V.actions.coldOpen = function (tl) {
    const crowd = CROWD.map(({ x, i }) => C({ depth: 'back', x, y: 1296, s: 0.56, alpha: 0.8, face: i % 2 ? 1 : -1,
      pose: V.breathe(i % 3 ? PO.stand : PO.scroll, tl, 0.8, 1.6, i) }));
    const reactive = V.R({ pose: V.breathe(PO.guard, tl, 1.6, 2.4, 0), expr: tl > 2.6 ? 'neutral' : null });
    const steady = V.St({ pose: V.breathe(PO.guard, tl, 1.6, 2.2, 1.7), expr: tl > 2.6 ? 'neutral' : null });
    return {
      figs: [...crowd, reactive, steady],
      mid(g) { crowd.forEach((f, k) => { if (k % 3 === 0) phoneGlow(g, f); }); },
      fg(g) { // two strangers pass close to the lens
        V.fgFigure(g, { x: V.lerp(-140, 150, tl / 4.2), y: 2380, s: 2.2, face: 1, pose: V.walkPose(tl * 3.2) }, 10, 0.95);
        V.fgFigure(g, { x: V.lerp(1240, 960, tl / 4.2), y: 2420, s: 2.3, face: -1, pose: V.walkPose(tl * 3 + 1) }, 12, 0.95);
      },
    };
  };

  // ─────────────────────────────── RULE I — THE CLUB: you become your circle
  V.actions.circleRule = function (tl) {
    const cp = ease.inOut(seg(tl, 2.0, 5.2));               // how far Reactive has become them
    // Reactive's circle: slouched, on phones, bobbing
    const friends = [[130, 1], [215, 1], [470, -1]].map(([x, face], i) => X({ kind: i === 1 ? 'other' : 'crowd', depth: 'back', x, y: 1300, s: 0.72, face,
      pose: V.shift(i === 1 ? PO.scroll : PO.slump, 0, -Math.abs(Math.sin(tl * 4 + i)) * 2) }));
    const rBase = tl < 1.4 ? V.breathe(PO.guard, tl, 1.4, 4) : V.lerpPose(PO.guard, PO.scroll, ease.inOut(seg(tl, 1.4, 3.2)));
    const reactive = V.R({ pose: V.breathe(rBase, tl, 1, 2), expr: tl < 2.7 ? 'neutral' : tl < 4.4 ? 'grin' : 'sleepy',
      tint: 0.6 * cp, beam: 1 - 0.55 * cp });
    // Steady's circle: training in sync with him
    const allies = [[612, -1, 0.0], [915, -1, 0.0]].map(([x, face, off]) => V.X({ kind: 'ally', depth: 'back', x, y: 1300, s: 0.72, face, pose: shadowbox(tl, 0.6, off) }));
    const steady = V.St({ pose: shadowbox(tl), expr: 'neutral', beam: 1 + 0.12 * seg(tl, 1, 5), beamWarm: 0.35 * seg(tl, 1, 5) });
    return {
      figs: [...friends, ...allies, reactive, steady],
      back(g) {
        V.floorRing(g, 320, 250, V.COL.red, 0.35 + 0.4 * cp, tl);
        V.floorRing(g, 720, 250, '#f4f5f7', 0.5 + 0.4 * seg(tl, 0.5, 4), tl);
      },
      mid(g) { phoneGlow(g, friends[1]); },
      front(g) {
        if (tl > 3.0) phoneGlow(g, reactive);
        const fh = headPt(friends[1]);
        if (tl >= 0.8 && tl < 2.5) say(g, { x: 260, y: 790, text: 'come out tonight', tail: [fh[0] + 20, fh[1] - 60], scale: V.pop(tl - 0.8, 0.14) });
        if (tl >= 2.7 && tl < 4.6) say(g, { red: true, x: 330, y: 790, text: 'say less.', scale: V.pop(tl - 2.7, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE II — THE ROOFTOP: some hands hold you back, some lift you up
  function climb(tl, t0, per, h0, rate) { // alternating climb poses, height rising in steps
    const n = Math.max(0, (tl - t0) / per), k = n % 1;
    const p = V.lerpPose(PO.climbA, PO.climbB, Math.floor(n) % 2 ? 1 - ease.inOut(k) : ease.inOut(k));
    return [p, h0 + rate * (Math.floor(n) + ease.inOut(k))];
  }
  V.actions.ladderRule = function (tl) {
    // Reactive: climbs, gets pulled back down, ends at the bottom looking up
    let rPose, rh, rExpr = 'neutral';
    if (tl < 0.3) { rPose = PO.stand; rh = 0; }
    else if (tl < 1.85) { [rPose, rh] = climb(tl, 0.3, 0.3, 0, 38); rh = Math.min(rh, 200); }
    else if (tl < 2.35) { rPose = PO.climbA; rh = 200; rExpr = 'fear'; }
    else if (tl < 2.95) { rPose = PO.climbA; rh = 200 * (1 - ease.in(seg(tl, 2.35, 2.95))); rExpr = 'fear'; }
    else { rPose = V.set(V.breathe(PO.stand, tl, 1, 2), 'hd', [3, -3]); rh = 0; rExpr = 'shame'; }
    const reactive = V.R({ x: 300, y: V.FLOOR - rh, pose: rPose, expr: rExpr, headTilt: tl > 3.1 ? -0.3 : 0 });
    const grab = V.figLocalToWorld(reactive, V.geom(rPose).fB);
    const friend = X({ x: 150, s: 0.9, face: 1, pose: tl > 1.7 && tl < 3.0 ? V.set(PO.reachUp, 'hF', [(grab[0] - 150) / (V.S * 0.9), (grab[1] - V.FLOOR) / (V.S * 0.9)]) : tl >= 3.0 ? PO.shoulder : PO.stand });
    // Steady: a boost from his friend, then a steady climb to the top
    let sPose, sh;
    if (tl < 0.75) { sPose = V.set(PO.stand, 'fF', [14, -30]); sh = 0; }
    else if (tl < 1.05) { sPose = PO.climbA; sh = 70 * ease.out(seg(tl, 0.75, 1.05)); }
    else { [sPose, sh] = climb(tl, 1.05, 0.34, 70, 17); sh = Math.min(sh, 300); }
    const steady = V.St({ x: 690, y: V.FLOOR - sh, face: 1, pose: sPose, expr: 'neutral', beamWarm: 0.5 * seg(tl, 1, 5.5) });
    const ally = V.X({ kind: 'ally', x: 575, s: 0.9, face: 1, pose: tl < 1.2 ? PO.boost : V.breathe(PO.stand, tl, 1, 2), headTilt: tl > 1.4 ? -0.35 : 0 });
    return {
      figs: [friend, ally, reactive, steady],
      shake: tl > 2.95 && tl < 3.1 ? 6 : 0,
      back(g) { V.ladder(g, 340, 560); V.ladder(g, 730, 560); },
      front(g) {
        const fh = headPt(friend);
        if (tl >= 1.95 && tl < 3.6) say(g, { x: 300, y: 760, text: 'stay, bro.', tail: [fh[0] + 10, fh[1] - 60], scale: V.pop(tl - 1.95, 0.14) });
      },
    };
  };

  // ─────────────────────────────── RULE III — THE CAFÉ: people, or ideas
  function cafeTable(g, x) {
    const top = V.FLOOR - 215;
    g.save(); g.strokeStyle = '#c9cbd3'; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, V.FLOOR - 6); g.moveTo(x - 46, V.FLOOR - 4); g.lineTo(x + 46, V.FLOOR - 4); g.stroke();
    g.fillStyle = '#e8eaee'; g.strokeStyle = '#16171c'; g.lineWidth = 5; V.roundRect(g, x - 82, top - 12, 164, 20, 8); g.fill(); g.stroke();
    g.fillStyle = '#f4f5f7'; g.fillRect(x - 40, top - 40, 22, 28); g.fillRect(x + 22, top - 40, 22, 28);   // two cups
    g.restore();
  }
  V.actions.talkRule = function (tl) {
    const talkR = (t) => V.lerpPose(PO.talkA, PO.talkB, 0.5 + 0.5 * Math.sin(t * 7));
    const friend = X({ x: 135, s: 0.92, face: 1, pose: tl < 2 || tl > 3.4 ? talkR(tl) : V.breathe(PO.stand, tl, 1, 2) });
    const reactive = V.R({ x: 345, face: -1, pose: tl > 2 && tl < 3.4 ? talkR(tl + 1) : V.breathe(PO.stand, tl, 1, 2), expr: tl > 2 ? 'grin' : 'neutral', mouth: 0.5 + 0.5 * Math.sin(tl * 20) });
    const ally = V.X({ kind: 'ally', x: 905, s: 0.92, face: -1, pose: tl < 2.2 || tl > 3.5 ? talkR(tl + 2) : V.breathe(PO.stand, tl, 1, 2) });
    const writing = tl > 2.2 && tl < 4.2;
    const steady = V.St({ x: 700, face: 1, pose: writing ? V.set(V.set(PO.phone, 'hF', [24, -66]), 'hd', [3, 6]) : V.breathe(PO.stand, tl, 1, 2), expr: 'neutral' });
    return {
      figs: [friend, ally, reactive, steady],
      mid(g) { cafeTable(g, 240); cafeTable(g, 803); },
      front(g) {
        if (writing) V.notebook(g, V.figPoint(steady, 'hF'), tl, true);
        if (tl >= 0.5 && tl < 2.0) say(g, { x: 280, y: 800, text: 'you heard?', scale: V.pop(tl - 0.5, 0.14) });
        if (tl >= 2.0 && tl < 3.5) say(g, { red: true, x: 300, y: 800, text: 'no way!', scale: V.pop(tl - 2.0, 0.14) });
        if (tl >= 3.5) say(g, { x: 300, y: 800, text: 'so fake lol', scale: V.pop(tl - 3.5, 0.14) });
        if (tl >= 0.7 && tl < 2.4) { say(g, { x: 770, y: 700, text: 'what if we…', scale: V.pop(tl - 0.7, 0.14) }); V.bulb(g, 600, 612, 1.5 * V.pop(tl - 0.7, 0.14)); }
        if (tl >= 3.6) { say(g, { x: 770, y: 700, text: 'we build it.', scale: V.pop(tl - 3.6, 0.14) }); V.bulb(g, 600, 612, 1.5); }
      },
    };
  };

  // ─────────────────────────────── RULE IV — RAIN: it's okay to outgrow people
  const OLD = [[205, 1], [455, -1], [540, -1]];
  V.actions.outgrowRule = function (tl) {
    const crowd = OLD.map(([x, face], i) => (i === 1 ? X : C)({ depth: 'back', x, y: 1305, s: 0.74, face, pose: V.breathe(i === 2 ? PO.scroll : PO.stand, tl, 0.8, 1.4, i) }));
    // Steady: turns, a look back, a nod, then walks slowly into the light
    const sx = kf(tl, [[0, 640], [2.6, 640], [6.5, 862]], ease.inOut);
    const walking = tl > 2.6;
    const steady = V.St({ x: sx, face: tl < 0.5 ? -1 : 1, pose: walking ? V.walkPose((tl - 2.6) * 4.2) : V.breathe(PO.stand, tl, 1, 2),
      expr: 'neutral', look: tl > 0.9 && tl < 2.3 ? -1 : 0, headTilt: tl > 1.9 && tl < 2.3 ? 0.22 : tl > 0.9 && tl < 1.9 ? -0.08 : 0,
      beamWarm: 0.6 * seg(tl, 2.6, 6), beam: 1 + 0.1 * seg(tl, 2.6, 6) });
    // Reactive: steps after him, a hand on his shoulder, sits back down with them
    const rx = kf(tl, [[0, 330], [2.8, 330], [3.4, 382], [3.7, 382], [4.2, 340]], ease.inOut);
    let rPose = V.breathe(PO.stand, tl, 1, 2);
    if (tl > 2.8 && tl < 3.4) rPose = V.walkPose((tl - 2.8) * 6);
    else if (tl > 4.2) rPose = poseAt(tl, [[4.2, PO.stand], [4.7, PO.sit]]);
    const reactive = V.R({ x: rx, face: tl < 3.7 ? 1 : -1, pose: rPose, expr: tl < 3.7 ? 'neutral' : 'shame',
      beam: 1 - 0.5 * seg(tl, 4.0, 5.5), beamW: 1 - 0.45 * seg(tl, 4.0, 5.5) });
    const holder = X({ x: 232, s: 0.92, face: 1, pose: tl > 3.3 && tl < 4.4 ? V.set(PO.shoulder, 'hF', [(rx - 232) / (V.S * 0.92) - 4, -86]) : V.breathe(PO.stand, tl, 1, 2) });
    return {
      figs: [...crowd, holder, reactive, steady],
      mid(g) { phoneGlow(g, crowd[2]); },
      front(g) {
        V.rain(g, tl, 1, 11);
        if (tl >= 1.1 && tl < 2.6) say(g, { x: 470, y: 770, text: 'you changed.', scale: V.pop(tl - 1.1, 0.14) });
        if (tl >= 4.5) say(g, { red: true, x: 300, y: 790, text: 'next year.', scale: V.pop(tl - 4.5, 0.14) });
      },
      fg(g) { V.fgFigure(g, { x: V.lerp(-60, 190, tl / 6.5), y: 2400, s: 2.3, face: 1, pose: V.walkPose(tl * 2.4) }, 11, 0.95); },
    };
  };

  // ─────────────────────────────── FIGHT NIGHT — your corner wins fights
  V.actions.cornerRule = function (tl) {
    const SEAT = V.FLOOR - 160, STAND = 3.0, TOUCH = 4.7;
    const crowd = [[110, 1], [195, -1], [470, -1]].map(([x, face], i) => C({ depth: 'back', x, y: 1300, s: 0.7, face, pose: V.breathe(PO.scroll, tl, 0.8, 1.6, i) }));
    // Reactive: alone on his stool, looks back for someone, then accepts the glove
    let rPose, rx = kf(tl, [[0, 300], [3.9, 300], [TOUCH, 360]], ease.inOut);
    if (tl < STAND) rPose = V.breathe(PO.stoolSlump, tl, 1, 1.6);
    else if (tl < 3.9) rPose = poseAt(tl, [[STAND, PO.stoolSlump], [3.45, PO.guard]]);
    else rPose = poseAt(tl, [[3.9, V.walkPose(0.6)], [4.3, V.walkPose(2.2)], [TOUCH, PO.glove]]);
    const rStanding = tl > STAND + 0.2;
    const reactive = V.R({ x: rx, y: rStanding ? V.FLOOR : V.FLOOR - (V.FLOOR - SEAT) + 0 * 0, pose: rPose, expr: tl < 3.9 ? 'shame' : 'neutral',
      look: tl > 0.9 && tl < 2.4 ? -1 : 0, tint: 0.35 * (1 - seg(tl, 4.2, 5.4)), beam: 0.6 + 0.4 * seg(tl, 4.4, 5.6), beamWarm: 0.55 * seg(tl, 4.6, 6) });
    if (!rStanding) reactive.y = V.FLOOR;
    // Steady: towel, coach's hand on his shoulder, stands, offers the glove
    let sPose;
    if (tl < STAND) sPose = V.breathe(PO.stool, tl, 1.2, 2.4);
    else if (tl < 3.6) sPose = poseAt(tl, [[STAND, PO.stool], [3.45, PO.guard]]);
    else sPose = poseAt(tl, [[3.6, PO.guard], [4.1, PO.glove]]);
    const steady = V.St({ x: 700, pose: sPose, expr: 'neutral', beamWarm: 0.3 + 0.4 * seg(tl, 4.6, 6) });
    const coach = V.X({ kind: 'ally', x: 880, s: 0.92, face: -1, pose: tl < STAND ? V.set(PO.shoulder, 'hF', [(880 - 700) / (V.S * 0.92) - 6, -84]) : V.breathe(PO.stand, tl, 1, 2) });
    return {
      figs: [...crowd, coach, reactive, steady],
      mid(g) {
        V.stool(g, 300, SEAT + 6); V.stool(g, 700, SEAT + 6);
        crowd.forEach((f) => phoneGlow(g, f));
      },
      front(g) {
        if (tl < STAND + 0.4) V.towel(g, V.figPoint(steady, 'neck'), -1);
        if (tl >= 0.6 && tl < 2.6) say(g, { x: 740, y: 770, text: "you're ready.", scale: V.pop(tl - 0.6, 0.14) });
        if (tl >= 1.6 && tl < 3.1) say(g, { red: true, x: 300, y: 680, text: 'anyone?', scale: V.pop(tl - 1.6, 0.14) });
        if (tl >= TOUCH) { // soft glow where the gloves meet
          const a = V.figPoint(reactive, 'hF');
          const k = Math.sin(V.clamp((tl - TOUCH) / 0.5) * Math.PI / 2);
          g.save(); g.globalCompositeOperation = 'lighter';
          const rg = g.createRadialGradient(a[0], a[1], 4, a[0], a[1], 160 * k + 1);
          rg.addColorStop(0, 'rgba(255,220,170,0.55)'); rg.addColorStop(1, 'rgba(255,220,170,0)');
          g.fillStyle = rg; g.fillRect(a[0] - 200, a[1] - 200, 400, 400); g.restore();
        }
      },
    };
  };
})();
