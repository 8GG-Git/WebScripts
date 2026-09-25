/* 8GG gates dial, version 3 (25/09/2026). Oblong track by default; shape: "ring" gives the version 2 circle. Replaces the 3D figure of eight on the hero-8 and gates-8 widgets.
   Eight lacquered capsule segments in the site's gate colours, raised white badges with Lucide icons,
   a light stream and orb that ride over the ring, phase arcs, contact shadow, studio lighting, centre readout.
   Needs three.js r128 (already loaded by the site).

   INSTALL: load BEFORE 8gg-widgets.js runs, e.g. in the home page head code:
     <script src="https://cdn.jsdelivr.net/gh/8GG-Git/WebScripts@<commit>/8gg-dial.js" integrity="<sri>" crossorigin="anonymous"></script>
   It takes over window.createEightScene, so 8gg-scene.js and 8gg-widgets.js stay unchanged.
   ROLL BACK: delete that script tag. The original eight (8gg-scene.js) is still loaded and used.
   COMPARE: add ?scene=eight to any page address to see the original eight.
   HERO SIZE: the hero canvas is raised to clamp(360px, 30vw, 560px) unless the hero-8 element has data-height.

   Options (same contract as createEightScene): host, tip, gates, colors, mode, particles, onGate, onPick,
   plus shape ("oblong" default, or "ring"), icons, tilt (default -0.42), lap (seconds, default 16), centre (false hides the readout). */
