/* The 8: a figure of eight carrying data through the eight gates.
   Left loop = gates 1 to 5 (before live). Right loop = gates 6 to 8 (while live).
   createEightScene(canvas, { host, tip, onGate, mode: "auto" | "manual", colors, gates }) */
(function () {
  function createEightScene(canvas, o) {
    var T = window.THREE; if (!T || !canvas) return null;
    o = o || {};
    var host = o.host || canvas.parentElement, tip = o.tip, COLORS = o.colors, GATES = o.gates || [];
    var alive = true, raf = 0, mode = o.mode || "auto", target = 0;
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0);
    r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0; r.outputEncoding = T.sRGBEncoding;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 100);
    var env = new T.Scene(), eg = new T.SphereGeometry(20, 32, 16), ec = [];
    for (var i = 0; i < eg.attributes.position.count; i++) { var y = eg.attributes.position.getY(i) / 20; var c = new T.Color("#B9785A").lerp(new T.Color("#FFF6EE"), Math.pow((y + 1) / 2, 0.7)); ec.push(c.r, c.g, c.b); }
    eg.setAttribute("color", new T.Float32BufferAttribute(ec, 3));
    env.add(new T.Mesh(eg, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    function box(w, h, x, y, z, col) { var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: col, side: T.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); }
    box(14, 5, -6, 10, 6, 0xffffff); box(4, 12, 12, 2, 2, 0xfff4ea); box(8, 3, 0, -8, 10, 0xff8a50);
    var pm = new T.PMREMGenerator(r); scene.environment = pm.fromScene(env, 0.04).texture;
    scene.add(new T.HemisphereLight(0xffffff, 0xffd2b8, 0.35));
    var key = new T.DirectionalLight(0xffffff, 0.8); key.position.set(-5, 8, 10); scene.add(key);

    var A = 2.2;
    function P(t, out) { var d = 1 + Math.pow(Math.sin(t), 2); return (out || new T.Vector3()).set(A * Math.cos(t) / d, A * Math.sin(t) * Math.cos(t) / d, 0.6 * Math.sin(t)); }
    var curve = new T.Curve(); curve.getPoint = function (u, out) { return P(u * Math.PI * 2, out); };
    var pivot = new T.Group(); scene.add(pivot);
    var tube = new T.Mesh(new T.TubeGeometry(curve, 300, 0.3, 12, true), new T.MeshBasicMaterial({ visible: false })); pivot.add(tube);

    var gt = []; for (var k = 0; k < 5; k++) gt.push(Math.PI / 2 + (k + 0.5) * Math.PI / 5); for (k = 0; k < 3; k++) gt.push(Math.PI * 1.5 + (k + 0.5) * Math.PI / 3);
    var ringGeo = new T.TorusGeometry(0.44, 0.075, 40, 140), WHITE = new T.Color("#FFFFFF"), rings = [], hits = [];
    gt.forEach(function (t, i) {
      var u = (t / (Math.PI * 2)) % 1, p = curve.getPoint(u), tan = curve.getTangent(u);
      var base = new T.Color(COLORS[i]).convertSRGBToLinear();
      var mat = new T.MeshPhysicalMaterial({ color: base.clone(), roughness: 0.22, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, emissive: base.clone(), emissiveIntensity: 0, envMapIntensity: 1.1 });
      var ring = new T.Mesh(ringGeo, mat); ring.position.copy(p); ring.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), tan);
      ring.userData = { i: i, u: u, k: 0, h: 0, base: base }; pivot.add(ring); rings.push(ring);
      var hit = new T.Mesh(new T.SphereGeometry(0.72, 12, 12), new T.MeshBasicMaterial({ visible: false })); hit.position.copy(p); hit.userData = { ring: ring }; pivot.add(hit); hits.push(hit);
    });

    var NP = o.particles || 4200, ppos = new Float32Array(NP * 3), pcol = new Float32Array(NP * 3), off = [], jit = [], spd = [];
    var C1 = new T.Color("#F2450C").convertSRGBToLinear(), C2 = new T.Color("#FF8A4C").convertSRGBToLinear();
    for (i = 0; i < NP; i++) {
      off.push(Math.random()); spd.push(0.85 + Math.random() * 0.3);
      var a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), rr = 0.22 * Math.pow(Math.random(), 0.5);
      jit.push(new T.Vector3(rr * Math.sin(b) * Math.cos(a), rr * Math.sin(b) * Math.sin(a), rr * Math.cos(b)));
      var cc = C1.clone().lerp(C2, Math.random()); pcol[i * 3] = cc.r; pcol[i * 3 + 1] = cc.g; pcol[i * 3 + 2] = cc.b;
    }
    var pgeo = new T.BufferGeometry(); pgeo.setAttribute("position", new T.BufferAttribute(ppos, 3)); pgeo.setAttribute("color", new T.BufferAttribute(pcol, 3));
    var dc = document.createElement("canvas"); dc.width = dc.height = 64; var dx = dc.getContext("2d"); dx.fillStyle = "#fff"; dx.beginPath(); dx.arc(32, 32, 28, 0, Math.PI * 2); dx.fill();
    pivot.add(new T.Points(pgeo, new T.PointsMaterial({ size: 0.08, toneMapped: false, map: new T.CanvasTexture(dc), vertexColors: true, transparent: true, alphaTest: 0.4 })));

    var orb = new T.Mesh(new T.SphereGeometry(0.17, 40, 40), new T.MeshBasicMaterial({ color: 0xff4d12 })); pivot.add(orb);
    orb.add(new T.PointLight(0xff6a2b, 2.4, 3.2, 2));
    var tc = document.createElement("canvas"); tc.width = tc.height = 128;
    var tx = tc.getContext("2d"), gr = tx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,120,60,1)"); gr.addColorStop(0.4, "rgba(255,120,60,0.35)"); gr.addColorStop(1, "rgba(255,120,60,0)"); tx.fillStyle = gr; tx.fillRect(0, 0, 128, 128);
    var halo = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(tc), transparent: true, depthWrite: false })); halo.scale.set(1.8, 1.8, 1); orb.add(halo);

    var W = 1, H = 1;
    function size() {
      W = canvas.clientWidth || 1; H = canvas.clientHeight || 1;
      r.setSize(W, H, false); cam.aspect = W / H;
      var d = Math.max(1.75 / 0.2867, 3.1 / (0.2867 * cam.aspect)); cam.position.set(0, 0, d); cam.updateProjectionMatrix();
    }
    size();
    var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(canvas);

    var m = { x: 0, y: 0, tx: 0, ty: 0, nx: 9, ny: 9, drag: false, lx: 0, spin: 0, spinV: 0, over: false };
    function mv(e) {
      var bb = canvas.getBoundingClientRect(), hb = host.getBoundingClientRect();
      var px = (e.clientX - bb.left) / bb.width, py = (e.clientY - bb.top) / bb.height;
      m.tx = ((e.clientX - hb.left) / hb.width - 0.5) * 2; m.ty = ((e.clientY - hb.top) / hb.height - 0.5) * 2;
      m.nx = px * 2 - 1; m.ny = -(py * 2 - 1); m.sx = e.clientX - hb.left; m.sy = e.clientY - hb.top;
      if (m.drag) { m.spinV = (e.clientX - m.lx) * 0.004; m.spin += m.spinV; m.lx = e.clientX; }
    }
    function down(e) { m.dx0 = e.clientX; m.moved = false; if (hovered || m.over) { m.drag = true; m.lx = e.clientX; } }
    function click(e) { if (Math.abs(e.clientX - (m.dx0 || e.clientX)) > 5) return; if (hovered && o.onPick) o.onPick(hovered.userData.i); }
    function up() { m.drag = false; }
    function leave() { m.tx = 0; m.ty = 0; m.nx = 9; m.ny = 9; m.drag = false; }
    host.addEventListener("mousemove", mv); host.addEventListener("mousedown", down); window.addEventListener("mouseup", up); host.addEventListener("mouseleave", leave); host.addEventListener("click", click);

    var ray = new T.Raycaster(), v2 = new T.Vector2(), tp = new T.Vector3();
    var u0 = 0, hovered = null, lastHover = -1, lastGate = -1, last = performance.now(), visible = true;
    var io = window.IntersectionObserver ? new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }) : null; if (io) io.observe(canvas);
    var LAP = 14;
    function frame(now) {
      if (!alive) return; raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000), t = now / 1000; last = now;
      if (!visible) return;
      m.x += (m.tx - m.x) * 0.05; m.y += (m.ty - m.y) * 0.05;
      if (!m.drag) { m.spinV *= 0.94; m.spin += m.spinV; m.spin *= 0.985; }
      pivot.rotation.set(-0.22 + m.y * 0.16, m.x * 0.3 + m.spin, -0.06);
      if (mode === "auto") u0 = (u0 + dt / LAP) % 1;
      else { var goal = rings[target].userData.u - 0.012, du = goal - u0; du -= Math.floor(du); if (du > 0.5) du -= 1; u0 = (u0 + du * Math.min(1, dt * 3) + 1) % 1; }
      orb.position.copy(curve.getPoint(u0));
      for (var i = 0; i < NP; i++) {
        var uu = (off[i] + t * 0.022 * spd[i]) % 1; curve.getPoint(uu, tp);
        var j = jit[i], w = 1 + 0.25 * Math.sin(t * 2 + i);
        ppos[i * 3] = tp.x + j.x * w; ppos[i * 3 + 1] = tp.y + j.y * w; ppos[i * 3 + 2] = tp.z + j.z * w;
      }
      pgeo.attributes.position.needsUpdate = true;
      hovered = null; m.over = false;
      if (m.nx < 5 && Math.abs(m.nx) <= 1 && Math.abs(m.ny) <= 1) { v2.set(m.nx, m.ny); ray.setFromCamera(v2, cam); var h = ray.intersectObjects(hits)[0]; if (h) hovered = h.object.userData.ring; m.over = !!ray.intersectObject(tube)[0]; }
      canvas.style.cursor = m.drag ? "grabbing" : hovered ? "pointer" : m.over ? "grab" : "";
      var cur = 0, best = 9;
      rings.forEach(function (g) {
        var d = g.userData, du2 = u0 - d.u; du2 -= Math.round(du2);
        if (du2 > -0.02 && du2 < best) { best = du2; cur = d.i; }
        var pass = Math.max(0, 1 - Math.abs(du2) / 0.035), sel = mode === "manual" && d.i === target ? 1 : 0;
        d.k += (Math.max(pass, sel) - d.k) * 0.1; d.h += ((g === hovered ? 1 : 0) - d.h) * 0.15;
        var lit = Math.max(d.k, d.h * 0.8);
        g.material.color.copy(d.base).lerp(WHITE, lit * 0.25); g.material.emissiveIntensity = lit * 0.7;
        g.scale.setScalar(1 + d.k * 0.18 + d.h * 0.12);
      });
      if (tip) {
        if (hovered) {
          var gi = hovered.userData.i, G = GATES[gi] || { n: gi + 1, name: "", line: "" };
          if (lastHover !== gi) { tip.innerHTML = '<div style="display:flex;align-items:center;gap:8px;font-family:Geist Mono,monospace;color:#D8CFC6;font-size:12px;margin-bottom:4px"><span style="width:10px;height:10px;border-radius:50%;background:' + COLORS[gi] + ';box-shadow:0 0 0 2px rgba(255,255,255,0.25)"></span>Gate ' + String(G.n).padStart(2, "0") + " · " + (gi < 5 ? "Before live" : "While live") + '</div><div style="font-weight:500;font-size:15px;margin-bottom:4px">' + G.name + '</div><div style="color:#B3A99F">' + G.line + "</div>"; lastHover = gi; }
          var hw = host.clientWidth; tip.style.opacity = 1; tip.style.transform = "translate(" + Math.min(hw - 260, m.sx + 18) + "px," + (m.sy + 18) + "px)";
        } else { tip.style.opacity = 0; lastHover = -1; }
      }
      r.render(scene, cam);
      if (mode === "auto" && cur !== lastGate) { lastGate = cur; if (o.onGate) o.onGate(cur); }
    }
    raf = requestAnimationFrame(frame);
    return {
      setGate: function (i) { target = Math.max(0, Math.min(7, i)); },
      setMode: function (md) { mode = md; },
      dispose: function () { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); host.removeEventListener("mousemove", mv); host.removeEventListener("mousedown", down); window.removeEventListener("mouseup", up); host.removeEventListener("mouseleave", leave); host.removeEventListener("click", click); r.dispose(); }
    };
  }
  function createWarmGradient(canvas) {
    if (!canvas) return null;
    var x = canvas.getContext("2d"), W = (canvas.width = 320), H = (canvas.height = 210), alive = true, raf = 0;
    var B = [
      { c: "255,106,43", x: 0.8, y: 0.32, r: 0.5, s: 0.23, p: 0 }, { c: "255,150,95", x: 0.6, y: 0.8, r: 0.45, s: 0.17, p: 2 },
      { c: "255,214,190", x: 0.2, y: 0.2, r: 0.55, s: 0.13, p: 4 }, { c: "248,188,212", x: 0.98, y: 0.9, r: 0.42, s: 0.19, p: 1 },
      { c: "255,236,218", x: 0.25, y: 0.85, r: 0.5, s: 0.11, p: 3 }
    ];
    function f(now) {
      if (!alive) return; raf = requestAnimationFrame(f); var t = now / 1000;
      x.fillStyle = "#FBF6F0"; x.fillRect(0, 0, W, H);
      B.forEach(function (b) {
        var cx = (b.x + Math.sin(t * b.s + b.p) * 0.14) * W, cy = (b.y + Math.cos(t * b.s * 1.3 + b.p) * 0.16) * H, rad = b.r * W;
        var g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, "rgba(" + b.c + ",0.85)"); g.addColorStop(1, "rgba(" + b.c + ",0)");
        x.fillStyle = g; x.fillRect(0, 0, W, H);
      });
    }
    raf = requestAnimationFrame(f);
    return { dispose: function () { alive = false; cancelAnimationFrame(raf); } };
  }

  /* Particle text: the number you do not trust, drawn in 3D. createParticleText(canvas, { host }) -> { setText, dispose } */
  function createParticleText(canvas, o) {
    var T = window.THREE; if (!T || !canvas) return null; o = o || {};
    var host = o.host || canvas.parentElement, alive = true, raf = 0;
    var r = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0x000000, 0);
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, 0.1, 100); cam.position.set(0, 0, 13);
    r.outputEncoding = T.sRGBEncoding; scene.background = new T.Color(o.background || "#17110D").convertSRGBToLinear();
    var group = new T.Group(); scene.add(group);
    var N = o.count || 8000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N * 3), tgt = new Float32Array(N * 3), amb = new Float32Array(N * 3), isText = new Uint8Array(N);
    var GC = ["#EE8A2A", "#5AA84B", "#139E90", "#3A8BCB", "#7B3F95", "#BE1E5C", "#77716B", "#DC3B2E"], OR = ["#FF6A2B", "#FF8A4C", "#FFB286", "#F2450C", "#FFD2B5"];
    for (var i = 0; i < N; i++) {
      var a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), rr = 4 + Math.random() * 5;
      amb[i * 3] = rr * Math.sin(b) * Math.cos(a) * 1.4; amb[i * 3 + 1] = rr * Math.sin(b) * Math.sin(a) * 0.7; amb[i * 3 + 2] = rr * Math.cos(b) * 0.8 - 2;
      pos[i * 3] = amb[i * 3]; pos[i * 3 + 1] = amb[i * 3 + 1]; pos[i * 3 + 2] = amb[i * 3 + 2];
      var c = new T.Color(Math.random() < 0.08 ? GC[(Math.random() * 8) | 0] : OR[(Math.random() * OR.length) | 0]);
      c.convertSRGBToLinear(); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    var geo = new T.BufferGeometry(); geo.setAttribute("position", new T.BufferAttribute(pos, 3)); geo.setAttribute("color", new T.BufferAttribute(col, 3));
    var dc = document.createElement("canvas"); dc.width = dc.height = 64; var dx = dc.getContext("2d"), g = dx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,0.9)"); g.addColorStop(1, "rgba(255,255,255,0)"); dx.fillStyle = g; dx.fillRect(0, 0, 64, 64);
    var mat = new T.PointsMaterial({ size: 0.15, toneMapped: false, map: new T.CanvasTexture(dc), vertexColors: true, transparent: true, depthWrite: false, blending: T.AdditiveBlending });
    group.add(new T.Points(geo, mat));
    var WW = 8, HH = 3, YS = 0, lastText = null;
    var off = document.createElement("canvas"); off.width = 1100; off.height = 420; var ox = off.getContext("2d");
    function wrapLines(words, n) {
      if (n === 1) return [words.join(" ")];
      var best = null, bw = 1e9;
      function rec(start, left, acc) {
        if (left === 1) { var l = acc.concat([words.slice(start).join(" ")]), w = Math.max.apply(null, l.map(function (x) { return ox.measureText(x).width; })); if (w < bw) { bw = w; best = l; } return; }
        for (var k = start + 1; k <= words.length - left + 1; k++) rec(k, left - 1, acc.concat([words.slice(start, k).join(" ")]));
      }
      rec(0, n, []); return best;
    }
    function sample(text) {
      ox.clearRect(0, 0, off.width, off.height); ox.fillStyle = "#fff"; ox.textAlign = "center"; ox.textBaseline = "middle";
      off.height = Math.max(120, Math.round(off.width * HH / WW));
      ox.clearRect(0, 0, off.width, off.height); ox.fillStyle = "#fff"; ox.textAlign = "center"; ox.textBaseline = "middle";
      var words = String(text).trim().split(/\s+/), base = 100, lines = null, size = 0;
      ox.font = "600 " + base + "px Geist, system-ui, sans-serif";
      for (var n = 1; n <= Math.min(3, words.length); n++) {
        var ls = wrapLines(words, n), mw = Math.max.apply(null, ls.map(function (x) { return ox.measureText(x).width; }));
        var sz = Math.min(base * off.width / mw, off.height / (n * 1.08));
        if (sz > size * 1.06) { size = sz; lines = ls; }
      }
      size = Math.min(size, off.height * 0.62); ox.font = "600 " + size + "px Geist, system-ui, sans-serif";
      lines.forEach(function (l, li) { ox.fillText(l, off.width / 2, off.height / 2 + (li - (lines.length - 1) / 2) * size * 1.02); });
      var d = ox.getImageData(0, 0, off.width, off.height).data, pts = [], budget = Math.floor(N * 0.85);
      for (var step = 3; step <= 9; step++) {
        pts = [];
        for (var yy = 0; yy < off.height; yy += step) for (var xx = 0; xx < off.width; xx += step) if (d[(yy * off.width + xx) * 4 + 3] > 128) pts.push([(xx / off.width - 0.5) * WW, -(yy / off.height - 0.5) * HH + YS]);
        if (pts.length <= budget) break;
      }
      for (var q = pts.length - 1; q > 0; q--) { var j = (Math.random() * (q + 1)) | 0, t = pts[q]; pts[q] = pts[j]; pts[j] = t; }
      return pts;
    }
    function setText(text) {
      lastText = text;
      var pts = text ? sample(text) : [], n = Math.min(pts.length, Math.floor(N * 0.85));
      for (var i = 0; i < N; i++) {
        if (i < n) { tgt[i * 3] = pts[i][0]; tgt[i * 3 + 1] = pts[i][1]; tgt[i * 3 + 2] = (Math.random() - 0.5) * 0.35; isText[i] = 1; }
        else { tgt[i * 3] = amb[i * 3]; tgt[i * 3 + 1] = amb[i * 3 + 1]; tgt[i * 3 + 2] = amb[i * 3 + 2]; isText[i] = 0; }
        vel[i * 3] += (Math.random() - 0.5) * 0.25; vel[i * 3 + 1] += (Math.random() - 0.5) * 0.25; vel[i * 3 + 2] += (Math.random() - 0.5) * 0.4;
      }
    }
    function size() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1; r.setSize(w, h, false); cam.aspect = w / h; cam.position.z = 12; cam.updateProjectionMatrix();
      var vh = 2 * Math.tan(T.MathUtils.degToRad(cam.fov / 2)) * cam.position.z, vw = vh * cam.aspect;
      var nw = vw * 0.78, nh = vh * 0.44, ny = vh * 0.1;
      if (Math.abs(nw - WW) > 0.01 || Math.abs(nh - HH) > 0.01) { WW = nw; HH = nh; YS = ny; if (lastText) setText(lastText); }
    }
    size(); var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if (ro) ro.observe(canvas);
    var m = { x: 0, y: 0, tx: 0, ty: 0, wx: 99, wy: 99, on: false }, ray = new T.Raycaster(), v2 = new T.Vector2(), plane = new T.Plane(new T.Vector3(0, 0, 1), 0), hit = new T.Vector3(), inv = new T.Matrix4();
    function mv(e) { var b = canvas.getBoundingClientRect(); var px = (e.clientX - b.left) / b.width, py = (e.clientY - b.top) / b.height; m.tx = (px - 0.5) * 2; m.ty = (py - 0.5) * 2; v2.set(px * 2 - 1, -(py * 2 - 1)); m.on = px >= 0 && px <= 1 && py >= 0 && py <= 1; }
    function lv() { m.tx = 0; m.ty = 0; m.on = false; }
    host.addEventListener("mousemove", mv); host.addEventListener("mouseleave", lv);
    var visible = true, io = window.IntersectionObserver ? new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }) : null; if (io) io.observe(canvas);
    function frame(now) {
      if (!alive) return; raf = requestAnimationFrame(frame); if (!visible) return;
      var t = now / 1000; m.x += (m.tx - m.x) * 0.05; m.y += (m.ty - m.y) * 0.05;
      group.rotation.y = m.x * 0.38 + Math.sin(t * 0.3) * 0.06; group.rotation.x = m.y * 0.22 + Math.cos(t * 0.25) * 0.03;
      group.updateMatrixWorld(); var lx = 99, ly = 99;
      if (m.on) { ray.setFromCamera(v2, cam); if (ray.ray.intersectPlane(plane, hit)) { inv.copy(group.matrixWorld).invert(); hit.applyMatrix4(inv); lx = hit.x; ly = hit.y; } }
      for (var i = 0; i < N; i++) {
        var k = i * 3, px = pos[k], py = pos[k + 1], pz = pos[k + 2], tx = tgt[k], ty = tgt[k + 1], tz = tgt[k + 2];
        if (!isText[i]) { tx += Math.sin(t * 0.2 + i) * 0.6; ty += Math.cos(t * 0.17 + i * 1.3) * 0.4; }
        else { tz += Math.sin(t * 1.4 + px * 0.9) * 0.12; }
        var s = isText[i] ? 0.055 : 0.01;
        vel[k] += (tx - px) * s; vel[k + 1] += (ty - py) * s; vel[k + 2] += (tz - pz) * s;
        var ddx = px - lx, ddy = py - ly, d2 = ddx * ddx + ddy * ddy;
        if (d2 < 1.1) { var d = Math.sqrt(d2) || 0.01, f = (1 - d / 1.05) * 0.09; vel[k] += ddx / d * f; vel[k + 1] += ddy / d * f; vel[k + 2] += f * 1.6; }
        vel[k] *= 0.86; vel[k + 1] *= 0.86; vel[k + 2] *= 0.86;
        pos[k] = px + vel[k]; pos[k + 1] = py + vel[k + 1]; pos[k + 2] = pz + vel[k + 2];
      }
      geo.attributes.position.needsUpdate = true; r.render(scene, cam);
    }
    raf = requestAnimationFrame(frame);
    return { setText: setText, dispose: function () { alive = false; cancelAnimationFrame(raf); if (ro) ro.disconnect(); if (io) io.disconnect(); host.removeEventListener("mousemove", mv); host.removeEventListener("mouseleave", lv); r.dispose(); } };
  }
  window.createParticleText = createParticleText;
  window.createEightScene = createEightScene;
  window.createWarmGradient = createWarmGradient;
})();
