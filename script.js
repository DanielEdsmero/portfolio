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

  // scroll spy
  var links = document.querySelectorAll("[data-spy]");
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (l) { l.classList.toggle("on", l.dataset.spy === e.target.id); });
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  ["projects", "experience", "stack"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) io.observe(el);
  });

  // project deck: fanned cards, active one comes to the front
  var cards = Array.prototype.slice.call(document.querySelectorAll(".card"));
  var active = 0;
  function layout() {
    cards.forEach(function (c, i) {
      var d = i - active;
      var x = d * 46, rot = d * 6, scale = d === 0 ? 1 : 0.94;
      c.style.zIndex = String(10 - Math.abs(d));
      c.style.transform = "translateX(calc(-50% + " + x + "px)) translateY(" + Math.abs(d) * 14 + "px) rotate(" + rot + "deg) scale(" + scale + ")";
      c.style.opacity = d === 0 ? "1" : "0.7";
    });
  }
  cards.forEach(function (c, i) {
    c.addEventListener("mouseenter", function () { active = i; layout(); });
    c.addEventListener("click", function () { active = i; layout(); });
  });
  layout();

})();

/* Mango the monkey: swings between sections and explains each one */
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";

  var steps = [
    { sel: "h1", say: "Hi! I'm Mango, Daniel's guide. Follow me and I'll swing by everything." },
    { sel: ".socials", say: "Find Daniel on GitHub and socials here." },
    { sel: ".affil .stat", say: "Quick numbers: community, years shipping, hackathon wins." },
    { sel: ".nav-main a[href='#blog']", say: "The sidebar jumps to any section. This one is the blog." },
    { sel: "#blog .sec-head", say: "Posts about what Daniel builds and learns." },
    { sel: "#deck", say: "Projects live in this card stack. Hover a card to pull it forward." },
    { sel: "#experience .sec-head", say: "Where Daniel has worked, newest first." },
    { sel: "#stack .sec-head", say: "The tools he reaches for most." },
    { sel: ".theme", say: "Flip between day and night mode." },
    { sel: ".mail", say: "Work, collabs or just hello: email lands here." },
    { sel: "footer", say: "That's the tour! Click me any time to pause or restart." }
  ];

  var guide = document.createElement("div");
  guide.className = "guide";
  guide.innerHTML =
    '<div class="bubble above"><b>Mango</b><span></span></div>' +
    '<div class="sprite" title="Click to pause or resume the tour">' +
    '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<g class="tail"><path d="M18 46c-12 2-14 12-6 14" fill="none" stroke="#7a4a26" stroke-width="5" stroke-linecap="round"/></g>' +
    '<ellipse cx="32" cy="46" rx="13" ry="12" fill="#8a5630"/>' +
    '<ellipse cx="32" cy="48" rx="8" ry="8" fill="#e8c9a0"/>' +
    '<g class="arm-down"><path d="M21 42l-6 10M43 42l6 10" stroke="#8a5630" stroke-width="5" stroke-linecap="round"/></g>' +
    '<g class="arm-up"><path d="M21 40l8-22M43 40l-8-22" stroke="#8a5630" stroke-width="5" stroke-linecap="round"/></g>' +
    '<circle cx="19" cy="24" r="6" fill="#8a5630"/><circle cx="45" cy="24" r="6" fill="#8a5630"/>' +
    '<circle cx="32" cy="26" r="14" fill="#8a5630"/>' +
    '<ellipse cx="32" cy="30" rx="10" ry="8" fill="#e8c9a0"/>' +
    '<circle cx="27.5" cy="25" r="2" fill="#2a2118"/><circle cx="36.5" cy="25" r="2" fill="#2a2118"/>' +
    '<path d="M28 32q4 3 8 0" fill="none" stroke="#2a2118" stroke-width="1.6" stroke-linecap="round"/>' +
    '</svg></div>';
  var vine = document.createElementNS(NS, "svg");
  vine.setAttribute("class", "vine");
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

  var pos = { x: -100, y: -100 };
  var tilt = 0;
  var perched = null; // { el, side }
  var running = false;
  var token = 0;
  var stepIdx = 0;
  var typer = 0;

  function place() {
    guide.style.transform = "translate(" + (pos.x - 42) + "px," + (pos.y - 84) + "px)";
    sprite.style.transform = "rotate(" + tilt + "deg)";
  }
  function perchPoint(t) {
    var r = t.el.getBoundingClientRect();
    if (t.side === "right") return { x: r.right + 40, y: r.bottom + 14 };
    var y = Math.min(Math.max(r.top, 170), innerHeight - 30);
    return { x: Math.min(r.left + 40, innerWidth - 80), y: y };
  }
  (function follow() {
    if (perched) { var p = perchPoint(perched); pos.x = p.x; pos.y = p.y; place(); }
    requestAnimationFrame(follow);
  })();

  function wait(ms, tk) {
    return new Promise(function (res) { setTimeout(function () { res(tk === token); }, ms); });
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
  function say(text, side) {
    clearInterval(typer);
    bubble.className = "bubble " + (side === "right" ? "right" : "above");
    bubbleText.textContent = text;
    guide.classList.add("talking");
    var w = bubble.getBoundingClientRect().width;
    var flip = pos.x + (side === "right" ? 120 : 24) + w > innerWidth;
    bubble.classList.toggle("flip", flip);
    if (reduce) return;
    var i = 0;
    bubbleText.textContent = "";
    typer = setInterval(function () {
      bubbleText.textContent = text.slice(0, ++i);
      if (i >= text.length) clearInterval(typer);
    }, 22);
  }
  function hush() { clearInterval(typer); guide.classList.remove("talking"); }

  // swing along a pendulum arc about an anchor above the two perches
  function swing(from, to, tk) {
    return new Promise(function (res) {
      if (reduce || from.x < -50) { pos.x = to.x; pos.y = to.y; tilt = 0; place(); return res(); }
      var ax = (from.x + to.x) / 2;
      var ay = Math.min(from.y, to.y) - 190;
      var a0 = Math.atan2(from.x - ax, from.y - ay), a1 = Math.atan2(to.x - ax, to.y - ay);
      var r0 = Math.hypot(from.x - ax, from.y - ay), r1 = Math.hypot(to.x - ax, to.y - ay);
      var dur = 950, t0 = performance.now();
      guide.classList.add("swinging");
      vineLine.style.display = "";
      (function frame(now) {
        if (tk !== token) { vineLine.style.display = "none"; guide.classList.remove("swinging"); return res(); }
        var u = Math.min((now - t0) / dur, 1);
        var e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        var a = a0 + (a1 - a0) * e, r = r0 + (r1 - r0) * e;
        pos.x = ax + Math.sin(a) * r;
        pos.y = ay + Math.cos(a) * r;
        tilt = -a * 57.3 * 0.6;
        var hand = { x: pos.x, y: pos.y - 66 };
        vineLine.setAttribute("x1", ax); vineLine.setAttribute("y1", Math.min(ay, 0));
        vineLine.setAttribute("x2", hand.x); vineLine.setAttribute("y2", hand.y);
        place();
        if (u < 1) requestAnimationFrame(frame);
        else { vineLine.style.display = "none"; guide.classList.remove("swinging"); tilt = 0; place(); res(); }
      })(t0);
    });
  }

  function visible(el) { return !!el && el.getClientRects().length > 0; }

  async function run() {
    var tk = ++token;
    running = true;
    btn.textContent = "⏸ Pause tour";
    while (tk === token) {
      var s = steps[stepIdx % steps.length];
      stepIdx++;
      var el = document.querySelector(s.sel);
      if (!visible(el)) continue;
      var side = el.closest(".sidebar") ? "right" : "above";
      if (side !== "right") {
        var r = el.getBoundingClientRect();
        if (r.top < 190 || r.top > innerHeight - 120) {
          el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
          await settleScroll();
          if (tk !== token) return;
        }
      }
      hush();
      var from = perched ? { x: pos.x, y: pos.y } : { x: pos.x, y: pos.y };
      perched = null;
      var target = { el: el, side: side };
      await swing(from, perchPoint(target), tk);
      if (tk !== token) return;
      perched = target;
      say(s.say, side);
      if (!(await wait(Math.max(3200, s.say.length * 55), tk))) return;
    }
  }
  function stop() { token++; running = false; vineLine.style.display = "none"; guide.classList.remove("swinging"); btn.textContent = "▶ Resume tour"; }
  function toggle() { if (running) stop(); else run(); }
  btn.addEventListener("click", toggle);
  sprite.addEventListener("click", toggle);

  // start from just off-screen on the right, after the page settles
  pos.x = innerWidth + 80; pos.y = 200; place();
  addEventListener("load", function () { setTimeout(run, 900); });
})();