(function () {
  /* Lucide icons (ISC licence): user, map, book-text, circle-check, shield-alert, eye, rotate-cw, message-square-text */
  var LUCIDE = [["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "M8.0 7.0a4.0 4.0 0 1 0 8.0 0a4.0 4.0 0 1 0 -8.0 0"], ["M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z", "M15 5.764v15", "M9 3.236v15"], ["M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20", "M8 11h8", "M8 7h6"], ["M2.0 12.0a10.0 10.0 0 1 0 20.0 0a10.0 10.0 0 1 0 -20.0 0", "m16 9-5.5 5.5L8 12"], ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M12 8v4", "M12 16h.01"], ["M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", "M9.0 12.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0"], ["M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", "M21 3v5h-5"], ["M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z", "M7 11h10", "M7 15h6", "M7 7h8"]];
  var DEF_COLORS = ["#EE8A2A", "#5AA84B", "#139E90", "#3A8BCB", "#7B3F95", "#BE1E5C", "#77716B", "#DC3B2E"];

  function studio(T) {
    /* A soft photographic studio for reflections: warm grey room, two large softboxes, a rim strip, a floor bounce. */
    var room = new T.Scene(), box = new T.BoxGeometry(1, 1, 1);
    var walls = new T.Mesh(new T.BoxGeometry(30, 18, 30), new T.MeshBasicMaterial({ color: 0x8a8079, side: T.BackSide }));
    walls.position.y = 4; room.add(walls);
    function panel(w, h, d, x, y, z, col, k) { var m = new T.Mesh(box, new T.MeshBasicMaterial({ color: new T.Color(col).multiplyScalar(k) })); m.scale.set(w, h, d); m.position.set(x, y, z); room.add(m); }
    panel(10, 0.2, 6, -2, 11, 4, 0xffffff, 6);      // key softbox, above front left
    panel(0.2, 7, 9, 13, 3, 2, 0xfff1e6, 3.2);      // side softbox, right
    panel(0.2, 5, 12, -13, 2, -2, 0xffe2cc, 1.6);   // fill, left, warm
    panel(14, 1.2, 0.2, 0, 6, -13, 0xffffff, 2.4);  // rim strip behind
    panel(20, 0.1, 20, 0, -5, 0, 0xf2d3bd, 0.9);    // floor bounce, warm
    return room;
  }

  function createGatesDial3D(canvas, o) {
    var T = window.THREE; if (!T || !canvas) return null; o = o || {};
    var host = o.host || canvas.parentElement, tip = o.tip, G = o.gates || [], ICONS = o.icons || LUCIDE, COLORS = o.colors || DEF_COLORS;
    var TILT = o.tilt == null ? -0.42 : o.tilt, mode = o.mode || "auto", LAP = o.lap || 16, target = 0, alive = true, raf = 0, TAU = Math.PI * 2;
    var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0);
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.LinearToneMapping; r.toneMappingExposure = 0.95;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    var maxAniso = r.capabilities.getMaxAnisotropy ? r.capabilities.getMaxAnisotropy() : 4;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(30, 1, 0.1, 100);
    var pm = new T.PMREMGenerator(r); scene.environment = pm.fromScene(studio(T), 0.035).texture; pm.dispose();
    scene.add(new T.HemisphereLight(0xfff6ee, 0xe8cdb8, 0.22));
    var key = new T.DirectionalLight(0xffffff, 0.75); key.position.set(-2.5, 3.5, 9); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 8; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
    var sc = key.shadow.camera; sc.left = -5; sc.right = 5; sc.top = 5; sc.bottom = -5; sc.near = 1; sc.far = 25;
    scene.add(key);

    // Track: a rounded rectangle (oblong) or a circle, walked clockwise from 12 o'clock
    var SHAPES = {
      oblong: { a: 3.1, b: 1.72, rc: 1.12, band: 0.8, depth: 0.34, rp: 0.17, off: 0.64, badge: 0.27 },
      ring:   { a: 2.0, b: 2.0,  rc: 2.0,  band: 0.6, depth: 0.6,  rp: 0.3,  off: 0.56, badge: 0.205 }
    };
    var S = SHAPES[o.shape] || SHAPES.oblong, GAPLEN = 0.13, FLOW_Z = S.depth + 0.22;
    var pivot = new T.Group(), spin = new T.Group(); scene.add(pivot); pivot.add(spin);
    function makeTrack(a, b, rc) {
      var sx = a - rc, sy = b - rc, q = Math.PI * rc / 2, L = [sx, q, 2 * sy, q, 2 * sx, q, 2 * sy, q, sx], P = 0; L.forEach(function (l) { P += l; });
      function at(u, out) {
        var s = ((u % 1) + 1) % 1 * P, k = 0; while (k < 8 && s > L[k]) { s -= L[k]; k++; }
        var x, y, tx, ty, th;
        if (k === 0) { x = s; y = b; tx = 1; ty = 0; }
        else if (k === 1) { th = Math.PI / 2 - s / rc; x = sx + rc * Math.cos(th); y = sy + rc * Math.sin(th); tx = Math.sin(th); ty = -Math.cos(th); }
        else if (k === 2) { x = a; y = sy - s; tx = 0; ty = -1; }
        else if (k === 3) { th = -s / rc; x = sx + rc * Math.cos(th); y = -sy + rc * Math.sin(th); tx = Math.sin(th); ty = -Math.cos(th); }
        else if (k === 4) { x = sx - s; y = -b; tx = -1; ty = 0; }
        else if (k === 5) { th = -Math.PI / 2 - s / rc; x = -sx + rc * Math.cos(th); y = -sy + rc * Math.sin(th); tx = Math.sin(th); ty = -Math.cos(th); }
        else if (k === 6) { x = -a; y = -sy + s; tx = 0; ty = 1; }
        else if (k === 7) { th = Math.PI - s / rc; x = -sx + rc * Math.cos(th); y = sy + rc * Math.sin(th); tx = Math.sin(th); ty = -Math.cos(th); }
        else { x = -sx + s; y = b; tx = 1; ty = 0; }
        out = out || {}; out.x = x; out.y = y; out.tx = tx; out.ty = ty; return out;
      }
      return { at: at, P: P };
    }
    // Hero: give the dial a taller stage unless the page sets one.
    var mountEl = canvas.parentElement;
    if (mountEl && mountEl.getAttribute("data-8gg") === "hero-8" && !mountEl.getAttribute("data-height")) canvas.style.height = o.heroHeight || (S === SHAPES.ring ? "clamp(360px, 30vw, 560px)" : "clamp(340px, 27vw, 520px)");
    var TRACK = makeTrack(S.a, S.b, S.rc), ARCS = makeTrack(S.a + S.off, S.b + S.off, S.rc + S.off), tmpP = {};
    function trackPoint(u, dn, z, out) { TRACK.at(u, tmpP); return (out || new T.Vector3()).set(tmpP.x - tmpP.ty * dn, tmpP.y + tmpP.tx * dn, z); }

    // Contact shadow on an invisible floor under the track
    var floor = new T.Mesh(new T.PlaneGeometry(16, 12), new T.ShadowMaterial({ opacity: 0.16 }));
    floor.position.z = -0.02; floor.receiveShadow = true; spin.add(floor);

    // Rounded-rectangle profile swept along part of the track
    var PROF = (function () {
      var w = S.band / 2, h = S.depth / 2, rr = Math.min(S.rp, w, h), pts = [], n = 6;
      [[w - rr, h - rr, 0], [-(w - rr), h - rr, Math.PI / 2], [-(w - rr), -(h - rr), Math.PI], [w - rr, -(h - rr), Math.PI * 1.5]].forEach(function (c) {
        for (var i = 0; i <= n; i++) { var t = c[2] + (i / n) * Math.PI / 2; pts.push([c[0] + rr * Math.cos(t), c[1] + rr * Math.sin(t) + h]); }
      });
      return pts;
    })();
    function sweep(u0, u1) {
      var N = Math.max(24, Math.round((u1 - u0) * 900)), NP = PROF.length, pos = [], idx = [], p = {};
      for (var i = 0; i <= N; i++) {
        TRACK.at(u0 + (u1 - u0) * i / N, p); var nx = -p.ty, ny = p.tx;
        for (var j = 0; j < NP; j++) pos.push(p.x + nx * PROF[j][0], p.y + ny * PROF[j][0], PROF[j][1]);
      }
      for (i = 0; i < N; i++) for (j = 0; j < NP; j++) { var j2 = (j + 1) % NP, A0 = i * NP + j, B0 = i * NP + j2, C0 = (i + 1) * NP + j, D0 = (i + 1) * NP + j2; idx.push(A0, C0, B0, B0, C0, D0); }
      [0, N].forEach(function (ii, e) {
        var base = pos.length / 3; TRACK.at(u0 + (u1 - u0) * ii / N, p); var nx = -p.ty, ny = p.tx;
        pos.push(p.x, p.y, S.depth / 2); for (var j = 0; j < NP; j++) pos.push(p.x + nx * PROF[j][0], p.y + ny * PROF[j][0], PROF[j][1]);
        for (j = 0; j < NP; j++) { var j2 = (j + 1) % NP; if (e === 0) idx.push(base, base + 1 + j2, base + 1 + j); else idx.push(base, base + 1 + j, base + 1 + j2); }
      });
      var g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
    }

    var segs = [], hitList = [];
    for (var i = 0; i < 8; i++) {
      var base = new T.Color(COLORS[i]).convertSRGBToLinear();
      var mat = new T.MeshPhysicalMaterial({ color: base.clone(), roughness: 0.34, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.55, emissive: base.clone(), emissiveIntensity: 0, side: T.DoubleSide });
      var gu = GAPLEN / 2 / TRACK.P, su0 = i / 8 + gu, su1 = (i + 1) / 8 - gu;
      var seg = new T.Group(), body = new T.Mesh(sweep(su0, su1), mat); body.castShadow = true; body.receiveShadow = true; seg.add(body);
      var badge = new T.Group(), BR = S.badge;
      var disc = new T.Mesh(new T.CylinderGeometry(BR, BR, 0.06, 64), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.8 }));
      disc.rotation.x = Math.PI / 2; disc.castShadow = true; badge.add(disc);
      var ic = document.createElement("canvas"); ic.width = ic.height = 512; var ix = ic.getContext("2d");
      ix.translate(256 - 150, 256 - 150); ix.scale(300 / 24, 300 / 24); ix.strokeStyle = COLORS[i]; ix.lineWidth = 2.1; ix.lineCap = "round"; ix.lineJoin = "round";
      [].concat(ICONS[i] || []).forEach(function (d) { try { ix.stroke(new Path2D(d)); } catch (e) {} });
      var itex = new T.CanvasTexture(ic); itex.encoding = T.sRGBEncoding; itex.anisotropy = maxAniso;
      var face = new T.Mesh(new T.CircleGeometry(BR * 0.97, 64), new T.MeshBasicMaterial({ map: itex, transparent: true, toneMapped: false, depthWrite: false }));
      face.position.z = 0.032; badge.add(face);
      trackPoint((i + 0.5) / 8, 0, S.depth + 0.005, badge.position); seg.add(badge);
      TRACK.at((i + 0.5) / 8, tmpP);
      seg.userData = { i: i, u: (i + 0.5) / 8, k: 0, h: 0, base: base, mat: mat, badge: badge, nx: -tmpP.ty, ny: tmpP.tx };
      body.userData.seg = seg; hitList.push(body);
      spin.add(seg); segs.push(seg);
    }

    // Phase arcs: solid orange for gates 1 to 5, dashed teal for 6 to 8
    function arcTube(u0, u1, col, rad, n) { var c = new T.Curve(); c.getPoint = function (t, out) { ARCS.at(u0 + (u1 - u0) * t, tmpP); return (out || new T.Vector3()).set(tmpP.x, tmpP.y, 0.02); }; var m = new T.Mesh(new T.TubeGeometry(c, n, rad, 12, false), new T.MeshStandardMaterial({ color: new T.Color(col).convertSRGBToLinear(), roughness: 0.4, envMapIntensity: 0.6 })); spin.add(m); }
    arcTube(0.004, 5 / 8 - 0.004, "#E8823A", 0.024, 240);
    for (var k = 0; k < 20; k++) { var du = (3 / 8 - 0.008) / 20; arcTube(5 / 8 + 0.004 + k * du, 5 / 8 + 0.004 + k * du + du * 0.55, "#56C6C6", 0.022, 10); }

    // Light stream riding over the ring, brightest just behind the orb
    var NP = Math.min(o.particles || 1400, 1600), ppos = new Float32Array(NP * 3), pcol = new Float32Array(NP * 3), off = [], jit = [], spd = [], hue = [];
    for (i = 0; i < NP; i++) {
      off.push(Math.random()); spd.push(0.9 + Math.random() * 0.2);
      var ang = Math.random() * TAU, rr = 0.05 * Math.sqrt(Math.random()); jit.push([Math.cos(ang) * rr, Math.sin(ang) * rr * 0.7]); hue.push(Math.random());
    }
    var pgeo = new T.BufferGeometry(); pgeo.setAttribute("position", new T.BufferAttribute(ppos, 3)); pgeo.setAttribute("color", new T.BufferAttribute(pcol, 3));
    var dc = document.createElement("canvas"); dc.width = dc.height = 64; var dx = dc.getContext("2d"), dg = dx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dg.addColorStop(0, "rgba(255,255,255,1)"); dg.addColorStop(0.35, "rgba(255,255,255,0.55)"); dg.addColorStop(1, "rgba(255,255,255,0)"); dx.fillStyle = dg; dx.fillRect(0, 0, 64, 64);
    var stream = new T.Points(pgeo, new T.PointsMaterial({ size: 0.075, map: new T.CanvasTexture(dc), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }));
    spin.add(stream);
    var CA = new T.Color("#FF6A2B"), CB = new T.Color("#FFC08A"), tmpC = new T.Color();

    // Orb
    var orb = new T.Mesh(new T.SphereGeometry(0.085, 40, 40), new T.MeshBasicMaterial({ color: 0xfff1e4, toneMapped: false })); spin.add(orb);
    var glow = new T.PointLight(0xff7a3a, 1.6, 2.2, 2); orb.add(glow);
    var tc = document.createElement("canvas"); tc.width = tc.height = 128; var tx = tc.getContext("2d"), gr = tx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,150,90,0.9)"); gr.addColorStop(0.3, "rgba(255,120,60,0.3)"); gr.addColorStop(1, "rgba(255,120,60,0)"); tx.fillStyle = gr; tx.fillRect(0, 0, 128, 128);
    var halo = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(tc), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false })); halo.scale.set(0.75, 0.75, 1); orb.add(halo);

    // Centre readout
    var ctr = null, ctrNum = null, ctrName = null, ctrShown = -1, par = canvas.parentElement;
    if (o.centre !== false && par) {
      if (window.getComputedStyle(par).position === "static") par.style.position = "relative";
      ctr = document.createElement("div"); ctr.setAttribute("aria-live", "polite");
      ctr.style.cssText = "position:absolute;transform:translate(-50%,-50%);text-align:center;pointer-events:none;display:flex;flex-direction:column;gap:3px;width:40%;max-width:240px";
      ctrNum = document.createElement("div"); ctrName = document.createElement("div"); ctr.appendChild(ctrNum); ctr.appendChild(ctrName); par.appendChild(ctr);
    }
    var W = 1, H = 1, ringPx = 300;
    function placeCentre() {
      if (!ctr) return;
      ctr.style.left = (canvas.offsetLeft + W / 2) + "px"; ctr.style.top = (canvas.offsetTop + H / 2) + "px";
      ctrNum.style.cssText = "font-family:'Geist Mono',ui-monospace,monospace;font-size:" + Math.max(11, Math.round(ringPx * 0.034)) + "px;letter-spacing:.04em;color:" + (ctrShown >= 0 ? COLORS[ctrShown] : "#6E655C");
      ctrName.style.cssText = "font-size:" + Math.max(15, Math.round(ringPx * 0.058)) + "px;font-weight:600;letter-spacing:-.01em;line-height:1.15;color:#14110E";
    }
    function showCentre(i) { if (!ctr || i === ctrShown) return; ctrShown = i; var gg = G[i] || { n: i + 1, name: "" }; ctrNum.textContent = "Gate " + (gg.n < 10 ? "0" : "") + gg.n; ctrName.textContent = gg.name; ctrNum.style.color = COLORS[i]; }

    function size() {
      W = canvas.clientWidth || 1; H = canvas.clientHeight || 1; r.setSize(W, H, false); cam.aspect = W / H;
      var hw = S.a + S.off + 0.08, hh0 = S.b + S.off + 0.08, t = Math.abs(TILT), halfH = hh0 * Math.cos(t) + (S.depth + 0.45) * Math.sin(t), tan = Math.tan(cam.fov * Math.PI / 360);
      var d = Math.max(halfH / tan, hw / (tan * cam.aspect)) * 1.07; cam.position.set(0, 0, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
      var pxPerUnit = Math.min(W / (2 * hw), H / (2 * halfH)); ringPx = Math.min(S.a, S.b) * 2 * pxPerUnit; placeCentre();
    }
    size(); var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(canvas);

    var m = { x: 0, y: 0, tx: 0, ty: 0, nx: 9, ny: 9, sx: 0, sy: 0, drag: false, lx: 0, spin: 0, spinV: 0, over: false, dx0: 0 };
    function mv(e) {
      var bb = canvas.getBoundingClientRect(), hb = host.getBoundingClientRect();
      var px = (e.clientX - bb.left) / bb.width, py = (e.clientY - bb.top) / bb.height;
      m.tx = (px - 0.5) * 2; m.ty = (py - 0.5) * 2; m.nx = px * 2 - 1; m.ny = -(py * 2 - 1); m.sx = e.clientX - hb.left; m.sy = e.clientY - hb.top;
      if (m.drag) { m.spinV = -(e.clientX - m.lx) * (o.shape === "ring" ? 0.005 : 0.0018); m.spin += m.spinV; m.lx = e.clientX; }
    }
    function down(e) { m.dx0 = e.clientX; if (hovered || m.over) { m.drag = true; m.lx = e.clientX; e.preventDefault(); } }
    function click(e) { if (Math.abs(e.clientX - m.dx0) > 5) return; if (hovered && o.onPick) o.onPick(hovered.userData.i); }
    function up() { m.drag = false; }
    function leave() { m.tx = 0; m.ty = 0; m.nx = 9; m.ny = 9; m.drag = false; }
    canvas.addEventListener("mousemove", mv); canvas.addEventListener("mousedown", down); window.addEventListener("mouseup", up); canvas.addEventListener("mouseleave", leave); canvas.addEventListener("click", click);

        var ray = new T.Raycaster(), v2 = new T.Vector2(), tp = new T.Vector3();
    var u0 = 0, hovered = null, lastHover = -1, lastGate = -1, last = performance.now(), visible = true, cur = 0;
    var io = window.IntersectionObserver ? new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }) : null; if (io) io.observe(canvas);

    function frame(now) {
      if (!alive) return; raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
      if (!visible) return;
      m.x += (m.tx - m.x) * 0.05; m.y += (m.ty - m.y) * 0.05;
      if (!m.drag) { m.spinV *= 0.94; m.spin += m.spinV; m.spin *= 0.985; }
      pivot.rotation.set(TILT + m.y * 0.1, m.x * 0.16, 0); spin.rotation.z = m.spin;
      if (mode === "auto" && !RM) u0 = (u0 + dt / LAP) % 1;
      else { var goal = segs[target].userData.u - 0.012, du = goal - u0; du -= Math.floor(du); if (du > 0.5) du -= 1; u0 = (u0 + du * Math.min(1, dt * 3) + 1) % 1; }
      trackPoint(u0, 0, FLOW_Z + 0.02, orb.position);
      var col = pgeo.attributes.color.array;
      for (var i = 0; i < NP; i++) {
        var uu = (off[i] + t * 0.018 * spd[i]) % 1; trackPoint(uu, jit[i][0], FLOW_Z + jit[i][1], tp);
        ppos[i * 3] = tp.x; ppos[i * 3 + 1] = tp.y; ppos[i * 3 + 2] = tp.z;
        var behind = u0 - uu; behind -= Math.floor(behind); var tail = Math.exp(-behind / 0.09);
        var br = tail; tmpC.copy(CA).lerp(CB, hue[i] * 0.6 + tail * 0.4).multiplyScalar(br);
        col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
      }
      pgeo.attributes.position.needsUpdate = true; pgeo.attributes.color.needsUpdate = true;
      hovered = null; m.over = false;
      if (m.nx < 5 && Math.abs(m.nx) <= 1 && Math.abs(m.ny) <= 1) { v2.set(m.nx, m.ny); ray.setFromCamera(v2, cam); var h = ray.intersectObjects(hitList)[0]; if (h) hovered = h.object.userData.seg; m.over = !!h; }
      canvas.style.cursor = m.drag ? "grabbing" : hovered ? "pointer" : m.over ? "grab" : "";
      if (mode === "auto") { var best = 9; for (var q = 0; q < 8; q++) { var dd = u0 - segs[q].userData.u + 0.02; dd -= Math.floor(dd); if (dd < best) { best = dd; cur = q; } } } else cur = target;
      segs.forEach(function (g) {
        var d = g.userData, on = d.i === cur ? 1 : 0;
        d.k += (on - d.k) * 0.08; d.h += ((g === hovered ? 1 : 0) - d.h) * 0.15;
        var lift = d.k * 0.18 + d.h * 0.07, pushOut = d.k * 0.08; g.position.set(d.nx * pushOut, d.ny * pushOut, lift);
        d.mat.emissiveIntensity = d.k * 0.22 + d.h * 0.1;
        
        d.badge.rotation.z = -m.spin;
      });
      showCentre(cur);
      if (tip) {
        if (hovered) {
          var gi = hovered.userData.i, GG = G[gi] || { n: gi + 1, name: "", line: "" };
          if (lastHover !== gi) { tip.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-family:Geist Mono,monospace;color:#D8CFC6;font-size:12px;margin-bottom:4px"><span style="width:10px;height:10px;border-radius:50%;background:' + COLORS[gi] + ';box-shadow:0 0 0 2px rgba(255,255,255,0.25)"></span>Gate ' + (GG.n < 10 ? "0" : "") + GG.n + " · " + (gi < 5 ? "Before live" : "While live") + '</div><div style="font-weight:500;font-size:15px;margin-bottom:4px">' + GG.name + '</div><div style="color:#B3A99F">' + (GG.line || "") + "</div>"; lastHover = gi; }
          tip.style.opacity = 1; tip.style.transform = "translate(" + Math.min(host.clientWidth - 260, m.sx + 18) + "px," + (m.sy + 18) + "px)";
        } else { tip.style.opacity = 0; lastHover = -1; }
      }
      r.render(scene, cam);
      if (mode === "auto" && cur !== lastGate) { lastGate = cur; if (o.onGate) o.onGate(cur); }
    }
    raf = requestAnimationFrame(frame);
    return {
      setGate: function (i) { target = Math.max(0, Math.min(7, i)); },
      setMode: function (md) { mode = md; lastGate = -1; },
      setLap: function (s) { LAP = s || 16; },
      setTilt: function (v) { TILT = v; size(); },
      dispose: function () { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); canvas.removeEventListener("mousemove", mv); canvas.removeEventListener("mousedown", down); window.removeEventListener("mouseup", up); canvas.removeEventListener("mouseleave", leave); canvas.removeEventListener("click", click); r.dispose(); if (ctr && ctr.parentNode) ctr.parentNode.removeChild(ctr); }
    };
  }
  window.createGatesDial3D = createGatesDial3D;
})();

/* Switch: route createEightScene to the dial, whatever order the files load in. */
(function () {
  var useEight = /[?&]scene=eight\b/.test(location.search) || window.G8_SCENE === "eight";
  if (useEight || !window.createGatesDial3D) return;
  var original = window.createEightScene || null;
  function dial(canvas, o) { return window.createGatesDial3D(canvas, o); }
  try {
    Object.defineProperty(window, "createEightScene", { configurable: true, get: function () { return dial; }, set: function (v) { original = v; } });
  } catch (e) { window.createEightScene = dial; }
  window.createEightSceneOriginal = function (canvas, o) { return original ? original(canvas, o) : null; };
})();
