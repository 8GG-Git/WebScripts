/* 8GG gates dial, version 2 (25/09/2026). Replaces the 3D figure of eight on the hero-8 and gates-8 widgets.
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
   plus icons, tilt (default -0.42), lap (seconds, default 16), centre (false hides the readout). */
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

    // Hero: give the dial a taller stage unless the page sets one.
    var mountEl = canvas.parentElement;
    if (mountEl && mountEl.getAttribute("data-8gg") === "hero-8" && !mountEl.getAttribute("data-height")) canvas.style.height = o.heroHeight || "clamp(360px, 30vw, 560px)";

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
    var sc = key.shadow.camera; sc.left = -3.6; sc.right = 3.6; sc.top = 3.6; sc.bottom = -3.6; sc.near = 1; sc.far = 25;
    scene.add(key);

    var A = 2.0, TUBE = 0.3, GAP = 0.075, ARC = Math.PI / 4 - GAP, FLOW_Z = TUBE + 0.2;
    var pivot = new T.Group(), spin = new T.Group(); scene.add(pivot); pivot.add(spin);
    function midAngle(i) { return Math.PI / 2 - (i + 0.5) * Math.PI / 4; }
    function ringPoint(u, rad, z, out) { var a = Math.PI / 2 - u * TAU; return (out || new T.Vector3()).set(Math.cos(a) * rad, Math.sin(a) * rad, z); }

    // Contact shadow on an invisible floor under the ring
    var floor = new T.Mesh(new T.PlaneGeometry(9, 9), new T.ShadowMaterial({ opacity: 0.16 }));
    floor.position.z = -TUBE - 0.02; floor.receiveShadow = true; spin.add(floor);

    // Segments: capsules bent along the ring
    var segs = [], hitList = [];
    for (var i = 0; i < 8; i++) {
      var base = new T.Color(COLORS[i]).convertSRGBToLinear();
      var mat = new T.MeshPhysicalMaterial({ color: base.clone(), roughness: 0.34, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.55, emissive: base.clone(), emissiveIntensity: 0 });
      var a1 = midAngle(i) + ARC / 2, a0 = midAngle(i) - ARC / 2;
      var curve = new T.Curve(); (function (a0, a1) { curve.getPoint = function (t, out) { var a = a0 + (a1 - a0) * t; return (out || new T.Vector3()).set(Math.cos(a) * A, Math.sin(a) * A, 0); }; })(a0, a1);
      var seg = new T.Group();
      var body = new T.Mesh(new T.TubeGeometry(curve, 72, TUBE, 48, false), mat); body.castShadow = true; body.receiveShadow = true; seg.add(body);
      [a0, a1].forEach(function (a) { var cap = new T.Mesh(new T.CircleGeometry(TUBE, 48), mat); cap.position.set(Math.cos(a) * A, Math.sin(a) * A, 0); cap.lookAt(cap.position.x - Math.sin(a) * (a === a0 ? 1 : -1), cap.position.y + Math.cos(a) * (a === a0 ? 1 : -1), 0); cap.castShadow = true; seg.add(cap); });
      // Raised badge with the icon, kept upright
      var badge = new T.Group();
      var disc = new T.Mesh(new T.CylinderGeometry(0.205, 0.205, 0.06, 64), new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 0.8 }));
      disc.rotation.x = Math.PI / 2; disc.castShadow = true; badge.add(disc);
      var ic = document.createElement("canvas"); ic.width = ic.height = 512; var ix = ic.getContext("2d");
      ix.translate(256 - 150, 256 - 150); ix.scale(300 / 24, 300 / 24); ix.strokeStyle = COLORS[i]; ix.lineWidth = 2.1; ix.lineCap = "round"; ix.lineJoin = "round";
      [].concat(ICONS[i] || []).forEach(function (d) { try { ix.stroke(new Path2D(d)); } catch (e) {} });
      var itex = new T.CanvasTexture(ic); itex.encoding = T.sRGBEncoding; itex.anisotropy = maxAniso;
      var face = new T.Mesh(new T.CircleGeometry(0.2, 64), new T.MeshBasicMaterial({ map: itex, transparent: true, toneMapped: false, depthWrite: false }));
      face.position.z = 0.032; badge.add(face);
      badge.position.set(Math.cos(midAngle(i)) * A, Math.sin(midAngle(i)) * A, TUBE + 0.005);
      seg.add(badge);
      seg.userData = { i: i, u: (i + 0.5) / 8, k: 0, h: 0, base: base, mat: mat, badge: badge };
      body.userData.seg = seg; hitList.push(body); seg.children.forEach(function (c) { c.userData.seg = seg; if (c !== badge) hitList.push(c); });
      spin.add(seg); segs.push(seg);
    }

    // Phase arcs: solid orange for gates 1 to 5, dashed teal for 6 to 8
    var RA = A + 0.56;
    function arcTube(u0, u1, col, rad, n) { var c = new T.Curve(); c.getPoint = function (t, out) { return ringPoint(u0 + (u1 - u0) * t, RA, 0, out); }; var m = new T.Mesh(new T.TubeGeometry(c, n, rad, 12, false), new T.MeshStandardMaterial({ color: new T.Color(col).convertSRGBToLinear(), roughness: 0.4, envMapIntensity: 0.6 })); spin.add(m); }
    arcTube(0.004, 5 / 8 - 0.004, "#E8823A", 0.024, 160);
    for (var k = 0; k < 18; k++) { var du = (3 / 8 - 0.008) / 18; arcTube(5 / 8 + 0.004 + k * du, 5 / 8 + 0.004 + k * du + du * 0.55, "#56C6C6", 0.022, 8); }

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
      var R = RA + 0.06, t = Math.abs(TILT), halfH = R * Math.cos(t) + (TUBE + 0.45) * Math.sin(t), tan = Math.tan(cam.fov * Math.PI / 360);
      var d = Math.max(halfH / tan, R / (tan * cam.aspect)) * 1.03; cam.position.set(0, 0, d); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
      ringPx = Math.min(W, H * R / halfH) * (A * 2 / (R * 2)); placeCentre();
    }
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

    var ring = new T.Mesh(new T.TorusGeometry(A, TUBE * 1.6, 8, 64), new T.MeshBasicMaterial({ visible: false })); spin.add(ring);
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
      ringPoint(u0, A, FLOW_Z + 0.02, orb.position);
      var col = pgeo.attributes.color.array;
      for (var i = 0; i < NP; i++) {
        var uu = (off[i] + t * 0.018 * spd[i]) % 1; ringPoint(uu, A + jit[i][0], FLOW_Z + jit[i][1], tp);
        ppos[i * 3] = tp.x; ppos[i * 3 + 1] = tp.y; ppos[i * 3 + 2] = tp.z;
        var behind = u0 - uu; behind -= Math.floor(behind); var tail = Math.exp(-behind / 0.09);
        var br = 0.06 + 0.94 * tail; tmpC.copy(CA).lerp(CB, hue[i] * 0.6 + tail * 0.4).multiplyScalar(br);
        col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
      }
      pgeo.attributes.position.needsUpdate = true; pgeo.attributes.color.needsUpdate = true;
      hovered = null; m.over = false;
      if (m.nx < 5 && Math.abs(m.nx) <= 1 && Math.abs(m.ny) <= 1) { v2.set(m.nx, m.ny); ray.setFromCamera(v2, cam); var h = ray.intersectObjects(hitList)[0]; if (h) hovered = h.object.userData.seg; m.over = !!ray.intersectObject(ring)[0]; }
      canvas.style.cursor = m.drag ? "grabbing" : hovered ? "pointer" : m.over ? "grab" : "";
      if (mode === "auto") { var best = 9; for (var q = 0; q < 8; q++) { var dd = u0 - segs[q].userData.u + 0.02; dd -= Math.floor(dd); if (dd < best) { best = dd; cur = q; } } } else cur = target;
      segs.forEach(function (g) {
        var d = g.userData, on = d.i === cur ? 1 : 0;
        d.k += (on - d.k) * 0.08; d.h += ((g === hovered ? 1 : 0) - d.h) * 0.15;
        g.position.z = d.k * 0.2 + d.h * 0.08;
        d.mat.emissiveIntensity = d.k * 0.22 + d.h * 0.1;
        var s = 1 + d.k * 0.035; g.scale.set(s, s, s);
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
