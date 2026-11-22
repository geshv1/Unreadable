/* Scene actions for Ep. 2 "Different control." Each action: (tl, scene) -> {figs, back, mid, front, shake}.
   tl = seconds since the scene started. Reactive stays LEFT, Steady RIGHT, every scene. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const step = (t, keys) => { let v = keys[0][1]; for (const [k, x] of keys) if (t >= k) v = x; return v; };
  const headPt = (f) => V.figPoint(f, 'H');

  // ─────────────────────────────── RULE I — STREET: emotion is a leash  (3.5s, essentials only)
  // 0.0  stranger already mid-stride near Steady → bumps Steady (0.2) → bumps Reactive (0.7)
  // 0.95 leash pops on Reactive's neck → 1.25 YANK → Reactive dragged, shouting. Steady glances once, keeps walking.
  V.actions.streetLeash = function (tl) {
    const T_LEASH = 0.95, Y0 = 1.25, Y1 = 1.45;
    const sx = tl < 0.95 ? kf(tl, [[0, 860], [0.95, 130]], ease.lin) : kf(tl, [[0.95, 130], [Y0, 130], [Y1 + 0.05, 44]], ease.out);
    const yanking = tl > Y0 - 0.05 && tl < Y1 + 0.25;
    let sPose;
    if (tl < 0.95) sPose = V.walkPose(tl * 11);
    else {
      const hold = V.set(V.set(PO.stand, 'hF', [24, -128]), 'eF', [1, 0.3]);
      const pull = V.set(V.set(V.shift(PO.stand, -6, 0), 'hF', [6, -132]), 'eF', [1, 0.3]);
      sPose = yanking ? V.lerpPose(hold, pull, Math.sin(seg(tl, Y0, Y1 + 0.2) * Math.PI)) : V.breathe(hold, tl, 1.2, 3);
      sPose = V.lerpPose(V.walkPose(0.95 * 11), sPose, seg(tl, 0.95, 1.08));
    }
    const stranger = V.X({ s: 0.9, x: sx, face: tl < 0.97 ? -1 : 1, pose: sPose, expr: tl > 0.65 ? 'sneer' : 'neutral' });

    // Steady: keeps walking right; small jolt at the bump, one glance back, spotlight follows him
    const stX = kf(tl, [[0, 660], [3.5, 770]], ease.lin);
    const jolt = Math.sin(seg(tl, 0.15, 0.32) * Math.PI) * 4;
    const glance = tl > 0.3 && tl < 0.85;
    const steady = V.St({ x: stX, face: 1, pose: V.shift(V.walkPose(tl * 6.5 + 1.5), -jolt, 0), expr: 'neutral',
      look: glance ? -1 : 0, headTilt: glance ? -0.12 : 0 });

    // Reactive: walking → bumped → turns angry → leash → dragged, shouting
    let rx, rPose, rFace = 1, rExpr = 'neutral';
    if (tl < 0.7) { rx = kf(tl, [[0, 300], [0.7, 322]], ease.lin); rPose = V.walkPose(tl * 8); }
    else if (tl < Y0) {
      rx = 322 + 10 * Math.sin(seg(tl, 0.7, 0.85) * Math.PI);
      rFace = tl < 0.85 ? 1 : -1;
      rPose = tl < 0.85 ? PO.flinch : V.breathe(PO.fists, tl, 1.5, 9);
      rExpr = 'angry';
    } else {
      rFace = -1;
      rx = kf(tl, [[Y0, 330], [Y1 + 0.05, 278]], ease.out);
      const dragK = Math.sin(seg(tl, Y0, Y1 + 0.35) * Math.PI);
      const shout = V.lerpPose(PO.shout, V.set(PO.shout, 'hF', [32, -112]), 0.5 + 0.5 * Math.sin(tl * 16));
      rPose = V.lerpPose(shout, PO.dragged, dragK);
      rExpr = 'shout';
    }
    const reactive = V.R({ x: rx, face: rFace, pose: rPose, expr: rExpr, mouth: 0.5 + 0.5 * Math.sin(tl * 22) });

    return {
      figs: [stranger, reactive, steady],
      shake: tl > Y0 && tl < Y0 + 0.2 ? 10 : 0,
      front(g) {
        if (tl >= T_LEASH) {
          const a = V.figPoint(stranger, 'hF');
          const b = V.figPoint(reactive, 'neck');
          const slack = yanking ? 0 : tl < Y0 ? 70 : 26;
          V.leash(g, a, b, slack, Math.min(1, (tl - T_LEASH) / 0.08), 40 * V.pop(tl - T_LEASH));
        }
        if (tl >= Y1) V.jagged(g, 410, 812, 172, 72, 'SAY THAT\nAGAIN?!', { size: 42, scale: V.pop(tl - Y1), seed: 8, shake: 10, rot: -0.03 });
      },
    };
  };

  // ─────────────────────────────── RULE II — PHONE: a feint is a question
  const ANGRY_MSGS = ['what??', 'what did I do', 'ANSWER ME', '????', 'fine. whatever.'];
  V.actions.phoneFeint = function (tl) {
    const typing = tl > 2.0;
    let rPose = V.breathe(PO.phone, tl, 1.2, 3.5);
    if (typing) {
      rPose = V.shift(rPose, 0, 0);
      rPose.hF = [rPose.hF[0] + Math.sin(tl * 60) * 1.6, rPose.hF[1] + Math.abs(Math.sin(tl * 45)) * 2];
      rPose.hB = [rPose.hB[0], rPose.hB[1] + Math.abs(Math.cos(tl * 52)) * 2];
      rPose.hd = [3, 1 + Math.sin(tl * 30) * 0.6];
    }
    const reactive = V.R({ pose: rPose, expr: typing ? (tl > 3.6 ? 'shout' : 'angry') : tl > 0.3 ? 'neutral' : 'neutral', mouth: 0.4 + 0.4 * Math.sin(tl * 18) });

    // Steady: reads it once → puts the phone face-down on the floor → stands calm, arms crossed. No answer.
    let sPose, sHasPhone = tl < 2.95;
    if (tl < 2.45) sPose = V.breathe(PO.phone, tl, 1.0, 3);
    else if (tl < 2.95) sPose = poseAt(tl, [[2.45, PO.phone], [2.85, PO.bend]]);
    else if (tl < 3.5) sPose = poseAt(tl, [[2.95, PO.bend], [3.45, PO.cross]]);
    else sPose = V.breathe(PO.cross, tl, 0.8, 2.2);
    const steady = V.St({ pose: sPose, expr: 'neutral', headTilt: tl > 2.05 && tl < 2.45 ? 0.1 : 0 });

    const phoneScreen = tl < 0.25 ? 'off' : 'on';
    return {
      figs: [reactive, steady],
      front(g) {
        // phones in hand
        const rh = V.figPoint(reactive, 'hF');
        V.phone(g, rh[0] + 4, rh[1] - 30, 0.18, 96, phoneScreen);
        if (sHasPhone) {
          const sh = V.figPoint(steady, 'hF');
          const ang = -0.18 - (tl > 2.45 ? seg(tl, 2.45, 2.85) * 1.2 : 0);
          V.phone(g, sh[0] - 4, sh[1] - 30 * (1 - seg(tl, 2.45, 2.85)), ang, 96, tl > 2.6 ? 'down' : phoneScreen);
        } else {
          // lying face-down on the floor
          g.save(); g.fillStyle = '#0d0e12'; g.strokeStyle = '#cfd2da'; g.lineWidth = 3;
          V.roundRect(g, 540, V.FLOOR - 16, 74, 14, 5); g.fill(); g.stroke(); g.restore();
        }
        // notification: pops in at 0.25, then splits into both phones at 1.75–2.0
        if (tl >= 0.25 && tl < 1.75) V.notification(g, 540, 800, 760, V.pop(tl - 0.25), 'MESSAGES', 'we need to talk');
        if (tl >= 1.75 && tl < 2.02) {
          const u = ease.in(seg(tl, 1.75, 2.02));
          const sh = V.figPoint(steady, 'hF');
          V.notification(g, V.lerp(540, rh[0], u), V.lerp(800, rh[1] - 30, u), 760, V.lerp(0.62, 0.08, u), 'MESSAGES', 'we need to talk');
          V.notification(g, V.lerp(540, sh[0], u), V.lerp(800, sh[1] - 30, u), 760, V.lerp(0.62, 0.08, u), 'MESSAGES', 'we need to talk');
        }
        // Reactive's angry replies stack up fast
        if (typing) {
          // one at a time, max 2 on screen, left edge pinned inside the safe box (x >= 150)
          const t0 = 2.05, gap = 0.75;
          const n = Math.min(ANGRY_MSGS.length, Math.floor((tl - t0) / gap) + 1);
          for (let i = Math.max(0, n - 2); i < n; i++) {
            const born = t0 + i * gap;
            const age = n - 1 - i; // 0 = newest
            const slide = age ? ease.out(seg(tl, t0 + (i + 1) * gap, t0 + (i + 1) * gap + 0.12)) : 0;
            const y = 810 - slide * 90;
            const m = V.measureBubble(g, ANGRY_MSGS[i], 42, `700 42px ${V.FONT.sans}`);
            V.bubble(g, { x: 156 + m.w / 2, y, text: ANGRY_MSGS[i], size: 42, font: `700 42px ${V.FONT.sans}`, fill: V.COL.red, color: '#fff', scale: V.pop(tl - born, 0.12) });
          }
        }
      },
    };
  };

  // ─────────────────────────────── RULE III — OFFICE: your reaction is their data
  const EMO = [['angry', 'fists', 0], ['fear', 'flinch', 0], ['shame', 'stand', 1]];
  V.actions.scannerData = function (tl) {
    const onR = tl < 3.0;
    const boss = V.X({ depth: 'back', x: 510, y: 1322, s: 0.74, tie: true, face: onR ? -1 : 1, expr: 'sneer',
      pose: V.lerpPose(PO.stand, V.set(V.set(PO.point, 'hF', [24, -100]), 'C', [2, -88]), seg(tl, 0, 0.25)) });

    // Reactive flashes emotions while being scanned
    const scanR = tl > 0.3 && tl < 2.75;
    const ei = scanR ? Math.floor((tl - 0.3) / 0.42) % 3 : 2;
    const [ex, ep, bl] = EMO[ei];
    const rBase = V.breathe(PO[ep], tl, 1.3, 7);
    const reactive = V.R({ pose: ex === 'shame' ? V.set(rBase, 'hd', [2, 4]) : rBase, expr: tl < 0.3 ? 'neutral' : ex,
      blush: bl ? 1 : tl > 2.75 ? 0.6 : 0, headTilt: ex === 'shame' ? 0.18 : 0 });
    const steady = V.St({ pose: V.breathe(PO.stand, tl, 1.1, 2.6), expr: 'neutral' });

    return {
      figs: [boss, reactive, steady],
      shake: tl > 4.35 && tl < 4.5 ? 6 : 0,
      front(g) {
        // scanner + laser
        const hand = V.figPoint(boss, 'hF');
        const target = onR ? reactive : steady;
        const th = headPt(target);
        const ang = Math.atan2(th[1] - hand[1], th[0] - hand[0]);
        const tip = [hand[0] + Math.cos(ang) * 60, hand[1] + Math.sin(ang) * 60 - 5];
        const active = (tl > 0.3 && tl < 2.75) || (tl > 3.15 && tl < 4.4);
        if (active) {
          const sy = 900 + 380 * (0.5 + 0.5 * Math.sin(tl * 7));
          V.laser(g, tip, target.x, sy, 125);
        }
        V.scanner(g, hand, ang, 0.72);

        // readouts
        const tagsAll = ['ANGER', 'FEAR', 'SHAME'];
        const rs = { progress: seg(tl, 0.3, 2.6), tags: tagsAll.slice(0, tl > 1.7 ? 3 : tl > 1.1 ? 2 : tl > 0.6 ? 1 : 0) };
        if (tl >= 2.6) { rs.result = 'DATA'; rs.scale = V.pop(tl - 2.6); }
        V.readout(g, V.POS.reactive, 822, rs);
        const ss = { progress: 0.26 * seg(tl, 3.15, 4.3), label: tl > 3.15 ? 'READING…' : 'WAITING…', barColor: '#e8eaee', t: tl };
        if (tl >= 4.4) { ss.result = 'NODATA'; ss.glitch = 1 - seg(tl, 4.4, 5.4) * 0.7; ss.scale = V.pop(tl - 4.4); }
        else if (tl > 4.1) { ss.result = 'NODATA'; ss.glitch = 1; }
        V.readout(g, V.POS.steady, 822, ss);
      },
    };
  };

  // ─────────────────────────────── RULE IV — TABLE: silence is pressure
  // Fewer, bigger bubbles: 6 short lines that stack on Reactive until he's buried to the neck
  const TALK = ['listen', 'no but', 'you never', 'hear me out', 'my point is', 'blah blah'];
  const PILE = (() => {
    const r = V.rng(44);
    return TALK.map((_, j) => ({ x: 322 + (r() - 0.5) * 24, y: V.FLOOR - 44 - j * 80, rot: (r() - 0.5) * 0.14, fill: j % 2 ? '#F4F5F7' : '#DADCE2' }));
  })();
  V.actions.silenceTable = function (tl) {
    const handsUp = seg(tl, 4.25, 4.5);
    const oPose = V.lerpPose(V.breathe(PO.stand, tl, 1.2 + seg(tl, 1.3, 4) * 1.5, 9), PO.handsUp, ease.out(handsUp));
    const talkingO = tl > 2.3 && tl < 4.3;
    const opp = V.X({ depth: 'back', x: 510, y: 1336, s: 0.8, face: 1, pose: oPose,
      expr: tl < 1.2 ? 'neutral' : 'nervous', mouth: talkingO ? 0.5 + 0.5 * Math.sin(tl * 20) : tl > 4.4 ? 0.6 : 0 });

    const k = 0.5 + 0.5 * Math.sin(tl * 7.5);
    const reactive = V.R({ pose: V.lerpPose(PO.talkA, PO.talkB, k), expr: 'talk', mouth: 0.5 + 0.5 * Math.sin(tl * 24) });
    const steady = V.St({ pose: V.breathe(PO.cross, tl, 0.8, 2.2), expr: 'neutral' });

    return {
      figs: [opp, reactive, steady],
      mid(g) { V.drawTable(g); },
      front(g) {
        // talk bubbles fly out of Reactive's mouth and pile on top of him
        const mouth = V.figPoint(reactive, 'H');
        const t0 = 0.25, gap = 0.62;
        for (let j = 0; j < TALK.length; j++) {
          const born = t0 + j * gap; if (tl < born) break;
          const u = ease.inOut(seg(tl, born, born + 0.36));
          const s = PILE[j];
          const fnt = `700 40px ${V.FONT.sans}`;
          const m = V.measureBubble(g, TALK[j], 40, fnt);
          const sx = Math.max(s.x, 150 + m.w / 2 + 10);
          const x = V.lerp(Math.max(mouth[0] + 60, 150 + m.w / 2 + 10), sx, u);
          const y = V.lerp(mouth[1] - 60, s.y, u) - Math.sin(u * Math.PI) * 110;
          V.bubble(g, { x, y, text: TALK[j], size: 40, font: fnt, fill: s.fill, color: '#101116', stroke: '#16171c', rot: s.rot * u, scale: V.pop(tl - born, 0.12) });
        }
        // opponent sweats, fills the silence, gives in
        const oh = headPt(opp);
        if (tl > 1.2) V.sweat(g, oh[0], oh[1], tl, Math.min(1.6, 0.4 + (tl - 1.2) * 0.4), 12);
        const lines = [[2.3, 'so…'], [2.85, 'uh, I mean…'], [3.45, 'ok look…'], [4.45, 'OK. YOU WIN.']];
        let cur = null; for (const l of lines) if (tl >= l[0]) cur = l;
        if (cur) {
          const isWin = cur[1].startsWith('OK.');
          V.bubble(g, { x: 648, y: 846, text: cur[1], size: isWin ? 46 : 40, font: `700 ${isWin ? 46 : 40}px ${V.FONT.sans}`, fill: isWin ? '#FFFFFF' : '#C9CBD3', color: '#101116', tail: [oh[0] + 30, oh[1] - 40], scale: V.pop(tl - cur[0], 0.12) });
        }
      },
    };
  };

  // ─────────────────────────────── RING PAYOFF — stay unreadable
  V.actions.ringPayoff = function (tl) {
    const HIT = 1.85;
    const per = 0.3;
    // Reactive: wild emotional punches, then eats one clean shot and stumbles back
    let rPose, rExpr = 'shout';
    if (tl < 1.62) {
      const p = tl / per, k = p % 1, n = Math.floor(p);
      rPose = V.lerpPose(PO.fists, n % 2 ? PO.wild2 : PO.wild, Math.sin(k * Math.PI));
    } else if (tl < HIT) rPose = poseAt(tl, [[1.62, PO.fists], [HIT, PO.wild]]);
    else { rPose = poseAt(tl, [[HIT, PO.flinch], [HIT + 0.2, PO.stumble], [2.9, PO.stumble], [3.5, V.shift(PO.fists, -3, 2)]]); rExpr = 'dizzy'; }
    const rx = kf(tl, [[0, 300], [1.62, 372], [HIT, 380], [HIT + 0.45, 262], [3.5, 250]], ease.out);
    const reactive = V.R({ x: rx, pose: rPose, expr: rExpr, mouth: 0.6 + 0.4 * Math.sin(tl * 20), headTilt: tl > HIT ? -0.25 * Math.sin(seg(tl, HIT, 3.5) * Math.PI) : 0 });

    // Steady: slips each punch, then one clean straight
    let sPose;
    if (tl < 1.62) {
      const p = tl / per, k = p % 1, n = Math.floor(p);
      sPose = V.lerpPose(PO.guard, V.shift(PO.slip, n % 2 ? 3 : -2, 0), Math.sin(k * Math.PI) * 0.9);
    } else sPose = poseAt(tl, [[1.62, PO.guard], [1.72, PO.guard], [HIT, V.set(PO.lunge, 'hF', [40, -104])], [2.05, V.set(PO.lunge, 'hF', [40, -104])], [2.5, PO.guard]]);
    const sx = kf(tl, [[0, 668], [1.62, 655], [HIT, 606], [2.05, 606], [2.6, 650]], ease.inOut);
    const steady = V.St({ x: sx, pose: sPose, expr: 'neutral' });

    return {
      figs: [reactive, steady],
      shake: tl > HIT && tl < HIT + 0.22 ? 16 : 0,
      front(g) {
        if (tl < 1.62) {
          const p = tl / per, k = p % 1;
          if (k > 0.25 && k < 0.8) V.whoosh(g, 505, 935, 110, -0.9, 0.9, Math.sin(((k - 0.25) / 0.55) * Math.PI) * 0.9);
        }
        const h = headPt(reactive);
        V.impact(g, h[0] + 30, h[1], (tl - HIT) / 0.35);
        if (tl > 0.15 && tl < 1.6) {
          g.save(); g.font = `800 46px ${V.FONT.sans}`; g.fillStyle = '#ffffff'; g.textAlign = 'center';
          g.letterSpacing = '6px'; const i = Math.floor(tl / per);
          if (tl % per > 0.12) g.fillText('MISS', 560 + (i % 2 ? 30 : -10), 850 - (i % 3) * 10);
          g.restore();
        }
      },
    };
  };
})();
