/* 8GG gates dial (3D). Replaces the 3D figure of eight on the hero-8 and gates-8 widgets.
   Based on Claude Design's createGatesDial3D (25/09/2026): eight glossy segments in the site's gate
   colours, Lucide icons on white badges, orb and particle stream, phase arcs, centre readout.
   Needs three.js r128 (already loaded by the site).

   INSTALL: load this file BEFORE 8gg-widgets.js runs, for example in the home page head code:
     <script src="https://cdn.jsdelivr.net/gh/8GG-Git/WebScripts@<commit>/8gg-dial.js" integrity="<sri>" crossorigin="anonymous"></script>
   It takes over window.createEightScene, so 8gg-scene.js and 8gg-widgets.js stay unchanged.

   ROLL BACK: delete that one script tag. The original eight (8gg-scene.js) is still loaded and used.
   COMPARE: add ?scene=eight to any page address to see the original eight without changing anything.

   Options (same contract as createEightScene): host, tip, gates, colors, mode, particles, onGate, onPick,
   plus icons, iconStyle ("badge" | "plain"), tilt (default -0.4), lap, centre (false to hide the readout). */
/* The dial in 3D: eight glossy gate segments on a ring, data flowing through them.
   Same materials, lighting and interaction model as createEightScene (8gg-scene.js). Needs window.THREE (r128).
   createGatesDial3D(canvas, { host, tip, gates, icons, colors, mode: "auto" | "manual", lap, particles, onGate, onPick })
   -> { setGate, setMode, setLap, dispose } */
