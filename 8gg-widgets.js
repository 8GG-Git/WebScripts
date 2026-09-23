/* 8GG interactive widgets for Webflow.
   Load order (site footer): three.js r128 -> 8gg-data.js -> 8gg-scene.js -> 8gg-widgets.js
   Every widget mounts on an element with data-8gg="<name>". See docs/06-embeds.md. */
(function () {
  "use strict";
  var D = window.SITE_DATA; if (!D) { console.warn("8GG: 8gg-data.js not loaded"); return; }
  var GC = D.GATE_COLORS, G = D.GATES;
  var RM = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hexA(h, a) { var n = parseInt(h.slice(1), 16); return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
  var STATUS = { delivered: ["rgba(90,168,75,0.14)", "#2F7A2A", "#9BD68E"], built: ["rgba(58,139,203,0.14)", "#1F639C", "#9CC8EE"], designed: ["rgba(214,150,30,0.16)", "#8A5A00", "#F0C36B"], committed: ["rgba(255,106,43,0.14)", "#C2410C", "#FF9A66"], pending: ["rgba(20,17,14,0.06)", "#5E5750", "#CFC6BC"] };
  function chip(s, dark) { if (!s) return ""; var k = D.statusKind(s), v = STATUS[k]; return '<span class="g8-chip" style="background:' + (dark && k === "pending" ? "rgba(255,255,255,0.08)" : v[0]) + ";color:" + (dark ? v[2] : v[1]) + '"><i></i>' + esc(s) + "</span>"; }

  var css = [
    ".g8-chip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:500;line-height:1.3}",
    ".g8-chip i{width:6px;height:6px;border-radius:50%;background:currentColor;flex:0 0 6px}",
    ".g8-pill{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;font-size:12.5px;transition:all .3s ease;white-space:nowrap}",
    ".g8-btn{font:inherit;cursor:pointer;padding:9px 16px;border-radius:999px;font-size:14px;transition:all .15s ease}",
    ".g8-tip{position:absolute;left:0;top:0;z-index:5;opacity:0;pointer-events:none;transition:opacity .2s ease;padding:12px 14px;border-radius:16px;background:rgba(20,17,14,.92);color:#F4EFE8;width:240px;font-size:13px;line-height:1.45;box-shadow:0 20px 40px -16px rgba(20,17,14,.5)}",
    ".g8-mono{font-family:'Geist Mono',ui-monospace,monospace}",
    "@keyframes g8prog{from{width:0}to{width:100%}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var mounts = {};
  function mount(name, fn) { $$('[data-8gg="' + name + '"]').forEach(function (el) { if (el.__g8) return; el.__g8 = true; try { fn(el); } catch (e) { console.error("8GG widget " + name, e); } }); }

  /* ---------- warm moving gradient (hero / contact backgrounds) ---------- */
  mounts.gradient = function (el) {
    var cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true");
    cv.style.cssText = "position:absolute;inset:-60px;width:calc(100% + 120px);height:calc(100% + 120px);display:block;filter:blur(40px);pointer-events:none";
    el.appendChild(cv); if (!RM) window.createWarmGradient(cv);
  };

  /* ---------- hero 3D 8 (auto loop) + phase chips ---------- */
  mounts["hero-8"] = function (el) {
    var host = el.closest("section") || el.parentElement; host.style.position = host.style.position || "relative";
    var tip = document.createElement("div"); tip.className = "g8-tip"; host.appendChild(tip);
    el.innerHTML = '<canvas aria-label="The 8 Governed Gates as a figure of eight" style="width:100%;height:' + (el.getAttribute("data-height") || "clamp(260px,26vw,360px)") + ';display:block"></canvas>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:-8px">' +
      '<span class="g8-pill" data-ph="1" style="border:1px solid rgba(255,255,255,.9)"><span class="g8-mono">1 to 5</span>Before live</span>' +
      '<span class="g8-pill" style="background:rgba(255,255,255,.82);border:1px solid rgba(255,255,255,.95);color:#4A433C;font-size:13px"><span data-dot style="width:10px;height:10px;border-radius:50%"></span><span data-num class="g8-mono" style="font-variant-numeric:tabular-nums"></span><span data-name style="font-weight:500;color:#14110E"></span></span>' +
      '<span class="g8-pill" data-ph="2" style="border:1px solid rgba(255,255,255,.9)">While live<span class="g8-mono">6 to 8</span></span></div>';
    function setGate(i) {
      $("[data-dot]", el).style.background = GC[i]; var n = $("[data-num]", el); n.textContent = "Gate " + pad(i + 1); n.style.color = GC[i]; $("[data-name]", el).textContent = G[i].name;
      [["1", i < 5], ["2", i >= 5]].forEach(function (p) { var c = $('[data-ph="' + p[0] + '"]', el); c.style.background = p[1] ? "rgba(255,106,43,.14)" : "rgba(255,255,255,.55)"; c.style.color = p[1] ? "#C2410C" : "#7A7068"; });
    }
    setGate(0);
    window.createEightScene($("canvas", el), { host: host, tip: tip, colors: GC, gates: G, mode: "auto", onGate: setGate });
  };

  /* ---------- live register card with owners being named + mini Double Lock ---------- */
  mounts.register = function (el) {
    var ROWS = [["01", "A membership body held 143 data issues in four trackers across three systems. None had an owner.", "Data Owner, Membership"], ["02", "A renewable generator had 2,321 report measures across seven reporting models, because nobody owned the definitions.", "Measure owner, Finance"], ["03", "A housing association had a well written, board approved data strategy. Twelve months on, nobody operated it.", "Strategy owner, Executive"], ["04", "An energy group's privacy assessments assigned actions to teams. Actions owned by a team did not close.", "Named role per action"], ["05", "A European energy business had 51 AI ideas raised across eight functions, with no single owner.", "AI Model Owner"]];
    el.innerHTML = '<div data-card style="transform:perspective(1400px) rotateY(-5deg) rotateX(3deg);transition:transform .25s cubic-bezier(.2,0,0,1);padding:10px;border-radius:32px;background:rgba(255,255,255,.4);border:1px solid rgba(255,255,255,.85);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);box-shadow:0 50px 100px -40px rgba(140,60,20,.35)"><div style="border-radius:24px;background:rgba(255,255,255,.86);overflow:hidden">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid rgba(20,17,14,.06)"><div style="font-size:14.5px;font-weight:500">What we found in recent work</div><div class="g8-mono" style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#E2531C;background:rgba(255,106,43,.1);padding:5px 10px;border-radius:999px;white-space:nowrap"><span style="width:6px;height:6px;border-radius:50%;background:#FF6A2B"></span><span data-count>0</span> of 5 owned</div></div>' +
      ROWS.map(function (r) { return '<div data-row style="display:grid;grid-template-columns:26px minmax(0,1fr) minmax(110px,140px);gap:12px;padding:12px 20px;border-bottom:1px solid rgba(20,17,14,.05);transition:background .4s ease"><span class="g8-mono" style="font-size:12px;color:#9A8F84;padding-top:2px">' + r[0] + '</span><span style="font-size:13.5px;line-height:1.45;color:#2A241F">' + esc(r[1]) + '</span><span data-owner style="display:flex;align-items:flex-start;gap:8px;font-size:12.5px;line-height:1.35;transition:color .3s ease"><span data-dot style="flex:0 0 auto;width:14px;height:14px;margin-top:1px;border-radius:50%;border:1.5px solid #CFC6BC;transition:all .3s ease"></span><span data-txt>None named</span></span></div>'; }).join("") +
      '</div></div><a href="#lock" style="margin-top:12px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px 12px 18px;border-radius:24px;background:rgba(20,17,14,.93);color:#F4EFE8;text-decoration:none;box-shadow:0 30px 60px -24px rgba(20,17,14,.55)"><div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:14px;font-weight:500">The Double Lock</span><span data-lock class="g8-mono" style="font-size:12px;color:#FF9A66">Awaiting</span></div><div style="display:flex;gap:8px;flex:0 1 320px"><div data-s1 style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:14px;transition:background .3s ease;font-size:12px"><span style="width:8px;height:8px;border-radius:50%;background:currentColor;color:#5E5249"></span>Process owner</div><div data-s2 style="flex:1;display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:14px;transition:background .3s ease;font-size:12px"><span style="width:8px;height:8px;border-radius:50%;background:currentColor;color:#5E5249"></span>Data owner</div></div></a>';
    var step = 0, rows = $$("[data-row]", el);
    function draw() {
      var owned = Math.min(step, 5); $("[data-count]", el).textContent = owned;
      rows.forEach(function (row, i) { var on = i < owned, o = $("[data-owner]", row), d = $("[data-dot]", row); row.style.background = on ? "rgba(255,106,43,.05)" : "transparent"; o.style.color = on ? "#14110E" : "#9A8F84"; o.style.fontWeight = on ? 500 : 400; d.style.borderColor = on ? "#FF6A2B" : "#CFC6BC"; d.style.background = on ? "#FF6A2B" : "transparent"; $("[data-txt]", row).textContent = on ? ROWS[i][2] : "None named"; });
      $("[data-lock]", el).textContent = owned >= 4 ? "2 of 2 signed" : owned >= 2 ? "1 of 2 signed" : "Awaiting";
      [["[data-s1]", owned >= 2], ["[data-s2]", owned >= 4]].forEach(function (p) { var e = $(p[0], el); e.style.background = p[1] ? "rgba(255,106,43,.22)" : "rgba(255,255,255,.06)"; $("span", e).style.color = p[1] ? "#FF6A2B" : "#5E5249"; });
    }
    draw(); if (!RM) setInterval(function () { step = (step + 1) % 8; draw(); }, 1500); else { step = 5; draw(); }
    var card = $("[data-card]", el), host = el.closest("section") || el;
    host.addEventListener("mousemove", function (e) { var b = host.getBoundingClientRect(), px = (e.clientX - b.left) / b.width - .5, py = (e.clientY - b.top) / b.height - .5; card.style.transform = "perspective(1400px) rotateY(" + (px * -9) + "deg) rotateX(" + (py * 6) + "deg)"; });
    host.addEventListener("mouseleave", function () { card.style.transform = "perspective(1400px) rotateY(-5deg) rotateX(3deg)"; });
  };

  /* ---------- gates section: sticky 3D 8 synced to native gate cards [data-gate-card="1..8"] ---------- */
  mounts["gates-8"] = function (el) {
    var sec = el.closest("section") || document;
    el.style.position = el.style.position || "relative";
    el.innerHTML = '<div class="g8-tip"></div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:20px 22px 0"><div style="display:flex;align-items:center;gap:10px"><span data-dot style="width:12px;height:12px;border-radius:50%;transition:background .3s ease"></span><span data-num class="g8-mono" style="font-size:13px;transition:color .3s ease"></span><span data-name style="font-size:15px;font-weight:500"></span></div><span data-phase style="font-size:12.5px;color:#7A7068"></span></div>' +
      '<canvas style="flex:1;width:100%;min-height:0;display:block"></canvas>' +
      '<div style="padding:0 22px 20px;display:flex;flex-direction:column;gap:10px"><div style="display:grid;grid-template-columns:5fr 3fr;gap:8px"><div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:12px;color:#7A7068">Before live: gates 1 to 5</span><div style="height:4px;border-radius:4px;background:rgba(20,17,14,.08);overflow:hidden"><div data-r1 style="height:100%;background:linear-gradient(90deg,#EE8A2A,#7B3F95);transition:width .4s ease"></div></div></div><div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:12px;color:#7A7068">While live: gates 6 to 8</span><div style="height:4px;border-radius:4px;background:rgba(20,17,14,.08);overflow:hidden"><div data-r2 style="height:100%;background:linear-gradient(90deg,#BE1E5C,#DC3B2E);transition:width .4s ease"></div></div></div></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:12px;color:#9A8F84">Click a ring or a card to move to that gate. Drag the 8 to turn it.</span><div style="display:flex;gap:6px"><button data-prev class="g8-btn" aria-label="Previous gate" style="width:36px;height:36px;padding:0;border:1px solid rgba(20,17,14,.12);background:#FFF">&larr;</button><button data-next class="g8-btn" aria-label="Next gate" style="width:36px;height:36px;padding:0;border:0;background:#14110E;color:#FFF">&rarr;</button></div></div></div>';
    el.style.display = "flex"; el.style.flexDirection = "column"; el.style.overflow = "hidden";
    var cards = $$("[data-gate-card]", sec).sort(function (a, b) { return +a.getAttribute("data-gate-card") - +b.getAttribute("data-gate-card"); });
    var cur = -1, lockUntil = 0;
    var scene = window.createEightScene($("canvas", el), { host: el, tip: $(".g8-tip", el), colors: GC, gates: G, mode: "manual", particles: 3200, onPick: function (i) { pick(i, true); } });
    function set(i) {
      if (i === cur) return; cur = i; if (scene) scene.setGate(i);
      $("[data-dot]", el).style.background = GC[i]; var n = $("[data-num]", el); n.textContent = "Gate " + pad(i + 1); n.style.color = GC[i];
      $("[data-name]", el).textContent = G[i].name; $("[data-phase]", el).textContent = i < 5 ? "Before live" : "While live";
      $("[data-r1]", el).style.width = Math.min(1, (i + 1) / 5) * 100 + "%"; $("[data-r2]", el).style.width = Math.max(0, (i - 4) / 3) * 100 + "%";
      cards.forEach(function (c, k) { var on = k === i, col = GC[k]; c.style.transition = "all .3s cubic-bezier(.2,0,0,1)"; c.style.background = on ? "#FFF" : "rgba(255,255,255,.45)"; c.style.borderColor = on ? col : "rgba(20,17,14,.06)"; c.style.boxShadow = on ? "0 30px 60px -30px " + hexA(col, .45) : "none"; c.setAttribute("aria-pressed", on); });
    }
    function sideBySide() { return cards[0] && el.getBoundingClientRect().left !== cards[0].getBoundingClientRect().left; }
    function pick(i, scroll) {
      i = Math.max(0, Math.min(7, i)); set(i);
      if (scroll && cards[i] && sideBySide()) { var r = cards[i].getBoundingClientRect(); lockUntil = performance.now() + 900; window.scrollTo({ top: window.scrollY + r.top + r.height / 2 - window.innerHeight * .45, behavior: "smooth" }); }
    }
    cards.forEach(function (c, k) {
      c.setAttribute("role", "button"); c.setAttribute("tabindex", "0"); c.style.cursor = "pointer"; c.style.borderStyle = "solid"; c.style.borderWidth = c.style.borderWidth || "1.5px";
      var col = GC[k]; $$("[data-gate-colour]", c).forEach(function (x) { x.style[x.getAttribute("data-gate-colour") || "background"] = col; });
      c.addEventListener("click", function () { pick(k, true); });
      c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(k, true); } });
    });
    $("[data-prev]", el).addEventListener("click", function () { pick(cur - 1, true); });
    $("[data-next]", el).addEventListener("click", function () { pick(cur + 1, true); });
    function onScroll() {
      if (performance.now() < lockUntil || !cards.length) return; var mid = window.innerHeight * .45, best = 0, bd = 1e9;
      cards.forEach(function (c, k) { var r = c.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; best = k; } }); set(best);
    }
    window.addEventListener("scroll", onScroll, { passive: true }); set(0); onScroll();
  };

  /* ---------- Double Lock sandbox ---------- */
  mounts["double-lock"] = function (el) {
    var A = null, B = null;
    function lock(id) { return '<svg viewBox="0 0 120 132" style="width:84px;height:94px;overflow:visible"><path data-sh="' + id + '" d="M30 62 V40 a30 30 0 0 1 60 0 V62" style="fill:none;stroke:#F4EFE8;stroke-width:7;stroke-linecap:round;transform-box:fill-box;transform-origin:85% 100%;transition:transform .45s cubic-bezier(.2,0,0,1)"></path><rect data-bd="' + id + '" x="14" y="58" width="92" height="72" rx="18" style="fill:#4A423B;transition:fill .3s ease"></rect><circle cx="60" cy="88" r="8" fill="#14110E"></circle><rect x="57" y="92" width="6" height="18" rx="3" fill="#14110E"></rect></svg>'; }
    function signer(n, role, q, path, opts) { return '<div data-signer="' + n + '" style="border-radius:22px;padding:18px 20px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;gap:10px;transition:opacity .25s ease"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-end;flex-wrap:wrap"><div style="display:flex;flex-direction:column;gap:4px"><span style="font-size:12px;color:#8A8077">Signature ' + (n === "a" ? "one" : "two") + '</span><span style="font-size:18px;font-weight:500">' + role + '</span><span style="font-size:14px;color:#A39A90">' + q + '</span></div><svg viewBox="0 0 140 32" style="width:140px;height:32px;border-bottom:1px solid rgba(255,255,255,.15)"><path data-sig="' + n + '" d="' + path + '" style="fill:none;stroke:#FF9A66;stroke-width:2;stroke-linecap:round;stroke-dasharray:260;stroke-dashoffset:260;transition:stroke-dashoffset .9s ease"></path></svg></div><div style="display:flex;gap:8px;flex-wrap:wrap">' + opts.map(function (o) { return '<button class="g8-btn" data-' + n + '="' + o[0] + '" aria-pressed="false" style="border:1px solid rgba(255,255,255,.2);background:transparent;color:#F4EFE8">' + o[1] + "</button>"; }).join("") + "</div></div>"; }
    el.innerHTML = '<div style="border-radius:32px;padding:clamp(20px,3vw,32px);background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);display:flex;flex-direction:column;gap:22px;color:#F4EFE8">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><span style="font-size:13.5px;color:#A39A90">Decision route</span><span data-chip></span></div>' +
      '<div aria-hidden="true" style="display:flex;align-items:center;justify-content:center;gap:18px;padding:8px 0">' + lock("a") + '<span data-link style="width:48px;height:2px;border-radius:2px;background:rgba(255,255,255,.15);transition:background .3s ease"></span>' + lock("b") + "</div>" +
      '<div aria-live="polite" style="text-align:center;display:flex;flex-direction:column;gap:6px"><div data-v style="font-size:26px;font-weight:500;letter-spacing:-.02em"></div><div data-sub style="font-size:15px;color:#A39A90;min-height:1.5em"></div></div>' +
      '<div style="display:flex;flex-direction:column;gap:12px">' + signer("a", "Business Process Owner", "Does the use add value, and is it necessary?", "M4 22 C 16 4, 24 28, 36 16 S 54 6, 60 20 S 78 28, 90 12 S 112 18, 136 14", [["yes", "Adds value"], ["no", "Does not"]]) + signer("b", "Data Owner or AI Model Owner", "Is the use acceptable on quality, sensitivity and risk?", "M4 18 C 14 26, 22 6, 32 18 S 46 26, 58 12 S 80 8, 88 22 S 118 10, 136 18", [["ok", "Approve"], ["cond", "Approve with conditions"], ["no", "Reject"]]) + "</div>" +
      '<button data-reset style="align-self:flex-start;background:none;border:0;padding:4px 0;font:inherit;font-size:13.5px;color:#A39A90;text-decoration:underline;text-underline-offset:3px;cursor:pointer">Start again</button></div>';
    function draw() {
      var v = "Locked", sub = "No use proceeds without a clear business purpose.", c = ["Awaiting first signature", "pending"];
      if (A === "no") { v = "It stops."; sub = "The Business Process Owner found no value or need. The use does not proceed."; c = ["Stopped at signature one", "committed"]; }
      else if (A === "yes" && B === null) { v = "One of two signed"; sub = "Now the Data Owner or AI Model Owner decides on quality, sensitivity and risk."; c = ["Awaiting second signature", "designed"]; }
      else if (B === "ok") { v = "Approved"; sub = "Two signatures on one decision. The use may go live."; c = ["Both signatures", "delivered"]; }
      else if (B === "cond") { v = "Approved with conditions"; sub = "The use proceeds, with conditions set by the person who owns the data."; c = ["Both signatures, conditions", "designed"]; }
      else if (B === "no") { v = "Rejected"; sub = "The Data Owner rejected the use on quality, sensitivity or risk. There is no committee override."; c = ["Rejected at signature two", "committed"]; }
      $("[data-v]", el).textContent = v; $("[data-sub]", el).textContent = sub; $("[data-chip]", el).innerHTML = chip(c[0], true).replace(D.statusKind(c[0]) ? "" : "", "");
      var cc = $("[data-chip] .g8-chip", el), sv = STATUS[c[1]]; cc.style.background = c[1] === "pending" ? "rgba(255,255,255,.08)" : sv[0]; cc.style.color = sv[2];
      var OPEN = "translateY(-14px) rotate(-22deg)";
      $('[data-sh="a"]', el).style.transform = A === "yes" ? OPEN : "none"; $('[data-sh="b"]', el).style.transform = B === "ok" || B === "cond" ? OPEN : "none";
      $('[data-bd="a"]', el).style.fill = A === "yes" ? "#5AA84B" : A === "no" ? "#DC3B2E" : "#4A423B";
      $('[data-bd="b"]', el).style.fill = B === "ok" ? "#5AA84B" : B === "cond" ? "#D6961E" : B === "no" ? "#DC3B2E" : "#4A423B";
      $("[data-link]", el).style.background = A === "yes" ? "#5AA84B" : "rgba(255,255,255,.15)";
      $('[data-sig="a"]', el).style.strokeDashoffset = A === "yes" ? 0 : 260; $('[data-sig="b"]', el).style.strokeDashoffset = B === "ok" || B === "cond" ? 0 : 260;
      var sb = $('[data-signer="b"]', el); sb.style.opacity = A === "yes" ? 1 : .4; sb.style.pointerEvents = A === "yes" ? "auto" : "none";
      $$("[data-a]", el).forEach(function (b) { var on = b.getAttribute("data-a") === A; b.setAttribute("aria-pressed", on); b.style.background = on ? "#F4EFE8" : "transparent"; b.style.color = on ? "#14110E" : "#F4EFE8"; });
      $$("[data-b]", el).forEach(function (b) { var on = b.getAttribute("data-b") === B; b.setAttribute("aria-pressed", on); b.style.background = on ? "#F4EFE8" : "transparent"; b.style.color = on ? "#14110E" : "#F4EFE8"; });
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.hasAttribute("data-a")) { A = b.getAttribute("data-a"); B = null; } else if (b.hasAttribute("data-b")) { if (A === "yes") B = b.getAttribute("data-b"); } else if (b.hasAttribute("data-reset")) { A = null; B = null; }
      draw();
    });
    draw();
  };

  /* ---------- diagnostic (needs assessment) ---------- */
  mounts.diagnostic = function (el) {
    var contact = el.getAttribute("data-contact-url") || "/contact", servicesUrl = el.getAttribute("data-services-url") || "#services";
    var QG = [[0, 4], [0, 7], [2, 4], [3, 5], [1, 6]], START = ["B1", "B2", "B6", "B5", "B4", "B5", "B7", "B1"];
    var SEC = ["Energy and renewables", "Insurance and reinsurance", "Social housing", "Professional and membership bodies", "Other"], SIZE = ["Under 100", "100 to 500", "500 to 2,000", "Over 2,000"], AI = ["Yes, in use", "Being asked for", "Not yet"];
    var st = { sector: null, size: null, ai: null, ans: [null, null, null, null, null] };
    var SVC = {}; D.SERVICES.forEach(function (s) { SVC[s.id] = s; });
    function opts(key, list) { return '<div style="display:flex;flex-wrap:wrap;gap:6px">' + list.map(function (l, i) { return '<button class="g8-btn" data-opt="' + key + '" data-i="' + i + '" style="font-size:13.5px;padding:9px 14px">' + esc(l) + "</button>"; }).join("") + "</div>"; }
    el.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:clamp(24px,4vw,56px);align-items:start">' +
      '<div style="display:flex;flex-direction:column;gap:12px">' +
      '<div style="padding:clamp(20px,2.6vw,28px);border-radius:28px;background:#FFF;border:1px solid rgba(20,17,14,.06);display:flex;flex-direction:column;gap:20px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><span style="font-size:15px;font-weight:500">Step 1. About your organisation</span><span data-ctx class="g8-mono" style="font-size:12px;color:#9A8F84"></span></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><span style="font-size:13px;color:#7A7068">Sector</span>' + opts("sector", SEC) + '</div><div style="display:flex;flex-direction:column;gap:8px"><span style="font-size:13px;color:#7A7068">People in the organisation</span>' + opts("size", SIZE) + '</div><div style="display:flex;flex-direction:column;gap:8px"><span style="font-size:13px;color:#7A7068">Is AI already in use, or being asked for?</span>' + opts("ai", AI) + "</div></div>" +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:8px 4px 0"><span style="font-size:15px;font-weight:500">Step 2. The five questions</span><span data-done class="g8-mono" style="font-size:12px;color:#9A8F84"></span></div>' +
      D.QUESTIONS.map(function (q, i) { return '<div data-q="' + i + '" style="padding:clamp(20px,2.6vw,28px);border-radius:28px;background:#FFF;border:1.5px solid rgba(20,17,14,.06);display:flex;flex-direction:column;gap:16px;transition:border-color .25s ease"><div style="display:flex;gap:14px"><span class="g8-mono" style="font-size:13px;color:#9A8F84;padding-top:3px">' + pad(i + 1) + '</span><p style="margin:0;font-size:clamp(17px,1.5vw,20px);line-height:1.45;letter-spacing:-.01em">&ldquo;' + esc(q) + '&rdquo;</p></div><div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-left:34px"><div style="display:flex;gap:8px"><button class="g8-btn" data-ans="1" style="font-weight:500;font-size:14.5px;padding:10px 18px">' + esc(D.Q_YES[i] || "Yes") + '</button><button class="g8-btn" data-ans="0" style="font-weight:500;font-size:14.5px;padding:10px 18px">' + (i === 1 ? "Not all" : "No") + '</button></div><div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap"><span style="font-size:12px;color:#9A8F84;margin-right:4px">Tests</span>' + QG[i].map(function (g) { return '<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 5px;border-radius:999px;background:' + hexA(GC[g], .12) + ";color:" + GC[g] + ';font-size:12px;font-weight:500"><span style="width:8px;height:8px;border-radius:50%;background:' + GC[g] + '"></span>' + esc(G[g].name) + "</span>"; }).join("") + "</div></div></div>"; }).join("") +
      '<p style="margin:6px 0 0;font-size:13px;color:#9A8F84">Questions quoted verbatim from The Governance Gap.</p></div>' +
      '<div data-panel style="position:sticky;top:100px;padding:clamp(22px,3vw,32px);border-radius:32px;background:#14110E;color:#F4EFE8;display:flex;flex-direction:column;gap:22px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px"><div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;color:#A39A90">Your gates</span><div style="display:flex;align-items:baseline;gap:8px"><span data-passed style="font-size:clamp(56px,6vw,80px);font-weight:500;letter-spacing:-.05em;line-height:.9;font-variant-numeric:tabular-nums">0</span><span style="font-size:16px;color:#A39A90">of 8 holding</span></div></div><span data-prog class="g8-mono" style="padding:5px 12px;border-radius:999px;background:rgba(255,255,255,.08);font-size:12px;color:#CFC6BC;white-space:nowrap"></span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:8px;height:170px">' + G.map(function (g, i) { return '<div style="height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:8px"><div style="width:100%;flex:1;display:flex;align-items:flex-end;border-radius:12px;background:rgba(255,255,255,.05)"><div data-bar="' + i + '" style="width:100%;height:14%;border-radius:12px;box-sizing:border-box;border:1px dashed rgba(255,255,255,.18);transition:height .5s cubic-bezier(.2,0,0,1),background .3s ease"></div></div><span data-bl="' + i + '" class="g8-mono" style="font-size:12px;color:#6E655D">' + (i + 1) + "</span></div>"; }).join("") + "</div>" +
      '<div style="display:grid;grid-template-columns:5fr 3fr;gap:8px;font-size:12px;color:#8A8077"><span style="border-top:1px solid rgba(255,255,255,.12);padding-top:6px">Before live</span><span style="border-top:1px solid rgba(255,255,255,.12);padding-top:6px">While live</span></div>' +
      '<div aria-live="polite" style="display:flex;flex-direction:column;gap:10px;padding:18px;border-radius:22px;background:rgba(255,255,255,.05)"><span data-hl style="font-size:12.5px;font-weight:500;color:#FF9A66"></span><span data-h style="font-size:clamp(19px,1.7vw,23px);line-height:1.3;letter-spacing:-.015em"></span><span data-b style="font-size:14.5px;line-height:1.55;color:#B3A99F"></span><div data-start style="display:none;flex-wrap:wrap;gap:8px;margin-top:4px"></div></div>' +
      '<figure data-quote style="margin:0;display:none;flex-direction:column;gap:6px"><blockquote style="margin:0;font-size:17px;line-height:1.4"></blockquote><figcaption style="font-size:12.5px;color:#8A8077">Robin Miller, The Governance Gap</figcaption></figure>' +
      '<a data-cta data-mag href="' + contact + '" style="display:flex;align-items:center;justify-content:center;gap:10px;height:54px;border-radius:999px;background:linear-gradient(180deg,#FF8246,#FF6A2B);color:#1A0C05;font-size:15.5px;font-weight:500;text-decoration:none">Book a call <span>&rarr;</span></a>' +
      '<span style="font-size:12px;line-height:1.5;color:#8A8077">Indicative only. Built from five questions in The Governance Gap, not an audit. Nothing is sent until you book.</span></div></div>';
    function draw() {
      $$("[data-opt]", el).forEach(function (b) { var on = st[b.getAttribute("data-opt")] === +b.getAttribute("data-i"); b.setAttribute("aria-pressed", on); b.style.background = on ? "#14110E" : "#FFF"; b.style.color = on ? "#FFF" : "#14110E"; b.style.border = "1px solid " + (on ? "#14110E" : "rgba(20,17,14,.12)"); });
      $$("[data-q]", el).forEach(function (q, i) { var a = st.ans[i]; q.style.borderColor = a === null ? "rgba(20,17,14,.06)" : a === 1 ? "rgba(20,17,14,.3)" : "rgba(255,106,43,.5)"; $$("[data-ans]", q).forEach(function (b) { var v = +b.getAttribute("data-ans"), on = a === v; b.setAttribute("aria-pressed", on); b.style.border = "1px solid rgba(20,17,14,.14)"; b.style.background = on ? (v ? "#14110E" : "#FF6A2B") : "#FFF"; b.style.color = on ? "#FFF" : "#14110E"; }); });
      var scores = G.map(function (_, g) { var qs = []; QG.forEach(function (x, qi) { if (x.indexOf(g) >= 0 && st.ans[qi] !== null) qs.push(st.ans[qi]); }); return qs.length ? qs.reduce(function (a, b) { return a + b; }, 0) / qs.length : null; });
      var done = st.ans.filter(function (a) { return a !== null; }).length, yes = st.ans.filter(function (a) { return a === 1; }).length, ctx = (st.sector !== null) + (st.size !== null) + (st.ai !== null);
      var passed = scores.filter(function (v) { return v !== null && v >= .5; }).length, gap = -1; scores.forEach(function (v, i) { if (gap < 0 && v !== null && v < .5) gap = i; });
      var aiLive = st.ai === 0 || st.ai === 1, svc = gap >= 0 ? START[gap] : null; if (gap === 4 && aiLive) svc = "B3"; if (gap === 1 && st.size === 0) svc = "B2";
      $("[data-ctx]", el).textContent = ctx + " of 3"; $("[data-done]", el).textContent = done + " of 5"; $("[data-passed]", el).textContent = passed; $("[data-prog]", el).textContent = (done + ctx) + " of 8 answered";
      scores.forEach(function (v, i) { var b = $('[data-bar="' + i + '"]', el); b.style.height = v === null ? "14%" : Math.max(14, v * 100) + "%"; b.style.background = v === null ? "transparent" : v >= .5 ? GC[i] : hexA(GC[i], .28); b.style.borderColor = v === null ? "rgba(255,255,255,.18)" : "transparent"; $('[data-bl="' + i + '"]', el).style.color = v !== null && v >= .5 ? "#F4EFE8" : "#6E655D"; });
      var hl = "Your result", h = "Answer the questions to see which gates hold.", bd = "Each question tests one or two gates. The gates depend on each other in order, so the first gap is where we would start.";
      if (done > 0 && gap < 0) { hl = done < 5 ? "So far" : "Your result"; h = done < 5 ? "No gaps yet. " + (5 - done) + " question" + (5 - done === 1 ? "" : "s") + " to go." : "Every gate tested is holding."; bd = done < 5 ? "Keep going. The gates you have not tested yet stay grey." : "Few organisations can say yes to all five. A short conversation will test whether the evidence would satisfy a regulator."; }
      else if (gap >= 0) { hl = done < 5 ? "First gap so far" : "Where we would start"; h = "Gate " + (gap + 1) + ", " + G[gap].name + ", is not yet holding."; bd = G[gap].line + (aiLive ? " With AI " + (st.ai === 0 ? "already in use" : "being asked for") + ", the second signature of the Double Lock matters most." : ""); }
      $("[data-hl]", el).textContent = hl; $("[data-h]", el).textContent = h; $("[data-b]", el).textContent = bd;
      var sEl = $("[data-start]", el); sEl.style.display = gap >= 0 ? "flex" : "none";
      if (gap >= 0) sEl.innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px;padding:6px 12px 6px 8px;border-radius:999px;background:' + hexA(GC[gap], .2) + ';font-size:13px;font-weight:500"><span style="width:10px;height:10px;border-radius:50%;background:' + GC[gap] + '"></span>Start at gate ' + (gap + 1) + ": " + esc(G[gap].name) + '</span><a href="' + servicesUrl + '" data-svc="' + svc + '" style="padding:6px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.18);color:#F4EFE8;font-size:13px;text-decoration:none">' + esc(SVC[svc] ? SVC[svc].name : "") + " &rarr;</a>";
      var qf = $("[data-quote]", el); qf.style.display = done === 5 ? "flex" : "none"; if (done === 5) $("blockquote", qf).textContent = "\u201C" + D.QUOTES[yes === 5 ? 15 : 1] + "\u201D";
      var q = "diag=" + passed + "&gate=" + encodeURIComponent(gap >= 0 ? G[gap].name : "") + (st.sector !== null ? "&sector=" + encodeURIComponent(SEC[st.sector]) : "") + (st.size !== null ? "&size=" + encodeURIComponent(SIZE[st.size]) : "") + (st.ai !== null ? "&ai=" + encodeURIComponent(AI[st.ai]) : "");
      var cta = $("[data-cta]", el); cta.href = contact + (done > 0 ? (contact.indexOf("?") < 0 ? "?" : "&") + q : ""); cta.firstChild.nodeValue = done > 0 ? "Take this result to a call " : "Book a call ";
      $("[data-panel]", el).style.position = window.innerWidth >= 1080 ? "sticky" : "static";
    }
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button,[data-svc]"); if (!b) return;
      if (b.hasAttribute("data-opt")) { var k = b.getAttribute("data-opt"), i = +b.getAttribute("data-i"); st[k] = st[k] === i ? null : i; }
      else if (b.hasAttribute("data-ans")) { st.ans[+b.closest("[data-q]").getAttribute("data-q")] = +b.getAttribute("data-ans"); }
      else if (b.hasAttribute("data-svc")) { try { sessionStorage.setItem("g8-service", b.getAttribute("data-svc")); } catch (x) {} document.dispatchEvent(new CustomEvent("g8:service", { detail: b.getAttribute("data-svc") })); return; }
      draw();
    });
    window.addEventListener("resize", draw); draw();
  };

  /* ---------- quotes carousel ---------- */
  mounts.quotes = function (el) {
    var i = 0, paused = false, N = D.QUOTES.length;
    el.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:clamp(20px,4vw,56px);align-items:flex-start;color:#F4EFE8"><div style="flex:1 1 200px;display:flex;flex-direction:column;gap:10px"><span style="font-size:13px;color:#8A8077">From the book</span><span class="g8-mono" style="font-size:14px;color:#A39A90"><b data-n style="color:#FF9A66;font-weight:500"></b> / ' + N + '</span></div><div style="flex:999 1 560px;min-width:0;display:flex;flex-direction:column;gap:20px"><blockquote data-t aria-live="polite" style="margin:0;font-size:clamp(26px,3.4vw,50px);line-height:1.08;letter-spacing:-.035em;font-weight:500;min-height:3.3em;text-wrap:balance;transition:opacity .25s ease"></blockquote><span style="font-size:13px;color:#8A8077">Robin Miller, The Governance Gap</span><div style="height:2px;border-radius:2px;background:rgba(255,255,255,.1);overflow:hidden"><div data-bar style="height:100%;background:#FF6A2B"></div></div><div style="display:flex;gap:8px"><button data-p class="g8-btn" aria-label="Previous quote" style="width:48px;height:48px;padding:0;border:1px solid rgba(255,255,255,.18);background:transparent;color:#F4EFE8;font-size:18px">&larr;</button><button data-nx class="g8-btn" aria-label="Next quote" style="width:48px;height:48px;padding:0;border:0;background:#F4EFE8;color:#14110E;font-size:18px">&rarr;</button></div></div></div>';
    var bar = $("[data-bar]", el);
    function show(k) { i = (k + N) % N; var t = $("[data-t]", el); t.style.opacity = 0; setTimeout(function () { t.textContent = "\u201C" + D.QUOTES[i] + "\u201D"; t.style.opacity = 1; }, 150); $("[data-n]", el).textContent = pad(i + 1); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = RM ? "none" : "g8prog 7s linear forwards"; bar.style.animationPlayState = paused ? "paused" : "running"; }
    bar.addEventListener("animationend", function () { show(i + 1); });
    $("[data-p]", el).addEventListener("click", function () { show(i - 1); }); $("[data-nx]", el).addEventListener("click", function () { show(i + 1); });
    el.addEventListener("mouseenter", function () { paused = true; bar.style.animationPlayState = "paused"; }); el.addEventListener("mouseleave", function () { paused = false; bar.style.animationPlayState = "running"; });
    show(0);
  };

  /* ---------- 3D book cover that tilts with the cursor ---------- */
  mounts.book = function (el) {
    el.style.perspective = "1400px"; el.style.display = "flex"; el.style.justifyContent = "center"; el.style.padding = "20px 0";
    el.innerHTML = '<div data-b aria-hidden="true" style="width:min(320px,70vw);aspect-ratio:2/3;position:relative;transform-style:preserve-3d;transform:rotateY(-26deg) rotateX(6deg);transition:transform .2s cubic-bezier(.2,0,0,1)"><div style="position:absolute;inset:0;border-radius:4px 10px 10px 4px;background:#0E0B09;transform:translateZ(-18px) rotateY(180deg)"></div><div style="position:absolute;top:0;bottom:0;left:0;width:36px;background:#0A0806;transform-origin:0 50%;transform:translateZ(-18px) rotateY(-90deg)"></div><div style="position:absolute;top:5px;bottom:5px;right:3px;width:34px;background:repeating-linear-gradient(90deg,#F2E9DF 0 1px,#DCCFC2 1px 2px);transform-origin:100% 50%;transform:translateZ(-17px) rotateY(90deg)"></div><div style="position:absolute;inset:0;border-radius:4px 10px 10px 4px;background:linear-gradient(90deg,rgba(0,0,0,.35) 0,rgba(0,0,0,0) 6%),linear-gradient(160deg,#241C17,#0E0B09);border:1px solid rgba(255,255,255,.08);padding:12% 11%;display:flex;flex-direction:column;justify-content:space-between;transform:translateZ(18px);box-shadow:30px 40px 80px -30px rgba(0,0,0,.8);color:#F4EFE8"><div><div style="font-size:clamp(32px,4vw,46px);font-weight:600;letter-spacing:-.05em;line-height:.92">The<br>Governance<br><span style="background:linear-gradient(100deg,#FF9A5C,#F04E1A);-webkit-background-clip:text;background-clip:text;color:transparent">Gap</span></div><div style="font-size:14px;color:#A39A90;margin-top:14px">From committees to consequences</div></div><div style="display:flex;gap:5px;height:56px;align-items:flex-end">' + GC.map(function (c, k) { return '<i style="flex:1;border-radius:2px;height:' + (30 + k * 10) + "%;background:" + c + '"></i>'; }).join("") + '</div><div style="font-size:12px;color:#A39A90">Robin Miller</div></div></div>';
    var b = $("[data-b]", el);
    el.addEventListener("mousemove", function (e) { var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; b.style.transform = "rotateY(" + (-26 + x * 40) + "deg) rotateX(" + (6 - y * 18) + "deg)"; });
    el.addEventListener("mouseleave", function () { b.style.transform = "rotateY(-26deg) rotateX(6deg)"; });
  };

  /* ---------- contact: particle text synced to an input ---------- */
  mounts["particle-text"] = function (el) {
    var EX = ["Monthly availability", "Duplicate members", "Lifetime asset cost", "Tenant vulnerability", "Lost revenue", "?"];
    el.style.position = el.style.position || "relative";
    var cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true"); cv.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;cursor:crosshair"; el.insertBefore(cv, el.firstChild);
    var pt = window.createParticleText(cv, { host: el }), input = $(el.getAttribute("data-input") || "[data-8gg-number]"), shown = null, ex = 0, deb;
    function sync() { var n = input ? input.value.trim() : "", t = n || EX[ex]; if (t !== shown) { shown = t; pt.setText(t); } }
    var go = function () { sync(); }; if (document.fonts && document.fonts.load) document.fonts.load("600 200px Geist").then(go, go); else go();
    if (input) input.addEventListener("input", function () { clearTimeout(deb); deb = setTimeout(sync, 350); var f = $('input[name="number"]'); if (f && f !== input) f.value = input.value; });
    setInterval(function () { if (!input || !input.value.trim()) { ex = (ex + 1) % EX.length; sync(); } }, 3600);
    document.addEventListener("g8:sent", function () { shown = "Owner named."; pt.setText(shown); });
  };

  /* ---------- contact: prefill Webflow form + show context brought from the homepage ---------- */
  mounts.prefill = function (el) {
    var p = new URLSearchParams(location.search), map = { number: "The number", diag: "Diagnostic", gate: "Start at", sector: "Sector", size: "People", ai: "AI" }, chips = [];
    Object.keys(map).forEach(function (k) {
      var v = p.get(k); if (!v) return;
      $$('[name="' + k + '"]').forEach(function (f) { f.value = v; });
      if (k === "number") $$("[data-8gg-number]").forEach(function (f) { f.value = v; f.dispatchEvent(new Event("input")); });
      if (k !== "number") chips.push('<span style="padding:6px 12px;border-radius:999px;background:#FFF;font-size:13.5px"><span style="color:#9A8F84">' + map[k] + "</span> " + esc(k === "diag" ? v + " of 8 gates holding" : v) + "</span>");
    });
    if (chips.length) { el.style.display = ""; el.innerHTML = '<span style="font-size:12.5px;font-weight:500;color:#E2531C">Brought from the site</span><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">' + chips.join("") + "</div>"; }
    else el.style.display = "none";
  };

  /* ---------- route progress: 8 site sections = 8 gates ---------- */
  mounts.route = function (el) {
    var ids = (el.getAttribute("data-sections") || "problem,gates,lock,services,work,sectors,book,people").split(","), seen = {};
    el.setAttribute("aria-label", "Your route through the site");
    el.style.cssText += ";position:fixed;left:clamp(12px,2vw,24px);bottom:clamp(12px,2vw,24px);z-index:40;display:flex;align-items:center;gap:12px;padding:10px 14px 10px 12px;border-radius:999px;background:rgba(20,17,14,.88);color:#F4EFE8;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);box-shadow:0 20px 40px -20px rgba(20,17,14,.6);opacity:0;pointer-events:none;transition:opacity .25s ease";
    el.innerHTML = '<div style="display:flex;gap:4px">' + ids.map(function (id, i) { return '<a href="#' + id + '" data-r="' + id + '" style="display:block;width:18px;height:6px;border-radius:6px;background:rgba(255,255,255,.16);transition:background .3s ease"></a>'; }).join("") + '</div><span data-l style="font-size:12.5px;white-space:nowrap;font-variant-numeric:tabular-nums">0 of 8 gates passed</span><a data-done href="#contact" style="display:none;font-size:12.5px;font-weight:500;color:#FF9A66;white-space:nowrap;text-decoration:none">Name the number &rarr;</a>';
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting && !seen[e.target.id]) { seen[e.target.id] = 1; var i = ids.indexOf(e.target.id); $('[data-r="' + e.target.id + '"]', el).style.background = GC[i]; var n = Object.keys(seen).length; $("[data-l]", el).textContent = n + " of 8 gates passed"; $("[data-done]", el).style.display = n === ids.length ? "inline" : "none"; } }); }, { rootMargin: "-35% 0px -45% 0px" });
    ids.forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    function vis() { var on = window.scrollY > window.innerHeight * .6 && window.innerWidth >= 700; el.style.opacity = on ? 1 : 0; el.style.pointerEvents = on ? "auto" : "none"; }
    window.addEventListener("scroll", vis, { passive: true }); window.addEventListener("resize", vis); vis();
  };

  /* ---------- magnetic buttons [data-mag] + scroll reveal [data-rv] ---------- */
  function magnetic() {
    if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches || RM) return;
    var cur = null;
    document.addEventListener("mousemove", function (e) {
      var el = e.target.closest && e.target.closest("[data-mag]");
      if (cur && cur !== el) { cur.style.transform = ""; cur = null; }
      if (!el) return; cur = el; el.style.transition = "transform .2s cubic-bezier(.2,0,0,1)";
      var r = el.getBoundingClientRect(); el.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .22) + "px," + ((e.clientY - r.top - r.height / 2) * .3) + "px)";
    });
  }
  function reveal() {
    if (RM || !window.IntersectionObserver) return;
    var io = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = "none"; io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" });
    $$("[data-rv]").forEach(function (el) { if (el.getBoundingClientRect().top < window.innerHeight) return; el.style.opacity = 0; el.style.transform = "translateY(28px)"; el.style.transition = "opacity .7s cubic-bezier(.2,0,0,1), transform .7s cubic-bezier(.2,0,0,1)"; io.observe(el); });
  }
  /* ---------- case read tracker: links with data-case-link="slug", counter data-8gg="read-count" ---------- */
  function readTracker() {
    var KEY = "g8-read", read = {}; try { read = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) {}
    var here = document.querySelector("[data-case-page]"); if (here) { read[here.getAttribute("data-case-page")] = 1; try { localStorage.setItem(KEY, JSON.stringify(read)); } catch (e) {} }
    $$("[data-case-link]").forEach(function (a) { if (read[a.getAttribute("data-case-link")]) { var b = a.querySelector("[data-read-badge]"); if (b) b.style.display = "inline-flex"; } });
    $$('[data-8gg="read-count"]').forEach(function (el) { var total = +(el.getAttribute("data-total") || 6), n = Object.keys(read).length; el.textContent = n ? "You have read " + Math.min(n, total) + " of " + total + " cases" : total + " cases. Open one to read it in full."; });
  }

  function boot() {
    if (!window.THREE || !window.createEightScene) return setTimeout(boot, 60);
    Object.keys(mounts).forEach(function (k) { mount(k, mounts[k]); });
    magnetic(); reveal(); readTracker();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
