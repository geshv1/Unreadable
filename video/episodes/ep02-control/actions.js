/* Scene actions for Ep. 2 "Different control." Each action: (tl, scene) -> {figs, back, mid, front, shake}.
   tl = seconds since the scene started. Reactive stays LEFT, Steady RIGHT, every scene. */
(function () {
  const V = window.V;
  const { kf, poseAt, POSES: PO, seg, ease } = V;
  const step = (t, keys) => { let v = keys[0][1]; for (const [k, x] of keys) if (t >= k) v = x; return v; };
  const headPt = (f) => V.figPoint(f, 'H');

  // ─────────────────────────────── RULE I — STREET: emotion is a leash
  V.actions.streetLeash = function (tl) {
    // stranger walks in from the right, bumps Steady (~0.85s) then Reactive (~1.67s), stops on the far left
    const sx = tl < 2.2 ? kf(tl, [[0, 1120], [2.2, 120]], ease.lin) : kf(tl, [[2.2, 120], [2.6, 40], [4.25, 40], [4.45, 14]], ease.out);
    const yank1 = seg(tl, 2.55, 2.75), yank2 = seg(tl, 4.25, 4.42);
    const yanking = (tl > 2.5 && tl < 2.95) || (tl > 4.2 && tl < 4.6);
    let sPose;
    if (tl < 2.2) sPose = V.walkPose(tl * 9);
    else {
      const hold = V.set(V.set(PO.stand, 'hF', [24, -128]), 'eF', [1, 0.3]);
      const pull = V.set(V.set(V.shift(PO.stand, -6, 0), 'hF', [6, -132]), 'eF', [1, 0.3]);
      sPose = yanking ? V.lerpPose(hold, pull, Math.sin(Math.min(1, tl < 3 ? yank1 : yank2) * Math.PI)) : V.breathe(hold, tl, 1.2, 3);
      sPose = V.lerpPose(V.walkPose(2.2 * 9), sPose, seg(tl, 2.2, 2.35));
    }
    const stranger = V.X({ x: sx, face: tl < 2.22 ? -1 : 1, pose: sPose, expr: tl > 1.6 ? 'sneer' : 'neutral' });

    // Steady: keeps walking right, calm; small jolt at the bump, one glance back
    const stX = kf(tl, [[0, 650], [6, 800]], ease.lin);
    const jolt = Math.sin(seg(tl, 0.8, 1.0) * Math.PI) * 4;
    const steady = V.St({ x: stX, face: 1, pose: V.shift(V.walkPose(tl * 6.5 + 1.5), -jolt, 0), expr: 'neutral',
      look: tl > 0.95 && tl < 1.55 ? -1 : 0, headTilt: tl > 0.95 && tl < 1.55 ? -0.12 : 0 });

    // Reactive: walking, gets bumped, turns, leash, dragged, shouting
    let rx, rPose, rFace = 1, rExpr = 'neutral';
    if (tl < 1.67) { rx = kf(tl, [[0, 270], [1.67, 322]], ease.lin); rPose = V.walkPose(tl * 7); }
    else if (tl < 2.55) {
      rx = 322 + 10 * Math.sin(seg(tl, 1.67, 1.85) * Math.PI);
      rFace = tl < 1.85 ? 1 : -1;
      rPose = tl < 1.85 ? PO.flinch : V.breathe(PO.fists, tl, 1.5, 9);
      rExpr = 'angry';
    } else {
      rFace = -1;
      rx = kf(tl, [[2.55, 330], [2.85, 286], [4.25, 286], [4.5, 266]], ease.out);
      const dragK = Math.max(Math.sin(seg(tl, 2.55, 3.05) * Math.PI), Math.sin(seg(tl, 4.25, 4.65) * Math.PI));
      const shout = V.lerpPose(PO.shout, V.set(PO.shout, 'hF', [32, -112]), 0.5 + 0.5 * Math.sin(tl * 16));
      rPose = V.lerpPose(shout, PO.dragged, dragK);
      rExpr = 'shout';
    }
    const reactive = V.R({ x: rx, face: rFace, pose: rPose, expr: rExpr, mouth: 0.5 + 0.5 * Math.sin(tl * 22) });

    return {
      figs: [stranger, reactive, steady],
      shake: (tl > 2.55 && tl < 2.75) || (tl > 4.25 && tl < 4.4) ? 8 : 0,
      front(g) {
        // leash appears (fast pop) at 2.15
        if (tl >= 2.15) {
          const a = V.figPoint(stranger, 'hF');
          const b = V.figPoint(reactive, 'neck');
          const slack = yanking ? 0 : tl < 2.55 ? 70 : 26;
          V.leash(g, a, b, slack, Math.min(1, (tl - 2.15) / 0.1), 40 * V.pop(tl - 2.15));
        }
        const h = headPt(reactive);
        if (tl > 1.7 && tl < 2.6) V.jagged(g, h[0] + 40, 830, 120, 50, 'HEY!', { size: 46, scale: V.pop(tl - 1.7), seed: 3 });
        if (tl >= 2.75) {
          const txt = tl < 4.4 ? 'SAY THAT\nAGAIN?!' : 'YOU WANNA\nGO?!';
          V.jagged(g, 360, 812, 196, 72, txt, { size: 42, scale: V.pop(tl < 4.4 ? tl - 2.75 : tl - 4.4), seed: 8, shake: 10, rot: -0.03 });
        }
      },
    };
  };

  // ─────────────────────────────── RULE II — PHONE: a feint is a question
  const ANGRY_MSGS = ['what??', 'talk about WHAT', 'seriously?!', 'here we go again', "i didn't do anything", 'ANSWER ME', '????', 'wow. ok.', 'fine. whatever.'];
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

    // Steady: reads → face-down on the floor → shadowboxing
    let sPose, sHasPhone = tl < 2.95;
    const guardB = V.breathe(PO.guard, tl, 1.5, 6);
    if (tl < 2.45) sPose = V.breathe(PO.phone, tl, 1.0, 3);
    else if (tl < 2.95) sPose = poseAt(tl, [[2.45, PO.phone], [2.85, PO.bend]]);
    else if (tl < 3.4) sPose = poseAt(tl, [[2.95, PO.bend], [3.35, PO.guard]]);
    else {
      const p = (tl - 3.4) / 0.5, k = p % 1, n = Math.floor(p);
      const amt = k < 0.36 ? Math.sin((k / 0.36) * Math.PI) : 0;
      sPose = V.lerpPose(guardB, n % 2 ? PO.cross2 : PO.jab, amt);
      sPose = V.shift(sPose, Math.sin(tl * 7) * 1.5, 0, true);
    }
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
        if (tl >= 0.25 && tl < 1.75) V.notification(g, 525, 812, 740, V.pop(tl - 0.25), 'MESSAGES', 'we need to talk');
        if (tl >= 1.75 && tl < 2.02) {
          const u = ease.in(seg(tl, 1.75, 2.02));
          const sh = V.figPoint(steady, 'hF');
          V.notification(g, V.lerp(525, rh[0], u), V.lerp(812, rh[1] - 30, u), 740, V.lerp(0.62, 0.08, u), 'MESSAGES', 'we need to talk');
          V.notification(g, V.lerp(525, sh[0], u), V.lerp(812, sh[1] - 30, u), 740, V.lerp(0.62, 0.08, u), 'MESSAGES', 'we need to talk');
        }
        // Reactive's angry replies stack up fast
        if (typing) {
          const t0 = 2.05, gap = 0.36;
          const n = Math.min(ANGRY_MSGS.length, Math.floor((tl - t0) / gap) + 1);
          for (let i = 0; i < n; i++) {
            const born = t0 + i * gap;
            const age = n - 1 - i; // 0 = newest
            const slide = ease.out(seg(tl, born, born + 0.12));
            const y = 1130 - (age - 1 + slide) * 74 - 74;
            if (y < 770) continue;
            const m = V.measureBubble(g, ANGRY_MSGS[i], 30);
            V.bubble(g, { x: 28 + m.w / 2, y, text: ANGRY_MSGS[i], size: 30, fill: V.COL.red, color: '#fff', scale: V.pop(tl - born, 0.12) });
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
        V.readout(g, V.POS.reactive, 814, rs);
        const ss = { progress: 0.26 * seg(tl, 3.15, 4.3), label: tl > 3.15 ? 'READING…' : 'WAITING…', barColor: '#e8eaee', t: tl };
        if (tl >= 4.4) { ss.result = 'NODATA'; ss.glitch = 1 - seg(tl, 4.4, 5.4) * 0.7; ss.scale = V.pop(tl - 4.4); }
        else if (tl > 4.1) { ss.result = 'NODATA'; ss.glitch = 1; }
        V.readout(g, V.POS.steady, 814, ss);
      },
    };
  };

  // ─────────────────────────────── RULE IV — TABLE: silence is pressure
  const TALK = ['and another thing', 'listen', "I'm just saying", 'you never', 'blah blah', 'no but', 'hear me out', 'ok so', 'literally', 'anyway', 'LIKE', 'what I mean is', 'and ALSO', 'wait wait', 'my point is', 'just listen', 'seriously', 'blah'];
  const PILE = (() => {
    const r = V.rng(44), slots = [];
    for (let j = 0; j < TALK.length; j++) {
      const row = Math.floor(j / 2), col = j % 2;
      slots.push({ x: 320 + (col ? 78 : -78) + (r() - 0.5) * 40 + (row % 2 ? 20 : -20), y: V.FLOOR - 30 - row * 64, rot: (r() - 0.5) * 0.36, fill: r() > 0.5 ? '#F4F5F7' : '#D9DBE1' });
    }
    return slots;
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
        const t0 = 0.15, gap = 0.29;
        for (let j = 0; j < TALK.length; j++) {
          const born = t0 + j * gap; if (tl < born) break;
          const u = ease.inOut(seg(tl, born, born + 0.34));
          const s = PILE[j];
          const x = V.lerp(mouth[0] + 60, s.x, u);
          const y = V.lerp(mouth[1] - 40, s.y, u) - Math.sin(u * Math.PI) * 140;
          V.bubble(g, { x, y, text: TALK[j], size: 25, fill: s.fill, color: '#101116', stroke: '#16171c', rot: s.rot * u, scale: V.pop(tl - born, 0.12) });
        }
        // opponent sweats, fills the silence, gives in
        const oh = headPt(opp);
        if (tl > 1.2) V.sweat(g, oh[0], oh[1], tl, Math.min(1.6, 0.4 + (tl - 1.2) * 0.4), 12);
        const lines = [[2.3, 'so…'], [2.85, 'uh, I mean…'], [3.45, 'ok look…'], [4.45, 'OK. YOU WIN.']];
        let cur = null; for (const l of lines) if (tl >= l[0]) cur = l;
        if (cur) {
          const isWin = cur[1].startsWith('OK.');
          V.bubble(g, { x: 640, y: 846, text: cur[1], size: isWin ? 36 : 30, fill: isWin ? '#FFFFFF' : '#C9CBD3', color: '#101116', tail: [oh[0] + 30, oh[1] - 40], scale: V.pop(tl - cur[0], 0.12) });
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
          g.save(); g.font = `800 34px ${V.FONT.sans}`; g.fillStyle = 'rgba(255,255,255,0.85)'; g.textAlign = 'center';
          g.letterSpacing = '6px'; const i = Math.floor(tl / per);
          if (tl % per > 0.12) g.fillText('MISS', 560 + (i % 2 ? 30 : -10), 850 - (i % 3) * 10);
          g.restore();
        }
      },
    };
  };
})();