(function () {
  /* Lucide icons (ISC licence): user, map, book-text, circle-check, shield-alert, eye, rotate-cw, message-square-text */
  var LUCIDE = [["M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", "M8.0 7.0a4.0 4.0 0 1 0 8.0 0a4.0 4.0 0 1 0 -8.0 0"], ["M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z", "M15 5.764v15", "M9 3.236v15"], ["M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20", "M8 11h8", "M8 7h6"], ["M2.0 12.0a10.0 10.0 0 1 0 20.0 0a10.0 10.0 0 1 0 -20.0 0", "m16 9-5.5 5.5L8 12"], ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "M12 8v4", "M12 16h.01"], ["M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0", "M9.0 12.0a3.0 3.0 0 1 0 6.0 0a3.0 3.0 0 1 0 -6.0 0"], ["M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8", "M21 3v5h-5"], ["M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z", "M7 11h10", "M7 15h6", "M7 7h8"]];
  function createGatesDial3D(canvas, o) {
    var T = window.THREE; if (!T || !canvas) return null; o = o || {};
    var host = o.host || canvas.parentElement, tip = o.tip, G = o.gates || [], ICONS = o.icons || LUCIDE;
    var COLORS = o.colors || ["#EE8A2A", "#5AA84B", "#139E90", "#3A8BCB", "#7B3F95", "#BE1E5C", "#77716B", "#DC3B2E"];
    var BADGE = o.iconStyle !== "plain", ISZ = BADGE ? 0.44 : 0.4, TILT = o.tilt == null ? -0.4 : o.tilt, mode = o.mode || "auto", LAP = o.lap || 14, target = 0, alive = true, raf = 0, TAU = Math.PI * 2;
    var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0);
    r.toneMapping = T.LinearToneMapping; r.toneMappingExposure = 0.92; r.outputEncoding = T.sRGBEncoding;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
    // warm studio environment, same recipe as the eight
    var env = new T.Scene(), eg = new T.SphereGeometry(20, 32, 16), ec = [];
    for (var i = 0; i < eg.attributes.position.count; i++) { var y = eg.attributes.position.getY(i) / 20; var c = new T.Color("#B9785A").lerp(new T.Color("#FFF6EE"), Math.pow((y + 1) / 2, 0.7)); ec.push(c.r, c.g, c.b); }
    eg.setAttribute("color", new T.Float32BufferAttribute(ec, 3));
    env.add(new T.Mesh(eg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    function box(w, h, x, y, z, col) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: col, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); }
    box(14, 5, -6, 10, 6, 0xffffff); box(4, 12, 12, 2, 2, 0xfff4ea); box(8, 3, 0, -8, 10, 0xff8a50);
    var pm = new T.PMREMGenerator(r); scene.environment = pm.fromScene(env, 0.04).texture;
    scene.add(new T.HemisphereLight(0xffffff, 0xffd2b8, 0.22));
    var key = new T.DirectionalLight(0xffffff, 0.55); key.position.set(-5, 8, 10); scene.add(key);

    var A = 2.0, TUBE = 0.3, GAP = 0.09, ARC = Math.PI / 4 - GAP, WHITE = new T.Color("#FFFFFF");
    var pivot = new T.Group(); scene.add(pivot);
    function midAngle(i) { return Math.PI / 2 - (i + 0.5) * Math.PI / 4; }
    var segs = [], segGeo = new T.TorusGeometry(A, TUBE, 36, 64, ARC);
    for (i = 0; i < 8; i++) {
      var base = new T.Color(COLORS[i]).convertSRGBToLinear();
      var mat = new T.MeshPhysicalMaterial({ color: base.clone(), roughness: 0.3, metalness: 0.05, clearcoat: 0.7, clearcoatRoughness: 0.12, emissive: base.clone(), emissiveIntensity: 0.08, envMapIntensity: 0.45 });
      var seg = new T.Mesh(segGeo, mat); seg.rotation.z = Math.PI / 2 - (i + 1) * Math.PI / 4 + GAP / 2;
      seg.userData = { i: i, u: (i + 0.5) / 8, k: 0, h: 0, base: base }; pivot.add(seg); segs.push(seg);
      // icon sprite, always upright and facing the camera
      var ic = document.createElement("canvas"); ic.width = ic.height = 256; var ix = ic.getContext("2d"), parts = [].concat(ICONS[i] || []);
      if (BADGE) {
        ix.shadowColor = "rgba(0,0,0,0.28)"; ix.shadowBlur = 10; ix.shadowOffsetY = 3;
        ix.fillStyle = "#FFFFFF"; ix.beginPath(); ix.arc(128, 124, 104, 0, TAU); ix.fill();
        ix.shadowColor = "transparent"; ix.translate(128 - 60, 124 - 60); ix.scale(120 / 24, 120 / 24);
        ix.strokeStyle = COLORS[i]; ix.lineWidth = 2.1;
      } else {
        ix.shadowColor = "rgba(0,0,0,0.35)"; ix.shadowBlur = 6; ix.translate(128 - 84, 128 - 84); ix.scale(168 / 24, 168 / 24);
        ix.strokeStyle = "#FFFFFF"; ix.lineWidth = 2.6;
      }
      ix.lineCap = "round"; ix.lineJoin = "round";
      if (parts.length) { parts.forEach(function (d) { try { ix.stroke(new Path2D(d)); } catch (e) {} }); }
      else { ix.setTransform(1, 0, 0, 1, 0, 0); ix.fillStyle = BADGE ? COLORS[i] : "#fff"; ix.font = "600 110px Inter, system-ui, sans-serif"; ix.textAlign = "center"; ix.textBaseline = "middle"; ix.fillText(String(i + 1), 128, 128); }
      var itex = new T.CanvasTexture(ic); itex.encoding = T.sRGBEncoding; itex.anisotropy = 8;
      var sp = new T.Sprite(new T.SpriteMaterial({ map: itex, transparent: true, depthTest: false, depthWrite: false }));
      sp.scale.set(ISZ, ISZ, 1); sp.position.set(Math.cos(midAngle(i)) * A, Math.sin(midAngle(i)) * A, 0.06); seg.userData.sprite = sp; pivot.add(sp);
    }
    // phase arcs: orange for gates 1 to 5, teal for 6 to 8
    function arc(from, to, col, op) { var g = new T.TorusGeometry(A + 0.62, 0.022, 8, 120, to - from); var m = new T.Mesh(g, new T.MeshBasicMaterial({ color: new T.Color(col).convertSRGBToLinear(), transparent: op < 1, opacity: op })); m.rotation.z = from; pivot.add(m); }
    arc(Math.PI / 2 - 5 * Math.PI / 4 + GAP / 2, Math.PI / 2 - GAP / 2, "#E8823A", 1);
    arc(Math.PI / 2 - 2 * Math.PI + GAP / 2, Math.PI / 2 - 5 * Math.PI / 4 - GAP / 2, "#56C6C6", 0.8);

    var NP = o.particles || 3200, ppos = new Float32Array(NP * 3), pcol = new Float32Array(NP * 3), off = [], jit = [], spd = [];
    var C1 = new T.Color("#F2450C").convertSRGBToLinear(), C2 = new T.Color("#FF8A4C").convertSRGBToLinear();
    for (i = 0; i < NP; i++) {
      off.push(Math.random()); spd.push(0.85 + Math.random() * 0.3);
      var a = Math.random() * TAU, b = Math.acos(2 * Math.random() - 1), rr = 0.2 * Math.pow(Math.random(), 0.5);
      jit.push(new T.Vector3(rr * Math.sin(b) * Math.cos(a), rr * Math.sin(b) * Math.sin(a), rr * Math.cos(b)));
      var cc = C1.clone().lerp(C2, Math.random()); pcol[i * 3] = cc.r; pcol[i * 3 + 1] = cc.g; pcol[i * 3 + 2] = cc.b;
    }
    var pgeo = new T.BufferGeometry(); pgeo.setAttribute("position", new T.BufferAttribute(ppos, 3)); pgeo.setAttribute("color", new T.BufferAttribute(pcol, 3));
    var dc = document.createElement("canvas"); dc.width = dc.height = 64; var dx = dc.getContext("2d"); dx.fillStyle = "#fff"; dx.beginPath(); dx.arc(32, 32, 28, 0, TAU); dx.fill();
    pivot.add(new T.Points(pgeo, new T.PointsMaterial({ size: 0.075, toneMapped: false, map: new T.CanvasTexture(dc), vertexColors: true, transparent: true, alphaTest: 0.4 })));

    var orb = new T.Mesh(new T.SphereGeometry(0.16, 40, 40), new T.MeshBasicMaterial({ color: 0xff4d12 })); pivot.add(orb);
    orb.add(new T.PointLight(0xff6a2b, 2.4, 3.2, 2));
    var tc = document.createElement("canvas"); tc.width = tc.height = 128; var tx = tc.getContext("2d"), gr = tx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,120,60,1)"); gr.addColorStop(0.4, "rgba(255,120,60,0.35)"); gr.addColorStop(1, "rgba(255,120,60,0)"); tx.fillStyle = gr; tx.fillRect(0, 0, 128, 128);
    var halo = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(tc), transparent: true, depthWrite: false })); halo.scale.set(1.7, 1.7, 1); orb.add(halo);

    var ctr = null, ctrNum = null, ctrName = null, ctrShown = -1, par = canvas.parentElement;
    if (o.centre !== false && par) {
      if (window.getComputedStyle(par).position === "static") par.style.position = "relative";
      ctr = document.createElement("div"); ctr.setAttribute("aria-live", "polite");
      ctr.style.cssText = "position:absolute;transform:translate(-50%,-50%);text-align:center;pointer-events:none;display:flex;flex-direction:column;gap:2px;width:40%;max-width:220px";
      ctrNum = document.createElement("div"); ctrName = document.createElement("div");
      ctr.appendChild(ctrNum); ctr.appendChild(ctrName); par.appendChild(ctr);
    }
    function placeCentre() {
      if (!ctr) return; var s0 = Math.min(W, H);
      ctr.style.left = (canvas.offsetLeft + W / 2) + "px"; ctr.style.top = (canvas.offsetTop + H / 2) + "px";
      ctrNum.style.cssText = "font-size:" + Math.max(11, Math.round(s0 * 0.036)) + "px;color:#4A4A48";
      ctrName.style.cssText = "font-size:" + Math.max(14, Math.round(s0 * 0.05)) + "px;font-weight:600;line-height:1.2;color:#14110E";
    }
    function showCentre(i) { if (!ctr || i === ctrShown) return; ctrShown = i; var gg = G[i] || { n: i + 1, name: "" }; ctrNum.textContent = "Gate " + (gg.n < 10 ? "0" : "") + gg.n; ctrName.textContent = gg.name; }
    var W = 1, H = 1;
    function size() { W = canvas.clientWidth || 1; H = canvas.clientHeight || 1; r.setSize(W, H, false); cam.aspect = W / H; var d = Math.max(2.85 / 0.2867, 2.85 / (0.2867 * cam.aspect)); cam.position.set(0, 0, d); cam.updateProjectionMatrix(); placeCentre(); }
    size(); var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(canvas);

    var m = { x: 0, y: 0, tx: 0, ty: 0, nx: 9, ny: 9, sx: 0, sy: 0, drag: false, lx: 0, spin: 0, spinV: 0, over: false, dx0: 0 };
    function mv(e) {
      var bb = canvas.getBoundingClientRect(), hb = host.getBoundingClientRect();
      var px = (e.clientX - bb.left) / bb.width, py = (e.clientY - bb.top) / bb.height;
      m.tx = (px - 0.5) * 2; m.ty = (py - 0.5) * 2; m.nx = px * 2 - 1; m.ny = -(py * 2 - 1); m.sx = e.clientX - hb.left; m.sy = e.clientY - hb.top;
      if (m.drag) { m.spinV = -(e.clientX - m.lx) * 0.005; m.spin += m.spinV; m.lx = e.clientX; }
    }
    function down(e) { m.dx0 = e.clientX; if (hovered || m.over) { m.drag = true; m.lx = e.clientX; e.preventDefault(); } }
    function click(e) { if (Math.abs(e.clientX - m.dx0) > 5) return; if (hovered && o.onPick) o.onPick(hovered.userData.i); }
    function up() { m.drag = false; }
    function leave() { m.tx = 0; m.ty = 0; m.nx = 9; m.ny = 9; m.drag = false; }
    canvas.addEventListener("mousemove", mv); canvas.addEventListener("mousedown", down); window.addEventListener("mouseup", up); canvas.addEventListener("mouseleave", leave); canvas.addEventListener("click", click);

    var ring = new T.Mesh(new T.TorusGeometry(A, TUBE * 1.6, 8, 64), new T.MeshBasicMaterial({ visible: false })); pivot.add(ring);
    var ray = new T.Raycaster(), v2 = new T.Vector2(), tp = new T.Vector3();
    var u0 = 0, hovered = null, lastHover = -1, lastGate = -1, last = performance.now(), visible = true;
    var io = window.IntersectionObserver ? new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }) : null; if (io) io.observe(canvas);

    function frame(now) {
      if (!alive) return; raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
      if (!visible) return;
      m.x += (m.tx - m.x) * 0.05; m.y += (m.ty - m.y) * 0.05;
      if (!m.drag) { m.spinV *= 0.94; m.spin += m.spinV; m.spin *= 0.985; }
      pivot.rotation.set(TILT + m.y * 0.12, m.x * 0.18, m.spin);
      if (mode === "auto" && !RM) u0 = (u0 + dt / LAP) % 1;
      else { var goal = segs[target].userData.u - 0.012, du = goal - u0; du -= Math.floor(du); if (du > 0.5) du -= 1; u0 = (u0 + du * Math.min(1, dt * 3) + 1) % 1; }
      var oa = Math.PI / 2 - u0 * TAU; orb.position.set(Math.cos(oa) * A, Math.sin(oa) * A, 0);
      for (var i = 0; i < NP; i++) {
        var uu = (off[i] + t * 0.022 * spd[i]) % 1, aa = Math.PI / 2 - uu * TAU; tp.set(Math.cos(aa) * A, Math.sin(aa) * A, 0);
        var j = jit[i], w = 1 + 0.25 * Math.sin(t * 2 + i);
        ppos[i * 3] = tp.x + j.x * w; ppos[i * 3 + 1] = tp.y + j.y * w; ppos[i * 3 + 2] = tp.z + j.z * w;
      }
      pgeo.attributes.position.needsUpdate = true;
      hovered = null; m.over = false;
      if (m.nx < 5 && Math.abs(m.nx) <= 1 && Math.abs(m.ny) <= 1) { v2.set(m.nx, m.ny); ray.setFromCamera(v2, cam); var h = ray.intersectObjects(segs)[0]; if (h) hovered = h.object; m.over = !!ray.intersectObject(ring)[0]; }
      canvas.style.cursor = m.drag ? "grabbing" : hovered ? "pointer" : m.over ? "grab" : "";
      var cur = 0, best = 9;
      segs.forEach(function (g) {
        var d = g.userData, du2 = u0 - d.u; du2 -= Math.round(du2);
        if (du2 > -0.02 && du2 < best) { best = du2; cur = d.i; }
        var pass = Math.max(0, 1 - Math.abs(du2) / 0.035), sel = mode === "manual" && d.i === target ? 1 : 0;
        d.k += (Math.max(pass, sel) - d.k) * 0.1; d.h += ((g === hovered ? 1 : 0) - d.h) * 0.15;
        var lit = Math.max(d.k, d.h * 0.8);
        g.material.color.copy(d.base).lerp(WHITE, lit * 0.12); g.material.emissiveIntensity = 0.08 + lit * 0.45;
        g.position.z = d.k * 0.22 + d.h * 0.12; d.sprite.position.z = 0.06 + g.position.z;
        d.sprite.scale.set(ISZ, ISZ, 1);
      });
      if (tip) {
        if (hovered) {
          var gi = hovered.userData.i, GG = G[gi] || { n: gi + 1, name: "", line: "" };
          if (lastHover !== gi) { tip.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-family:Geist Mono,monospace;color:#D8CFC6;font-size:12px;margin-bottom:4px"><span style="width:10px;height:10px;border-radius:50%;background:' + COLORS[gi] + ';box-shadow:0 0 0 2px rgba(255,255,255,0.25)"></span>Gate ' + (GG.n < 10 ? "0" : "") + GG.n + " · " + (gi < 5 ? "Before live" : "While live") + '</div><div style="font-weight:500;font-size:15px;margin-bottom:4px">' + GG.name + '</div><div style="color:#B3A99F">' + (GG.line || "") + "</div>"; lastHover = gi; }
          tip.style.opacity = 1; tip.style.transform = "translate(" + Math.min(host.clientWidth - 260, m.sx + 18) + "px," + (m.sy + 18) + "px)";
        } else { tip.style.opacity = 0; lastHover = -1; }
      }
      showCentre(mode === "manual" ? target : cur);
      r.render(scene, cam);
      if (mode === "auto" && cur !== lastGate) { lastGate = cur; if (o.onGate) o.onGate(cur); }
    }
    raf = requestAnimationFrame(frame);
    return {
      setGate: function (i) { target = Math.max(0, Math.min(7, i)); },
      setMode: function (md) { mode = md; lastGate = -1; },
      setLap: function (s) { LAP = s || 14; },
      setTilt: function (v) { TILT = v; },
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
  dial.original = function () { return original; };
  try {
    Object.defineProperty(window, "createEightScene", { configurable: true, get: function () { return dial; }, set: function (v) { original = v; } });
  } catch (e) { window.createEightScene = dial; }
  window.createEightSceneOriginal = function (canvas, o) { return original ? original(canvas, o) : null; };
})();
