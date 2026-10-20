(function () {
  var root = document.documentElement;

  // theme
  var buttons = document.querySelectorAll("[data-theme-set]");
  function setTheme(t) {
    root.setAttribute("data-theme", t);
    buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.themeSet === t)); });
    try { localStorage.setItem("theme", t); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) {}
  setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  buttons.forEach(function (b) { b.addEventListener("click", function () { setTheme(b.dataset.themeSet); }); });

  // reading progress bar
  var bar = document.getElementById("progress");
  function onScroll() {
    var h = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (h > 0 ? (scrollY / h) * 100 : 0) + "%";
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // highlight the sidebar link of the section in view
  var links = document.querySelectorAll("[data-spy]");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (l) { l.classList.toggle("on", l.dataset.spy === e.target.id); });
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  links.forEach(function (l) {
    var el = document.getElementById(l.dataset.spy);
    if (el) io.observe(el);
  });
})();

/* Mango the monkey: swings between sections, explains each, sleeps when idle */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  var steps = [
    { sel: ".badge", say: "Hi! I'm Mango, Daniel's guide. Follow me and I'll swing by everything." },
    { sel: ".hero .cta", say: "Short on time? Jump to the work, or just send an email." },
    { sel: ".proof", say: "The headline numbers, at a glance." },
    { sel: ".nav-main a[href='#work']", say: "The sidebar jumps to any section. Work comes first." },
    { sel: "#work .cases", say: "Each project says the problem, what Daniel did and the result." },
    { sel: "#about .sec-head", say: "A short intro and the tools he reaches for." },
    { sel: "#experience .sec-head", say: "Where he has worked, newest first." },
    { sel: "#writing .sec-head", say: "Posts about what he builds and learns." },
    { sel: ".theme", say: "Flip between day and night mode." },
    { sel: ".mail", say: "Work, collabs or just hello: email lands here." },
    { sel: "#contact h2", say: "That's the tour! I'm off for a nap. Click me to wake me." }
  ];

  var guide = document.createElement("div");
  guide.className = "guide";
  guide.setAttribute("aria-hidden", "true");
  guide.innerHTML =
    '<div class="bubble above"><b>Mango</b><span></span></div>' +
    '<div class="sprite"><div class="frame"></div></div>';
  var vine = document.createElementNS(NS, "svg");
  vine.setAttribute("class", "vine");
  vine.setAttribute("aria-hidden", "true");
  var vineLine = document.createElementNS(NS, "line");
  vineLine.style.display = "none";
  vine.appendChild(vineLine);
  var btn = document.createElement("button");
  btn.className = "tour-btn";
  btn.type = "button";
  document.body.append(vine, guide, btn);

  var bubble = guide.querySelector(".bubble");
  var bubbleText = bubble.querySelector("span");
  var sprite = guide.querySelector(".sprite");
  var frameEl = guide.querySelector(".frame");

  // ---- sprite animation (frames come from assets/make_mango.py) ----
  var FW = 96; // 24px art at 4x
  var ANIMS = {
    idle:       { f: [0, 0, 0, 1, 1, 1, 0, 0, 2, 0, 1, 1, 1, 1], ms: 170, loop: true, still: 0 },
    talk:       { f: function () { return [3, 14, 4, 3, 0, 14][Math.floor(Math.random() * 6)]; }, ms: 120, loop: true, still: 0 },
    swing:      { f: [5, 6], ms: 140, loop: true, still: 5 },
    land:       { f: [7], ms: 260, still: 0 },
    sleep:      { f: [8, 8, 9, 9, 15, 15, 9, 9], ms: 420, loop: true, still: 8 },
    wake:       { f: [8, 10, 10, 11, 11, 11, 12, 12, 13, 13, 0], ms: 230, still: 0 },
    fallAsleep: { f: [0, 2, 10, 11, 11, 10, 8], ms: 260, still: 8 }
  };
  var animTimer = 0;
  function setFrame(i) { frameEl.style.backgroundPosition = -i * FW + "px 0"; }
  // play a named animation; once-only animations call done when finished
  function play(name, done) {
    clearTimeout(animTimer);
    var a = ANIMS[name], i = 0;
    if (reduce) { setFrame(a.still); if (done) setTimeout(done, 0); return; }
    (function step() {
      setFrame(typeof a.f === "function" ? a.f() : a.f[i % a.f.length]);
      i++;
      if (!a.loop && i >= a.f.length) { if (done) animTimer = setTimeout(done, a.ms); return; }
      animTimer = setTimeout(step, a.ms);
    })();
  }
  function playAsync(name) { return new Promise(function (res) { play(name, res); }); }

  // ---- movement ----
  var pos = { x: -100, y: -100 };
  var tilt = 0, dir = 1;
  var perched = null; // { el, side }

  function place() {
    guide.style.transform = "translate(" + (pos.x - 48) + "px," + (pos.y - 96) + "px)";
    sprite.style.transformOrigin = dir > 0 ? "79% 2%" : "21% 2%";
    sprite.style.transform = "rotate(" + tilt * dir + "deg)";
    frameEl.style.transform = "scaleX(" + dir + ")";
  }
  function perchPoint(t) {
    var r = t.el.getBoundingClientRect();
    if (t.nap) return { x: r.right + 50, y: r.bottom }; // sleeping needs no room for a bubble
    if (t.side === "right") return { x: r.right + 40, y: r.bottom + 14 };
    var y = Math.min(Math.max(r.top, 170), innerHeight - 30);
    var x = r.width < 300 ? r.right + 50 : r.left + 40; // perch beside small elements, on top of wide ones
    return { x: Math.min(x, innerWidth - 80), y: y };
  }
  (function follow() {
    if (perched) { var p = perchPoint(perched); pos.x = p.x; pos.y = p.y; place(); }
    requestAnimationFrame(follow);
  })();

  var waker = null;
  function wait(ms) {
    return new Promise(function (res) { waker = res; setTimeout(res, ms); });
  }
  function settleScroll() {
    return new Promise(function (res) {
      var last = scrollY, still = 0, n = 0;
      (function chk() {
        n++;
        still = Math.abs(scrollY - last) < 1 ? still + 1 : 0;
        last = scrollY;
        if (still >= 4 || n > 60) res(); else setTimeout(chk, 30);
      })();
    });
  }

  var typer = 0;
  function say(text, side) {
    clearInterval(typer);
    bubble.className = "bubble " + (side === "right" ? "right" : "above");
    bubbleText.textContent = text;
    guide.classList.add("talking");
    var w = bubble.getBoundingClientRect().width;
    bubble.classList.toggle("flip", pos.x + (side === "right" ? 120 : 36) + w > innerWidth);
    if (reduce) return;
    play("talk");
    var i = 0;
    bubbleText.textContent = "";
    typer = setInterval(function () {
      bubbleText.textContent = text.slice(0, ++i);
      if (i >= text.length) { clearInterval(typer); play("idle"); }
    }, 22);
  }
  function hush() { clearInterval(typer); guide.classList.remove("talking"); }

  // swing along a pendulum arc about an anchor above the two perches
  function swing(from, to) {
    return new Promise(function (res) {
      if (reduce || from.x < -50) { pos.x = to.x; pos.y = to.y; tilt = 0; dir = 1; place(); return res(); }
      var ax = (from.x + to.x) / 2;
      var ay = Math.min(from.y, to.y) - 190;
      var a0 = Math.atan2(from.x - ax, from.y - ay), a1 = Math.atan2(to.x - ax, to.y - ay);
      var r0 = Math.hypot(from.x - ax, from.y - ay), r1 = Math.hypot(to.x - ax, to.y - ay);
      var dur = 950, t0 = performance.now();
      dir = to.x >= from.x ? 1 : -1;
      play("swing");
      vineLine.style.display = "";
      (function frame(now) {
        var u = Math.min((now - t0) / dur, 1);
        var e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        var a = a0 + (a1 - a0) * e, r = r0 + (r1 - r0) * e;
        pos.x = ax + Math.sin(a) * r;
        pos.y = ay + Math.cos(a) * r;
        tilt = -a * 57.3 * 0.6;
        vineLine.setAttribute("x1", ax); vineLine.setAttribute("y1", Math.min(ay, 0));
        vineLine.setAttribute("x2", pos.x + 30 * dir); vineLine.setAttribute("y2", pos.y - 94);
        place();
        if (u < 1) return requestAnimationFrame(frame);
        vineLine.style.display = "none";
        tilt = 0; dir = 1; place();
        play("land", function () { play("idle"); });
        res();
      })(t0);
    });
  }

  // ---- tour ----
  var state = "asleep"; // asleep | touring
  var wantPause = false;
  var stepIdx = 0;

  function setBtn() {
    var touring = state === "touring";
    btn.textContent = touring ? "Pause tour" : "Wake Mango";
    btn.setAttribute("aria-pressed", String(touring));
  }
  function visible(el) { return !!el && el.getClientRects().length > 0; }

  async function run() {
    if (state === "touring") return;
    state = "touring"; wantPause = false; setBtn();
    hush();
    await playAsync("wake");
    play("idle");
    while (!wantPause && stepIdx < steps.length) {
      var s = steps[stepIdx++];
      var el = document.querySelector(s.sel);
      if (!visible(el)) continue;
      var side = el.closest(".sidebar") ? "right" : "above";
      if (side !== "right") {
        var r = el.getBoundingClientRect();
        if (r.top < 190 || r.top > innerHeight - 120) {
          el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
          await settleScroll();
        }
      }
      hush();
      var target = { el: el, side: side };
      var to = perchPoint(target);
      perched = null;
      if (Math.hypot(to.x - pos.x, to.y - pos.y) > 6) await swing({ x: pos.x, y: pos.y }, to);
      perched = target;
      say(s.say, side);
      await wait(Math.max(3200, s.say.length * 55));
    }
    if (stepIdx >= steps.length) stepIdx = 0; // next wake restarts the tour
    hush();
    await playAsync("fallAsleep");
    play("sleep");
    state = "asleep"; setBtn();
  }
  function toggle() {
    if (state === "touring") { wantPause = true; if (waker) waker(); }
    else run();
  }
  btn.addEventListener("click", toggle);
  sprite.addEventListener("click", toggle);

  // start curled up asleep beside the name, then wake up and begin
  var first = { el: document.querySelector(".badge"), side: "above", nap: true };
  perched = first;
  play("sleep");
  setBtn();
  addEventListener("load", function () { setTimeout(run, 1200); });
})();
