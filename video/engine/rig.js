/* Character rig — same capsule-limbed fighters as fighters.svg (geometry, palettes, cap, hair),
   rebuilt as an IK rig so scenes can pose them. Rig units: feet at y=0, cap top ≈ -125, facing +x. */
(function () {
  const V = window.V;
  const { add, sub, mul, len, rot, clamp } = V;
  const OL = '#16171c';

  // Palettes copied from fighters.svg: [base, shade, highlight]
  V.PAL = {
    reactive: {
      arm: ['#a3a6ae', '#6c6f77', '#cfd1d7'], leg: ['#6f727a', '#4a4c53', '#9a9da5'], torso: ['#8d9099', '#5d6068', '#b9bcc4'],
      fist: '#eceef1', foot: '#f4f5f7', head: '#f3f4f6', ol: OL, extra: 'cap', hoodie: true,
    },
    steady: {
      arm: ['#e6e8ec', '#aeb1b9', '#ffffff'], leg: ['#a7aab2', '#73767e', '#d3d5da'], torso: ['#eef0f3', '#b9bcc4', '#ffffff'],
      fist: '#f4f5f7', foot: '#f4f5f7', head: '#f3f4f6', ol: OL, extra: 'hair',
    },
    // the "third figure": dark grey, no spotlight
    // Steady's circle: same charcoal family, a soft light rim so they read as allies
    ally: {
      arm: ['#30303a', '#24242c', '#44444f'], leg: ['#30303a', '#24242c', '#44444f'], torso: ['#30303a', '#24242c', '#44444f'],
      fist: '#30303a', foot: '#30303a', head: '#30303a', ol: '#b9bcc6', olW: 1.5, extra: null, flat: true, ink: '#e8eaee',
    },
    // background crowd: low contrast so the two leads always carry the frame
    crowd: {
      arm: ['#1f1f26', '#18181e', '#2a2a33'], leg: ['#1f1f26', '#18181e', '#2a2a33'], torso: ['#1f1f26', '#18181e', '#2a2a33'],
      fist: '#1f1f26', foot: '#1f1f26', head: '#1f1f26', ol: '#5f626d', olW: 1.3, extra: null, flat: true, ink: '#9a9da7',
    },
    // pure silhouette (foreground, close to the lens)
    shadow: {
      arm: ['#040406', '#040406', '#040406'], leg: ['#040406', '#040406', '#040406'], torso: ['#040406', '#040406', '#040406'],
      fist: '#040406', foot: '#040406', head: '#040406', ol: '#040406', olW: 1, extra: null, flat: true, ink: '#040406',
    },
    // charcoal body + thin light-grey outline so it never blends with Reactive's grey hoodie
    other: {
      arm: ['#2A2A33', '#1f1f26', '#3a3a46'], leg: ['#2A2A33', '#1f1f26', '#3a3a46'], torso: ['#2A2A33', '#1f1f26', '#3a3a46'],
      fist: '#2A2A33', foot: '#2A2A33', head: '#2A2A33', ol: '#b9bcc6', olW: 1.6, extra: null, flat: true, ink: '#d6d8de',
    },
  };

  // ---- Poses (local units, facing right). C = chest top, P = pelvis, hB/hF = back/front fist,
  //      fB/fF = back/front ankle, hd = head offset. eB/eF/kB/kF = preferred bend directions.
  const P = (o) => Object.assign({ hd: [0, 0] }, o);
  V.POSES = {
    guard: P({ C: [-3, -88], P: [-5, -55], hB: [6, -94], hF: [18, -98], fB: [-19, -5], fF: [12, -5] }),
    stand: P({ C: [0, -89], P: [-1, -56], hB: [-6, -48], hF: [9, -48], fB: [-8, -5], fF: [8, -5], eB: [-0.6, 1], eF: [0.3, 1] }),
    phone: P({ C: [1, -88], P: [-1, -55], hB: [14, -66], hF: [17, -70], fB: [-8, -5], fF: [8, -5], hd: [2, 3], eB: [-0.2, 1], eF: [-0.2, 1] }),
    shout: P({ C: [6, -87], P: [-1, -55], hB: [-18, -64], hF: [34, -104], fB: [-17, -5], fF: [15, -5], hd: [3, -1] }),
    dragged: P({ C: [14, -82], P: [1, -53], hB: [30, -78], hF: [36, -92], fB: [-22, -6], fF: [6, -5], hd: [4, 2] }),
    handsUp: P({ C: [-3, -89], P: [-2, -55], hB: [-14, -124], hF: [12, -126], fB: [-8, -5], fF: [8, -5], eB: [-1, 0.4], eF: [1, 0.4] }),
    cross: P({ C: [0, -89], P: [-1, -56], hB: [13, -72], hF: [-3, -71], fB: [-9, -5], fF: [8, -5], eB: [0.4, 1], eF: [1, 0.7], armsFront: true }),
    point: P({ C: [1, -88], P: [-2, -55], hB: [-6, -50], hF: [44, -94], fB: [-9, -5], fF: [9, -5], eB: [-0.5, 1] }),
    jab: P({ C: [3, -87], P: [-4, -55], hB: [8, -95], hF: [46, -98], fB: [-20, -5], fF: [14, -5] }),
    cross2: P({ C: [6, -86], P: [-3, -55], hB: [44, -96], hF: [16, -96], fB: [-20, -5], fF: [14, -5] }),
    slip: P({ C: [6, -76], P: [-6, -50], hB: [10, -84], hF: [20, -86], fB: [-20, -5], fF: [13, -5], hd: [2, 4] }),
    lunge: P({ C: [10, -84], P: [0, -53], hB: [14, -92], hF: [52, -100], fB: [-22, -5], fF: [22, -5] }),
    stumble: P({ C: [-14, -83], P: [-6, -53], hB: [-32, -96], hF: [-4, -114], fB: [-24, -5], fF: [6, -5], hd: [-4, -2], eB: [-1, 0.2], eF: [0, 1] }),
    wild: P({ C: [8, -86], P: [-2, -55], hB: [-24, -104], hF: [40, -112], fB: [-18, -5], fF: [16, -5], eB: [-0.5, 1] }),
    wild2: P({ C: [10, -85], P: [-2, -55], hB: [42, -88], hF: [-12, -112], fB: [-18, -5], fF: [16, -5], eF: [-0.5, -1] }),
    bend: P({ C: [16, -72], P: [-4, -52], hB: [12, -62], hF: [30, -6], fB: [-12, -5], fF: [10, -5], hd: [3, 3], eF: [1, 0] }),
    talkA: P({ C: [2, -88], P: [-1, -55], hB: [-4, -60], hF: [30, -84], fB: [-8, -5], fF: [8, -5], eB: [-0.6, 1] }),
    talkB: P({ C: [3, -88], P: [-1, -55], hB: [20, -80], hF: [28, -100], fB: [-8, -5], fF: [8, -5] }),
    flinch: P({ C: [-6, -87], P: [-3, -55], hB: [8, -96], hF: [14, -104], fB: [-10, -5], fF: [7, -5], hd: [-3, 1] }),
    fists: P({ C: [3, -88], P: [-1, -55], hB: [6, -64], hF: [16, -66], fB: [-10, -5], fF: [9, -5] }),
    // Pt. 3 additions
    slump: P({ C: [5, -86], P: [-1, -55], hB: [-2, -46], hF: [8, -46], fB: [-8, -5], fF: [8, -5], hd: [3, 5], eB: [-0.4, 1], eF: [0.2, 1] }),
    armsUp: P({ C: [-1, -91], P: [-1, -56], hB: [-8, -130], hF: [6, -131], fB: [-8, -5], fF: [8, -5], hd: [-1, -1], eB: [-1, 0.2], eF: [1, 0.2] }),
    sit: P({ C: [4, -50], P: [-4, -18], hB: [22, -30], hF: [26, -32], fB: [24, -5], fF: [32, -5], hd: [3, 3], kB: [0.2, -1], kF: [0.2, -1], eB: [0, 1], eF: [0, 1] }),
    squat: P({ C: [8, -68], P: [-8, -38], hB: [36, -74], hF: [42, -76], fB: [-10, -5], fF: [10, -5], hd: [2, 0], eB: [0, 1], eF: [0, 1] }),
    rope: P({ C: [0, -89], P: [-1, -56], hB: [-16, -60], hF: [17, -60], fB: [-6, -5], fF: [6, -5], eB: [-1, 0.6], eF: [1, 0.6] }),
    pickLow: P({ C: [16, -74], P: [-4, -52], hB: [10, -62], hF: [34, -14], fB: [-12, -5], fF: [12, -5], hd: [3, 3], eF: [1, 0] }),
    place: P({ C: [6, -88], P: [-2, -55], hB: [0, -60], hF: [40, -80], fB: [-10, -5], fF: [10, -5], eB: [-0.5, 1], eF: [0, 1] }),
    flex: P({ C: [0, -90], P: [-1, -56], hB: [-20, -112], hF: [20, -112], fB: [-12, -5], fF: [12, -5], eB: [-1, 0.3], eF: [1, 0.3] }),
    // Pt. 4 v2 additions (variety)
    kneel: P({ C: [10, -64], P: [-6, -30], hB: [10, -36], hF: [24, -12], fB: [-30, -4], fF: [16, -5], hd: [4, 6], kB: [0, 1], kF: [1, -0.4], eF: [0.4, 1] }),
    facepalm: P({ C: [5, -86], P: [-1, -55], hB: [-4, -52], hF: [14, -108], fB: [-9, -5], fF: [9, -5], hd: [3, 3], eF: [1, 1] }),
    bow: P({ C: [12, -80], P: [-2, -54], hB: [-2, -50], hF: [8, -50], fB: [-8, -5], fF: [8, -5], hd: [4, 4], eB: [-0.4, 1], eF: [0.2, 1] }),
    clap: P({ C: [2, -88], P: [-1, -55], hB: [22, -84], hF: [24, -86], fB: [-8, -5], fF: [8, -5], eB: [0, 1], eF: [0, 1] }),
    clapOpen: P({ C: [2, -88], P: [-1, -55], hB: [12, -82], hF: [32, -88], fB: [-8, -5], fF: [8, -5], eB: [0, 1], eF: [0, 1] }),
    curlDown: P({ C: [0, -89], P: [-1, -56], hB: [-6, -48], hF: [14, -50], fB: [-9, -5], fF: [9, -5], eF: [-0.6, 1] }),
    curlUp: P({ C: [0, -89], P: [-1, -56], hB: [-6, -48], hF: [14, -88], fB: [-9, -5], fF: [9, -5], eF: [0, 1] }),
    selfie: P({ C: [-2, -89], P: [-1, -56], hB: [-10, -62], hF: [36, -118], fB: [-10, -5], fF: [10, -5], hd: [-2, -2], eF: [1, 0.4] }),
    kissMedal: P({ C: [2, -89], P: [-1, -56], hB: [-10, -62], hF: [16, -104], fB: [-9, -5], fF: [9, -5], hd: [2, 1], eF: [0.6, 1] }),
    throwBack: P({ C: [-6, -88], P: [-2, -55], hB: [14, -70], hF: [-30, -112], fB: [-16, -5], fF: [14, -5], eF: [-1, 0] }),
    throwFwd: P({ C: [12, -84], P: [0, -54], hB: [-14, -66], hF: [46, -66], fB: [-18, -5], fF: [18, -5], hd: [4, 2] }),
    // Pt. 7 (focus) additions
    read: P({ C: [2, -88], P: [-1, -55], hB: [18, -72], hF: [24, -74], fB: [-9, -5], fF: [9, -5], hd: [3, 5], eB: [-0.2, 1], eF: [-0.2, 1] }),
    lever: P({ C: [6, -88], P: [-1, -55], hB: [-4, -56], hF: [24, -104], fB: [-10, -5], fF: [10, -5], eF: [0, 1] }),
    leverDown: P({ C: [10, -84], P: [-1, -55], hB: [-4, -56], hF: [26, -72], fB: [-10, -5], fF: [10, -5], hd: [2, 2], eF: [0, 1] }),
    lieScroll: P({ C: [0, -89], P: [0, -56], hB: [14, -92], hF: [22, -100], fB: [-4, -5], fF: [4, -5], eB: [0, 1], eF: [0, 1] }),
    drink: P({ C: [-2, -89], P: [-1, -56], hB: [-6, -50], hF: [12, -106], fB: [-9, -5], fF: [9, -5], hd: [-3, -3], eF: [0.4, 1] }),
    wave: P({ C: [0, -89], P: [-1, -56], hB: [8, -94], hF: [-18, -124], fB: [-12, -5], fF: [12, -5], hd: [-2, -2], eF: [-1, 0.3] }),
    // Pt. 6 (failure) additions
    knock: P({ C: [4, -88], P: [-1, -55], hB: [-4, -56], hF: [34, -98], fB: [-9, -5], fF: [9, -5], eF: [0, 1] }),
    allFours: P({ C: [20, -40], P: [-8, -30], hB: [34, -5], hF: [28, -5], fB: [-34, -4], fF: [-28, -4], hd: [8, 6], kB: [0, 1], kF: [0, 1], eB: [-0.3, 1], eF: [-0.3, 1] }),
    leap: P({ C: [8, -90], P: [0, -60], hB: [-14, -96], hF: [30, -100], fB: [-26, -30], fF: [22, -36], kF: [1, -0.2], kB: [-0.2, 1] }),
    kick: P({ C: [-4, -90], P: [-3, -57], hB: [-22, -80], hF: [16, -80], fB: [-8, -5], fF: [40, -46], kF: [1, -0.5] }),
    push: P({ C: [14, -82], P: [-2, -54], hB: [34, -80], hF: [38, -84], fB: [-24, -5], fF: [10, -5], hd: [3, 2], eB: [0, 1], eF: [0, 1] }),
    hammerUp: P({ C: [-2, -90], P: [-1, -56], hB: [-6, -54], hF: [6, -128], fB: [-12, -5], fF: [12, -5], eF: [-1, 0.2] }),
    hammerDown: P({ C: [12, -84], P: [-2, -55], hB: [-6, -54], hF: [44, -64], fB: [-12, -5], fF: [12, -5], hd: [3, 3], eF: [0, 1] }),
    offerHand: P({ C: [12, -84], P: [-1, -55], hB: [-4, -56], hF: [40, -62], fB: [-10, -5], fF: [12, -5], hd: [3, 3], eF: [0, 1] }),
    dust: P({ C: [6, -86], P: [-1, -55], hB: [8, -58], hF: [14, -56], fB: [-9, -5], fF: [9, -5], hd: [3, 4], eB: [0, 1], eF: [0, 1] }),
    // Pt. 6 additions
    type: P({ C: [6, -88], P: [-1, -55], hB: [30, -58], hF: [36, -60], fB: [-9, -5], fF: [9, -5], hd: [3, 4], eB: [0, 1], eF: [0, 1] }),
    sip: P({ C: [1, -89], P: [-1, -56], hB: [-6, -50], hF: [14, -104], fB: [-9, -5], fF: [9, -5], eF: [0.4, 1] }),
    lie: P({ C: [0, -89], P: [0, -56], hB: [-4, -50], hF: [4, -50], fB: [-4, -5], fF: [4, -5], eB: [-0.3, 1], eF: [0.3, 1] }),
    inhale: P({ C: [-1, -93], P: [-1, -56], hB: [-9, -50], hF: [8, -52], fB: [-8, -5], fF: [8, -5], hd: [-1, -3], eB: [-0.6, 1], eF: [0.3, 1] }),
    // Pt. 5 additions
    climbA: P({ C: [6, -88], P: [-1, -55], hB: [16, -96], hF: [18, -120], fB: [6, -10], fF: [10, -36], hd: [1, -2], eB: [-0.2, 1], eF: [-0.2, 1], kF: [1, 0] }),
    climbB: P({ C: [6, -88], P: [-1, -55], hB: [18, -120], hF: [16, -96], fB: [10, -36], fF: [6, -10], hd: [1, -2], eB: [-0.2, 1], eF: [-0.2, 1], kB: [1, 0] }),
    boost: P({ C: [14, -72], P: [-6, -48], hB: [26, -40], hF: [30, -42], fB: [-14, -5], fF: [14, -5], hd: [3, -4], eB: [0, 1], eF: [0, 1] }),
    reachUp: P({ C: [6, -88], P: [-1, -55], hB: [0, -60], hF: [30, -128], fB: [-10, -5], fF: [12, -5], hd: [2, -4], eF: [1, 0.2] }),
    stool: P({ C: [4, -84], P: [-4, -50], hB: [14, -56], hF: [20, -58], fB: [16, -5], fF: [24, -5], kB: [1, -0.2], kF: [1, -0.2], eB: [0, 1], eF: [0, 1] }),
    stoolSlump: P({ C: [10, -78], P: [-4, -50], hB: [22, -52], hF: [26, -54], fB: [16, -5], fF: [24, -5], hd: [4, 6], kB: [1, -0.2], kF: [1, -0.2], eB: [0, 1], eF: [0, 1] }),
    shoulder: P({ C: [4, -88], P: [-1, -55], hB: [-4, -58], hF: [36, -92], fB: [-9, -5], fF: [9, -5], eF: [0, 1] }),
    scroll: P({ C: [3, -86], P: [-1, -55], hB: [12, -70], hF: [15, -74], fB: [-8, -5], fF: [8, -5], hd: [3, 5], eB: [-0.2, 1], eF: [-0.2, 1] }),
    glove: P({ C: [4, -88], P: [-2, -55], hB: [6, -94], hF: [40, -84], fB: [-12, -5], fF: [12, -5], eF: [0, 1] }),
    // Pt. 4 additions
    sitHigh: P({ C: [8, -64], P: [-4, -34], hB: [16, -82], hF: [20, -84], fB: [22, -5], fF: [28, -5], hd: [4, 6], kB: [0.4, -1], kF: [0.4, -1], eB: [0.2, 1], eF: [0.2, 1] }),
    stepUp: P({ C: [4, -89], P: [0, -56], hB: [-10, -58], hF: [14, -62], fB: [-8, -5], fF: [16, -22], eB: [-0.6, 1] }),
    cheer: P({ C: [-2, -91], P: [-1, -56], hB: [-16, -128], hF: [16, -130], fB: [-11, -5], fF: [11, -5], hd: [-1, -2], eB: [-1, 0.3], eF: [1, 0.3] }),
    tired: P({ C: [8, -82], P: [-2, -53], hB: [8, -60], hF: [18, -62], fB: [-16, -5], fF: [14, -5], hd: [4, 5] }),
  };

  V.lerpPose = function (a, b, t) {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const x = a[k] !== undefined ? a[k] : b[k], y = b[k] !== undefined ? b[k] : a[k];
      o[k] = Array.isArray(x) ? x.map((v, i) => V.lerp(v, y[i], t)) : t < 0.5 ? x : y;
    }
    return o;
  };
  // keys = [[t, poseOrName], ...]
  V.poseAt = function (t, keys, ease = V.ease.inOut) {
    const get = (p) => (typeof p === 'string' ? V.POSES[p] : p);
    if (t <= keys[0][0]) return get(keys[0][1]);
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const k = ease((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0] || 1));
        return V.lerpPose(get(keys[i - 1][1]), get(keys[i][1]), k);
      }
    }
    return get(keys[keys.length - 1][1]);
  };
  // Offset whole upper body (breathing / bounce), feet stay planted
  V.shift = function (p, dx, dy, feetToo = false) {
    const o = Object.assign({}, p);
    for (const k of ['C', 'P', 'hB', 'hF']) o[k] = [p[k][0] + dx, p[k][1] + dy];
    if (feetToo) for (const k of ['fB', 'fF']) o[k] = [p[k][0] + dx, p[k][1] + dy];
    return o;
  };
  V.breathe = (p, t, amp = 1.6, speed = 3.4, phase = 0) => V.shift(p, 0, -amp * (0.5 + 0.5 * Math.sin(t * speed + phase)));
  V.set = (p, k, v) => Object.assign({}, p, { [k]: v });

  // Walk cycle built on the stand pose
  V.walkPose = function (phase, base = V.POSES.stand, stride = 11) {
    const s = Math.sin(phase), c = Math.cos(phase);
    const p = V.shift(base, 0, -1.4 * Math.abs(c) + 0.7);
    p.fF = [base.fF[0] - 2 + stride * s, -5 - 6 * Math.max(0, c)];
    p.fB = [base.fB[0] + 2 - stride * s, -5 - 6 * Math.max(0, -c)];
    p.hF = [base.hF[0] - 2 - 9 * s, base.hF[1] - 0.5];
    p.hB = [base.hB[0] + 2 + 9 * s, base.hB[1] - 0.5];
    return p;
  };

  // ---- IK
  function ik(A, T, l1, l2, pref) {
    let d = sub(T, A); let dist = len(d) || 0.001;
    const u = mul(d, 1 / dist);
    const dc = clamp(dist, Math.abs(l1 - l2) + 0.5, l1 + l2 - 0.05);
    const Tc = add(A, mul(u, dc));
    const a = (l1 * l1 - l2 * l2 + dc * dc) / (2 * dc);
    const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    const base = add(A, mul(u, a));
    const n = [-u[1], u[0]];
    const m1 = add(base, mul(n, h)), m2 = add(base, mul(n, -h));
    const pick = (m1[0] - base[0]) * pref[0] + (m1[1] - base[1]) * pref[1] >= 0 ? m1 : m2;
    return [pick, Tc];
  }

  const TORSO0 = Math.atan2(-33, 2);
  V.geom = function (p) {
    const C = p.C, Pp = p.P;
    const a = Math.atan2(C[1] - Pp[1], C[0] - Pp[0]) - TORSO0;
    const g = { a, C, P: Pp };
    g.sB = add(C, rot([-3, 2], a)); g.sF = add(C, rot([7, 2], a));
    g.hipB = add(Pp, rot([-3, 5], a)); g.hipF = add(Pp, rot([8, 5], a));
    g.H = add(add(C, rot([5, -20], a)), p.hd || [0, 0]);
    g.neck = add(C, rot([3, -7], a));
    [g.eB, g.hB] = ik(g.sB, p.hB, 20.5, 28, p.eB || [0.15, 1]);
    [g.eF, g.hF] = ik(g.sF, p.hF, 20.5, 28, p.eF || [0.15, 1]);
    [g.kB, g.fB] = ik(g.hipB, p.fB, 24, 22.7, p.kB || [1, 0.1]);
    [g.kF, g.fF] = ik(g.hipF, p.fF, 24, 22.7, p.kF || [1, 0.1]);
    return g;
  };

  // ---- drawing
  const LIGHT = [-0.83, -0.55];
  function line(g, a, b, col, w, alpha = 1) {
    g.globalAlpha = alpha; g.strokeStyle = col; g.lineWidth = w;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.globalAlpha = 1;
  }
  function capsule(g, a, b, w, pal, ol, olW = 3.2) {
    g.lineCap = 'round';
    line(g, a, b, ol, w + olW);
    line(g, a, b, pal[0], w);
    const d = sub(b, a), L = len(d) || 1, u = mul(d, 1 / L), n = [-u[1], u[0]];
    const k = clamp((n[0] * LIGHT[0] + n[1] * LIGHT[1]) * 2.5, -1, 1);
    const a2 = add(a, mul(u, L * 0.12)), b2 = sub(b, mul(u, L * 0.12));
    line(g, add(a2, mul(n, -k * w * 0.26)), add(b2, mul(n, -k * w * 0.26)), pal[1], w * 0.42, 0.55);
    line(g, add(a2, mul(n, k * w * 0.27)), add(b2, mul(n, k * w * 0.27)), pal[2], w * 0.3, 0.8);
  }
  function circle(g, c, r, fill, ol, lw = 1.6) {
    g.beginPath(); g.arc(c[0], c[1], r, 0, Math.PI * 2); g.fillStyle = fill; g.fill();
    if (ol) { g.strokeStyle = ol; g.lineWidth = lw; g.stroke(); }
  }
  function fist(g, c, pal) {
    circle(g, c, 5.7, pal.fist, pal.ol, pal.olW ? 0.8 : 1.6);
    if (!pal.flat) g.globalAlpha = 0.55; else g.globalAlpha = 0; circle(g, [c[0] - 1.7, c[1] - 1.8], 2.1, '#fff'); g.globalAlpha = 1;
  }
  function foot(g, c, pal) {
    const x = c[0] + 2.5, y = c[1] + 4;
    g.beginPath(); g.ellipse(x, y, 9.5, 4.8, 0, 0, Math.PI * 2); g.fillStyle = pal.foot; g.fill();
    g.strokeStyle = pal.ol; g.lineWidth = pal.olW ? 0.8 : 1.6; g.stroke();
    g.globalAlpha = pal.flat ? 0 : 0.9; g.beginPath(); g.ellipse(x - 2.5, y - 1.6, 4.5, 1.4, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.globalAlpha = 1;
  }
  function arm(g, s, e, h, pal) { capsule(g, s, e, 8.5, pal.arm, pal.ol, pal.olW); capsule(g, e, h, 8.5, pal.arm, pal.ol, pal.olW); fist(g, h, pal); }
  function leg(g, hip, k, f, pal) { capsule(g, hip, k, 12, pal.leg, pal.ol, pal.olW); capsule(g, k, f, 11.5, pal.leg, pal.ol, pal.olW); foot(g, f, pal); }

  function torso(g, G, f, pal) {
    capsule(g, G.C, G.P, 24, pal.torso, pal.ol, pal.olW);
    g.save(); g.translate(G.C[0], G.C[1]); g.rotate(G.a);
    if (pal.hoodie) {
      g.globalAlpha = 0.8; g.strokeStyle = '#5d6068'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(-11, 25); g.quadraticCurveTo(-2, 28, 8, 25); g.stroke();
      g.lineWidth = 1.1; g.beginPath(); g.moveTo(6, 2); g.lineTo(7, 12); g.stroke(); g.globalAlpha = 1;
    }
    if (f.tie) {
      g.fillStyle = '#b0202f'; g.strokeStyle = '#0b0b0f'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(4, 1); g.lineTo(7, 1); g.lineTo(7.5, 4); g.lineTo(8.5, 22); g.lineTo(5.5, 25); g.lineTo(3.5, 22); g.lineTo(4.5, 4); g.closePath(); g.fill(); g.stroke();
    }
    g.restore();
  }

  function head(g, G, f, pal) {
    const H = G.H;
    g.save(); g.translate(H[0], H[1]); g.rotate((f.headTilt || 0) + G.a * 0.5);
    if (f.headScale && f.headScale !== 1) { g.translate(0, -(f.headScale - 1) * 12); g.scale(f.headScale, f.headScale); }
    circle(g, [0, 0], 13.5, pal.head, pal.ol, pal.olW ? 0.8 : 1.6);
    if (!pal.flat) { g.globalAlpha = 0.55; circle(g, [-4, -4.3], 5.1, '#fff'); g.globalAlpha = 1; }
    if (f.blush) { // red flush over the whole face
      g.globalAlpha = 0.55 * f.blush; circle(g, [3, 2], 12.4, '#ff5a6a'); g.globalAlpha = 1;
    }
    if (pal.extra === 'cap') {
      g.lineJoin = 'round';
      g.beginPath(); g.moveTo(-14, -2); g.quadraticCurveTo(-13, -17, 0, -17); g.quadraticCurveTo(13, -17, 13.5, -2); g.closePath();
      g.fillStyle = '#d42a3c'; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.6; g.stroke();
      g.globalAlpha = 0.6; g.beginPath(); g.moveTo(-8, -13); g.quadraticCurveTo(0, -18, 8, -13); g.strokeStyle = '#f06a76'; g.lineWidth = 2; g.stroke(); g.globalAlpha = 1;
      g.beginPath(); g.moveTo(8, -3); g.quadraticCurveTo(20, -4.5, 26, -1); g.quadraticCurveTo(20, 1.5, 8, 0.5); g.closePath();
      g.fillStyle = '#c22233'; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.5; g.stroke();
    } else if (pal.extra === 'hair') {
      g.beginPath(); g.moveTo(-13.5, 2); g.quadraticCurveTo(-15, -8, -9, -13); g.lineTo(-4, -8); g.lineTo(-1, -15); g.lineTo(3, -9); g.lineTo(8, -14);
      g.quadraticCurveTo(12, -9, 12, -4); g.quadraticCurveTo(4, -10, -3, -4); g.quadraticCurveTo(-8, 0, -13.5, 2); g.closePath();
      g.fillStyle = '#17181d'; g.fill(); g.strokeStyle = OL; g.lineWidth = 1.2; g.lineJoin = 'round'; g.stroke();
    }
    face(g, f, pal.ink);
    g.restore();
  }

  // Simple expressive faces (drawn only when f.expr is set — default rig is faceless like the original)
  function face(g, f, inkCol) {
    const e = f.expr; if (!e) return;
    const ink = inkCol || '#101116';
    const lx = (f.look || 0) * 1.6;
    g.strokeStyle = ink; g.fillStyle = ink; g.lineCap = 'round'; g.lineJoin = 'round';
    const dot = (x, y, r = 1.7) => { g.beginPath(); g.arc(x + lx, y, r, 0, Math.PI * 2); g.fill(); };
    const ln = (pts, w = 1.5) => { g.lineWidth = w; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.stroke(); };
    const mouthOpen = (cx, cy, rx, ry) => { g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = '#3a0d14'; g.fill(); g.strokeStyle = ink; g.lineWidth = 1.2; g.stroke(); g.fillStyle = ink; };
    switch (e) {
      case 'neutral':
        dot(3.5, 2.5); dot(9.5, 2.5); ln([[4.5, 8], [10.5, 8]], 1.4); break;
      case 'glance':
        dot(3.5, 2.5); dot(9.5, 2.5); ln([[5, 8], [10, 8]], 1.3); break;
      case 'angry':
        ln([[1, -1.5], [5.5, 1]], 1.8); ln([[11.5, -1.5], [7.5, 1]], 1.8);
        dot(3.6, 3.2); dot(9.4, 3.2); ln([[4, 9.5], [7, 8], [11, 9.5]], 1.6); break;
      case 'shout': {
        ln([[1, -1.8], [5.8, 1]], 2); ln([[12, -1.8], [7.6, 1]], 2);
        dot(3.6, 3.2); dot(9.4, 3.2); mouthOpen(7.5, 9.2, 3.6, 2.4 + 1.6 * (f.mouth == null ? 1 : f.mouth)); break;
      }
      case 'talk':
        dot(3.6, 2.5); dot(9.4, 2.5); mouthOpen(7.5, 8.6, 3, 0.6 + 2.4 * (f.mouth || 0)); break;
      case 'fear':
        g.fillStyle = '#fff'; g.beginPath(); g.arc(3.4, 2.4, 2.7, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(9.6, 2.4, 2.7, 0, 7); g.fill(); g.stroke();
        g.fillStyle = ink; dot(3.6, 2.6, 1.1); dot(9.8, 2.6, 1.1);
        ln([[1.5, -2.5], [5, -3.8]], 1.3); ln([[8, -3.8], [11.5, -2.5]], 1.3);
        ln([[4, 9.4], [5.5, 8.4], [7, 9.4], [8.5, 8.4], [10, 9.4]], 1.3); break;
      case 'shame':
        ln([[1.8, 2.6], [5, 2]], 1.6); ln([[8, 2], [11.2, 2.6]], 1.6);
        ln([[4.5, 9], [6, 8.2], [7.5, 9], [9, 8.2], [10.5, 9]], 1.3); break;
      case 'sneer':
        ln([[1.5, 0], [5.5, 1.2]], 1.7); ln([[8, -2], [12, -0.8]], 1.6);
        dot(3.6, 3); dot(9.4, 3); ln([[3.5, 9.5], [8, 9], [11.5, 6.8]], 1.6); break;
      case 'nervous':
        g.fillStyle = '#fff'; g.beginPath(); g.arc(3.4, 2.6, 2.4, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(9.6, 2.6, 2.4, 0, 7); g.fill(); g.stroke();
        g.fillStyle = ink; dot(3.6, 2.8, 1); dot(9.8, 2.8, 1);
        ln([[1.5, -1.5], [5, -2.8]], 1.3); ln([[8, -2.8], [11.5, -1.5]], 1.3);
        if (f.mouth) mouthOpen(7.5, 9, 2.2, 0.6 + 1.8 * f.mouth); else ln([[4, 9.2], [5.5, 8.4], [7, 9.2], [8.5, 8.4], [10, 9.2]], 1.3);
        break;
      case 'proud': // smug half-lids + smirk
        ln([[1.6, 1.8], [5.4, 1.4]], 1.6); ln([[7.6, 1.4], [11.4, 1.8]], 1.6); dot(3.6, 3.1, 1.3); dot(9.4, 3.1, 1.3);
        ln([[4.5, 8.6], [8, 9.4], [11.3, 7.2]], 1.6); break;
      case 'tearful': // sad brows, wobbly mouth, a tear
        ln([[1.5, 0.2], [5.2, -1.2]], 1.4); ln([[7.8, -1.2], [11.5, 0.2]], 1.4); dot(3.6, 2.8); dot(9.4, 2.8);
        g.beginPath(); g.moveTo(4.5, 10); g.quadraticCurveTo(7.5, 7.6, 10.5, 10); g.stroke();
        g.fillStyle = '#7fc8ff'; g.beginPath(); g.moveTo(9.6, 4.4); g.quadraticCurveTo(11.4, 7.4, 9.6, 8.2); g.quadraticCurveTo(7.8, 7.4, 9.6, 4.4); g.fill(); g.fillStyle = ink; break;
      case 'shock':
        g.fillStyle = '#fff'; g.beginPath(); g.arc(3.4, 2.2, 2.9, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.arc(9.6, 2.2, 2.9, 0, 7); g.fill(); g.stroke();
        g.fillStyle = ink; dot(3.4, 2.2, 1.0); dot(9.6, 2.2, 1.0); ln([[1.2, -2.6], [5, -3.4]], 1.3); ln([[8, -3.4], [11.8, -2.6]], 1.3);
        mouthOpen(7.5, 9.4, 1.8, 2.2); break;
      case 'focus': // determined: low flat brows, steady eyes, set mouth
        ln([[1.2, 0.6], [5.6, 1.2]], 1.9); ln([[7.4, 1.2], [11.8, 0.6]], 1.9); dot(3.6, 3); dot(9.4, 3); ln([[5, 8.4], [10, 8.4]], 1.6); break;
      case 'jealous': // narrowed side-eye
        ln([[1.6, 2], [5.4, 2.6]], 1.7); ln([[7.6, 2.6], [11.4, 2]], 1.7); dot(5.0, 3.4, 1.3); dot(10.8, 3.4, 1.3);
        ln([[4.6, 9.2], [7.5, 8.4], [10.6, 9.6]], 1.4); break;
      case 'smile':
        dot(3.6, 2.8); dot(9.4, 2.8); g.lineWidth = 1.5; g.beginPath(); g.moveTo(4.6, 7.8); g.quadraticCurveTo(7.5, 10.4, 10.4, 7.8); g.stroke(); break;
      case 'laugh': // ^^ eyes, open grin
        ln([[2, 3.4], [3.6, 1.8], [5.2, 3.4]], 1.5); ln([[7.8, 3.4], [9.4, 1.8], [11, 3.4]], 1.5);
        g.beginPath(); g.moveTo(4, 7.4); g.quadraticCurveTo(7.5, 13, 11, 7.4); g.closePath(); g.fillStyle = '#3a0d14'; g.fill(); g.lineWidth = 1.3; g.stroke(); g.fillStyle = ink; break;
      case 'sleepy':
        ln([[1.8, 3], [5.2, 3.6]], 1.6); ln([[7.8, 3.6], [11.2, 3]], 1.6); ln([[5.5, 9], [9.5, 9]], 1.3); break;
      case 'grin':
        dot(3.6, 2.6); dot(9.4, 2.6); g.lineWidth = 1.6; g.beginPath(); g.moveTo(3.5, 7.5); g.quadraticCurveTo(7.5, 12, 11.5, 7.5); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.fillStyle = ink; break;
      case 'strain':
        ln([[1.5, 1], [5.5, 2.8], [1.8, 4]], 1.5); ln([[11.5, 1], [7.5, 2.8], [11.2, 4]], 1.5);
        g.fillStyle = '#fff'; g.fillRect(4, 7.4, 7, 3); g.strokeRect(4, 7.4, 7, 3); ln([[7.5, 7.4], [7.5, 10.4]], 0.8); g.fillStyle = ink; break;
      case 'pant':
        dot(3.6, 3); dot(9.4, 3); ln([[1.5, 0.5], [5, 1.6]], 1.3); ln([[8, 1.6], [11.5, 0.5]], 1.3); mouthOpen(7.5, 9.2, 2.6, 1.4 + 1.4 * (f.mouth || 0)); break;
      case 'dizzy':
        ln([[2, 1], [5, 4]], 1.5); ln([[5, 1], [2, 4]], 1.5); ln([[8, 1], [11, 4]], 1.5); ln([[11, 1], [8, 4]], 1.5);
        mouthOpen(7.5, 9.2, 2.4, 1.6); break;
    }
  }

  V.figLocalToWorld = (f, pt) => {
    // same order as drawFigure: scale (with facing) -> rotate (f.rot, e.g. lying down) -> translate
    let v = [pt[0] * V.S * (f.s || 1) * (f.face || 1), pt[1] * V.S * (f.s || 1)];
    if (f.rot) v = V.rot(v, f.rot);
    return [f.x + v[0], (f.y == null ? V.FLOOR : f.y) + v[1]];
  };
  V.figPoint = function (f, name) {
    const G = V.geom(f.pose);
    return V.figLocalToWorld(f, G[name]);
  };

  // Blend a palette toward charcoal (tint 0..1): "becoming like the people around you"
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const tintCache = new Map();
  function tinted(pal, t) {
    const key = pal.arm[0] + Math.round(t * 50);
    if (tintCache.has(key)) return tintCache.get(key);
    const C = '#2A2A33', m = (c) => (typeof c === 'string' && c[0] === '#' && c.length === 7 ? mixHex(c, C, t) : c);
    const o = Object.assign({}, pal, { arm: pal.arm.map(m), leg: pal.leg.map(m), torso: pal.torso.map(m), fist: m(pal.fist), foot: m(pal.foot), head: m(pal.head) });
    tintCache.set(key, o); return o;
  }
  V.drawFigure = function (g, f) {
    let pal = V.PAL[f.kind] || V.PAL.other;
    if (f.tint) pal = tinted(pal, Math.round(f.tint * 50) / 50);
    const G = V.geom(f.pose);
    g.save();
    g.translate(f.x, f.y == null ? V.FLOOR : f.y);
    if (f.rot) g.rotate(f.rot);                       // e.g. lying on a bed (±π/2 around the feet)
    if (f.alpha != null) g.globalAlpha = f.alpha;
    const sc = V.S * (f.s || 1);
    g.scale(sc * (f.face || 1), sc);
    const armsFront = f.pose.armsFront;
    if (!armsFront) arm(g, G.sB, G.eB, G.hB, pal);
    leg(g, G.hipB, G.kB, G.fB, pal);
    torso(g, G, f, pal);
    leg(g, G.hipF, G.kF, G.fF, pal);
    head(g, G, f, pal);
    if (armsFront) arm(g, G.sB, G.eB, G.hB, pal);
    arm(g, G.sF, G.eF, G.hF, pal);
    if (f.drawHeld) f.drawHeld(g, G); // props held in hand, in rig space
    g.restore();
  };
})();
