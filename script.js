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
  setTheme(saved || "dark");
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

  // Alt+J / Alt+K are reserved for future features; ignore for now
})();
