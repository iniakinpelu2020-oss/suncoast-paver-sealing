/* Suncoast Paver Sealing — interactions */
(function () {
  "use strict";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var PHONE = "+19414056281";
  var TZ = "America/New_York";
  var money = function (n) { return "$" + n; };

  /* ---------- boot failsafe ---------- */
  var boot = $("#boot");
  if (boot) {
    window.setTimeout(function () {
      if (boot && boot.parentNode) { boot.parentNode.removeChild(boot); }
    }, 2600);
  }

  /* ---------- header state ---------- */
  var head = $("#head");
  var hero = $(".hero");
  var syncHead = function () {
    if (!head) { return; }
    var edge = hero ? hero.offsetHeight - 90 : 120;
    head.classList.toggle("is-stuck", window.scrollY > edge);
  };
  syncHead();
  window.addEventListener("scroll", syncHead, { passive: true });

  /* ---------- today in Sarasota ---------- */
  (function today() {
    var rows = $$(".hours tr[data-day]");
    if (!rows.length) { return; }
    var label;
    try {
      label = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: TZ }).format(new Date());
    } catch (err) {
      label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];
    }
    rows.forEach(function (row) {
      if (row.getAttribute("data-day") === label) {
        row.classList.add("is-today");
        var cell = $(".hours__now", row);
        if (cell) { cell.textContent = "Today"; }
      }
    });
  })();

  /* ---------- paver wall tilt ---------- */
  $$(".brick").forEach(function (brick) {
    brick.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") { return; }
      var box = brick.getBoundingClientRect();
      if (!box.width || !box.height) { return; }
      var px = (e.clientX - box.left) / box.width;
      var py = (e.clientY - box.top) / box.height;
      brick.style.setProperty("--ry", clamp((px - 0.5) * 10, -6, 6).toFixed(2) + "deg");
      brick.style.setProperty("--rx", clamp((0.5 - py) * 9, -5, 5).toFixed(2) + "deg");
      brick.style.setProperty("--tz", "10px");
      brick.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      brick.style.setProperty("--my", (py * 100).toFixed(1) + "%");
    });
    brick.addEventListener("pointerleave", function () {
      brick.style.removeProperty("--rx");
      brick.style.removeProperty("--ry");
      brick.style.removeProperty("--mx");
      brick.style.removeProperty("--my");
      if (brick.getAttribute("aria-pressed") !== "true") {
        brick.style.removeProperty("--tz");
      }
    });
    brick.addEventListener("focus", function () {
      brick.style.setProperty("--tz", "10px");
    });
    brick.addEventListener("blur", function () {
      if (brick.getAttribute("aria-pressed") !== "true") {
        brick.style.removeProperty("--tz");
      }
    });
  });

  /* ---------- estimate ---------- */
  var totalNum = $("#tallyNum");
  var totalCount = $("#tallyCount");
  var totalList = $("#tallyList");
  var drawerNum = $("#drawerNum");
  var drawerList = $("#drawerList");
  var drawerCall = $("#drawerCall");
  var drawerText = $("#drawerText");

  var pillsWrap = $('.pills[data-group="service"]');
  var pills = pillsWrap ? $$("button", pillsWrap) : [];

  function chosen() {
    return pills.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })
      .map(function (b) {
        return {
          key: b.getAttribute("data-service"),
          label: (b.firstChild && b.firstChild.textContent ? b.firstChild.textContent : "").trim(),
          amount: parseInt(b.getAttribute("data-price"), 10) || 0
        };
      });
  }

  function message(items, total) {
    if (!items.length) {
      return "Hi Suncoast — I'd like a paver sealing estimate for my property in Sarasota.";
    }
    var parts = items.map(function (i) { return i.label + " " + money(i.amount); });
    return "Hi Suncoast — estimate from your site: " + parts.join(" · ") + " = " + money(total) + " (starting). Can you confirm?";
  }

  function render(pop) {
    var items = chosen();
    var total = items.reduce(function (s, i) { return s + i.amount; }, 0);

    if (totalNum) {
      totalNum.textContent = money(total);
      if (pop) {
        totalNum.classList.add("pop");
        window.setTimeout(function () { totalNum.classList.remove("pop"); }, 220);
      }
    }
    if (totalCount) {
      totalCount.textContent = items.length
        ? items.length + (items.length === 1 ? " service selected" : " services selected")
        : "Nothing selected yet";
    }
    var html = items.map(function (i) {
      return "<li><span>" + i.label + "</span><span>" + money(i.amount) + "</span></li>";
    }).join("");
    if (totalList) { totalList.innerHTML = html; }
    if (drawerNum) { drawerNum.textContent = money(total); }
    if (drawerList) { drawerList.innerHTML = html; }

    var body = encodeURIComponent(message(items, total));
    if (drawerCall) { drawerCall.href = "tel:" + PHONE; }
    if (drawerText) { drawerText.href = "sms:" + PHONE + "?&body=" + body; }

    $$(".brick[data-service]").forEach(function (brick) {
      var on = items.some(function (i) { return i.key === brick.getAttribute("data-service"); });
      brick.setAttribute("aria-pressed", on ? "true" : "false");
      if (!on) { brick.style.removeProperty("--tz"); }
    });
  }

  if (pillsWrap) {
    pillsWrap.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest("button") : null;
      if (!btn || !pillsWrap.contains(btn)) { return; }
      var on = btn.getAttribute("aria-pressed") === "true";
      btn.setAttribute("aria-pressed", on ? "false" : "true");
      render(true);
    });
  }

  $$(".brick[data-service]").forEach(function (brick) {
    var toggle = function () {
      var key = brick.getAttribute("data-service");
      var pill = pills.filter(function (p) { return p.getAttribute("data-service") === key; })[0];
      if (!pill) { return; }
      var on = pill.getAttribute("aria-pressed") === "true";
      pill.setAttribute("aria-pressed", on ? "false" : "true");
      render(true);
    };
    brick.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest("input")) { return; }
      toggle();
    });
    brick.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  render(false);

  /* ---------- drawer ---------- */
  var drawer = $("#drawer");
  var scrim = $("#scrim");
  var drawerClose = $("#drawerClose");
  var lastFocus = null;

  function openDrawer() {
    if (!drawer) { return; }
    lastFocus = document.activeElement;
    render(false);
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (scrim) { scrim.hidden = false; window.requestAnimationFrame(function () { scrim.classList.add("is-open"); }); }
    document.body.style.overflow = "hidden";
    if (drawerClose) { drawerClose.focus(); }
  }

  function closeDrawer() {
    if (!drawer) { return; }
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (scrim) {
      scrim.classList.remove("is-open");
      window.setTimeout(function () { if (!drawer.classList.contains("is-open")) { scrim.hidden = true; } }, 420);
    }
    document.body.style.overflow = "";
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); }
  }

  $$("[data-open-estimate]").forEach(function (b) { b.addEventListener("click", openDrawer); });
  if (drawerClose) { drawerClose.addEventListener("click", closeDrawer); }
  if (scrim) { scrim.addEventListener("click", closeDrawer); }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && drawer && drawer.classList.contains("is-open")) { closeDrawer(); }
  });

  /* ---------- comparison ---------- */
  var frame = $("#compareFrame");
  var range = $("#compareRange");
  if (frame && range) {
    var sync = function () { frame.style.setProperty("--split", range.value + "%"); };
    range.addEventListener("input", sync);
    sync();
  }
})();
