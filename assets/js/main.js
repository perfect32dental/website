/* Site-wide behaviour: nav, contact injection, reveal, gallery lightbox. */
(function () {
  "use strict";
  var C = window.CLINIC || {};
  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* --- Mobile navigation ------------------------------------------------ */
  var nav = $("#navLinks"), burger = $("#burger");
  if (nav && burger) {
    /* The backdrop must live INSIDE .site-head. That element is
       position:sticky with z-index:100, so it forms a stacking context and
       .nav-links' z-index:120 only ranks within it. A backdrop appended to
       <body> at z-index:110 outranks the whole header and paints over the
       drawer. Inside the header, the drawer (120) correctly sits above the
       backdrop (110); it still covers the viewport because it is
       position:fixed and the header no longer creates a containing block. */
    var backdrop = document.createElement("div");
    backdrop.className = "nav-backdrop";
    (document.querySelector(".site-head") || document.body).appendChild(backdrop);

    var closeBtn = document.createElement("button");
    closeBtn.className = "nav-close";
    closeBtn.setAttribute("aria-label", "Close menu");
    closeBtn.innerHTML = "&times;";
    document.body.appendChild(closeBtn);

    var setNav = function (open) {
      nav.classList.toggle("open", open);
      backdrop.classList.toggle("open", open);
      closeBtn.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
      if (open) { var f = nav.querySelector("a"); if (f) f.focus(); } else { burger.focus(); }
    };
    burger.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });
    backdrop.addEventListener("click", function () { setNav(false); });
    closeBtn.addEventListener("click", function () { setNav(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) setNav(false);
    });
    $$("#navLinks a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  }

  /* --- Header shadow on scroll ------------------------------------------ */
  var head = $(".site-head");
  if (head) {
    var onScroll = function () { head.classList.toggle("scrolled", window.scrollY > 8); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* --- Inject clinic details from config -------------------------------- *
   * Any element with data-clinic="phonePrimary" gets the value as text;
   * data-clinic-href="tel|wa|mail|map" gets the right link.               */
  var pretty = function (n) {
    return String(n || "").replace(/^\+91(\d{5})(\d{5})$/, "+91 $1 $2");
  };
  $$("[data-clinic]").forEach(function (el) {
    var k = el.getAttribute("data-clinic"), v = "";
    if (k === "phonePrimary")        v = pretty(C.phonePrimary);
    else if (k === "phoneSecondary") v = pretty(C.phoneSecondary);
    else if (k === "email")          v = C.email;
    else if (k === "name")           v = C.name;
    else if (k === "addressFull")    v = [C.address.line1, C.address.line2, C.address.region].join(", ");
    else if (k === "addressLine1")   v = C.address.line1;
    else if (k === "addressLine2")   v = C.address.line2 + ", " + C.address.region;
    else if (k === "year")           v = new Date().getFullYear();
    else if (k === "hours")          v = hoursSummary();
    if (v) el.textContent = v;
  });
  $$("[data-clinic-href]").forEach(function (el) {
    var k = el.getAttribute("data-clinic-href");
    if (k === "tel")       el.href = "tel:" + C.phonePrimary;
    else if (k === "tel2") el.href = "tel:" + C.phoneSecondary;
    else if (k === "mail") el.href = "mailto:" + C.email;
    else if (k === "map")  el.href = C.mapLink;
    else if (k === "wa")   el.href = "https://wa.me/" + C.whatsapp +
        "?text=" + encodeURIComponent("Hello Perfect 32 Dental Clinic, I'd like to ask about an appointment.");
  });

  /* Groups days that share identical hours into CIRCULAR runs, so a
     Tue-Sun clinic reads "Tuesday-Sunday" and not "Sunday to Saturday". */
  function hoursSummary() {
    var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var key = function (d) {
      var h = C.hours[d];
      return h ? h.map(function (r) { return r[0] + "-" + r[1]; }).join(",") : "";
    };

    var openDays = [0,1,2,3,4,5,6].filter(function (d) { return key(d); });
    if (!openDays.length) return "Please call for opening hours";
    if (openDays.length === 7 && new Set([0,1,2,3,4,5,6].map(key)).size === 1) {
      return "Every day, " + fmtRanges(C.hours[0]);
    }

    /* Find a day whose predecessor differs — that is a run boundary. */
    var startDay = 0;
    for (var i = 0; i < 7; i++) {
      if (key(i) !== key((i + 6) % 7)) { startDay = i; break; }
    }

    var runs = [], cur = null;
    for (var n = 0; n < 7; n++) {
      var d = (startDay + n) % 7, k = key(d);
      if (cur && cur.k === k) { cur.end = d; }
      else { cur = { k: k, start: d, end: d }; runs.push(cur); }
    }

    var openTxt = runs.filter(function (r) { return r.k; }).map(function (r) {
      var span = r.start === r.end
        ? DAYS[r.start]
        : DAYS[r.start] + "\u2013" + DAYS[r.end];
      return span + ", " + fmtRanges(C.hours[r.start]);
    });
    var closed = runs.filter(function (r) { return !r.k; }).map(function (r) {
      return r.start === r.end ? DAYS[r.start] + "s" : DAYS[r.start] + "\u2013" + DAYS[r.end];
    });

    return openTxt.join(" \u00b7 ") + (closed.length ? " \u00b7 Closed " + closed.join(", ") : "");
  }

  function fmtRanges(ranges) {
    return ranges.map(function (r) { return t12(r[0]) + "\u2013" + t12(r[1]); }).join(" & ");
  }

  function t12(hhmm) {
    var p = hhmm.split(":"), h = +p[0], m = p[1];
    var ap = h >= 12 ? "pm" : "am"; h = h % 12 || 12;
    return h + (m === "00" ? "" : ":" + m) + ap;
  }
  window.__t12 = t12;

  /* --- Open / closed right now ------------------------------------------ *
   * Computed in Asia/Kolkata, not the visitor's local clock, so someone
   * browsing from abroad still sees the clinic's real status.            */
  var badges = $$(".js-open-now");
  if (badges.length) {
    var ist;
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata", weekday: "short", hour: "2-digit",
        minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var get = function (t) {
        for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value;
        return "";
      };
      var wd = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(get("weekday"));
      ist = { day: wd, mins: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10) };
    } catch (e) {
      var n = new Date();
      ist = { day: n.getDay(), mins: n.getHours() * 60 + n.getMinutes() };
    }

    var todayHours = C.hours[ist.day], isOpen = false;
    if (todayHours) {
      todayHours.forEach(function (r) {
        var a = r[0].split(":"), b = r[1].split(":");
        if (ist.mins >= +a[0] * 60 + +a[1] && ist.mins < +b[0] * 60 + +b[1]) isOpen = true;
      });
    }
    badges.forEach(function (badge) {
      badge.textContent = isOpen ? "Open now" : "Closed now";
      badge.style.color = isOpen ? "var(--ok)" : "var(--ink-3)";
    });
    $$(".pulse-dot").forEach(function (dot) { dot.classList.toggle("closed", !isOpen); });
  }

  /* --- Scroll reveal ----------------------------------------------------- */
  var items = $$(".reveal");
  if (items.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* --- Gallery lightbox --------------------------------------------------- */
  var figs = $$(".gal figure");
  if (figs.length) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Enlarged photo");
    box.innerHTML = '<button type="button" aria-label="Close">&times;</button><img alt="">';
    document.body.appendChild(box);
    var boxImg = box.querySelector("img");
    var close = function () { box.classList.remove("open"); document.body.style.overflow = ""; };
    figs.forEach(function (f) {
      f.setAttribute("tabindex", "0");
      f.setAttribute("role", "button");
      var open = function () {
        var i = f.querySelector("img");
        if (!i) return;
        boxImg.src = i.currentSrc || i.src;
        boxImg.alt = i.alt || "";
        box.classList.add("open");
        document.body.style.overflow = "hidden";
        box.querySelector("button").focus();
      };
      f.addEventListener("click", open);
      f.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
    box.addEventListener("click", function (e) { if (e.target !== boxImg) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* --- Before & After Comparison Slider ---------------------------------- */
  var baSlider = $(".ba-slider"), baWrap = $(".ba-img-before-wrap"), baHandle = $(".ba-handle");
  if (baSlider && baWrap && baHandle) {
    var isDragging = false;
    var setSliderPos = function (pct) {
      pct = Math.max(0, Math.min(100, pct));
      baWrap.style.width = pct + "%";
      baHandle.style.left = pct + "%";
      baSlider.setAttribute("aria-valuenow", Math.round(pct));
    };

    var updateFromEvent = function (e) {
      var rect = baSlider.getBoundingClientRect();
      var clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      var pos = ((clientX - rect.left) / rect.width) * 100;
      setSliderPos(pos);
    };

    baSlider.addEventListener("mousedown", function (e) {
      isDragging = true;
      updateFromEvent(e);
    });
    window.addEventListener("mousemove", function (e) {
      if (!isDragging) return;
      updateFromEvent(e);
    });
    window.addEventListener("mouseup", function () { isDragging = false; });

    baSlider.addEventListener("touchstart", function (e) {
      isDragging = true;
      updateFromEvent(e);
    }, { passive: true });
    window.addEventListener("touchmove", function (e) {
      if (!isDragging) return;
      updateFromEvent(e);
    }, { passive: true });
    window.addEventListener("touchend", function () { isDragging = false; });

    // Keyboard support
    baSlider.setAttribute("tabindex", "0");
    baSlider.setAttribute("role", "slider");
    baSlider.setAttribute("aria-label", "Before and after comparison slider");
    baSlider.setAttribute("aria-valuemin", "0");
    baSlider.setAttribute("aria-valuemax", "100");
    setSliderPos(50);
    baSlider.addEventListener("keydown", function (e) {
      var currentPct = parseFloat(baHandle.style.left) || 50;
      if (e.key === "ArrowLeft") { setSliderPos(currentPct - 5); e.preventDefault(); }
      else if (e.key === "ArrowRight") { setSliderPos(currentPct + 5); e.preventDefault(); }
    });

    // Case Tabs Switching
    var baTabs = $$(".ba-tab");
    baTabs.forEach(function (t) { t.setAttribute("aria-pressed", String(t.classList.contains("active"))); });
    baTabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        baTabs.forEach(function (t) {
          t.classList.remove("active");
          t.setAttribute("aria-pressed", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-pressed", "true");

        var beforeSrc = tab.getAttribute("data-before");
        var afterSrc = tab.getAttribute("data-after");
        var title = tab.getAttribute("data-title");
        var desc = tab.getAttribute("data-desc");
        var tag = tab.getAttribute("data-tag");

        var imgBefore = $(".ba-img-before");
        var imgAfter = $(".ba-img-after");
        var metaTitle = $(".ba-meta-title");
        var metaDesc = $(".ba-meta-desc");
        var metaTag = $(".ba-case-tag");

        if (imgBefore && beforeSrc) imgBefore.src = beforeSrc;
        if (imgAfter && afterSrc) imgAfter.src = afterSrc;
        if (metaTitle && title) metaTitle.textContent = title;
        if (metaDesc && desc) metaDesc.textContent = desc;
        if (metaTag && tag) metaTag.textContent = tag;

        setSliderPos(50);
      });
    });
  }

  /* --- Reviews Carousel --------------------------------------------------- */
  var reviewsTrack = $(".reviews-track");
  var prevBtn = $("#reviewsPrev"), nextBtn = $("#reviewsNext");
  if (reviewsTrack) {
    /* Card width is min(370px, 86vw) plus the flex gap, so a fixed pixel step
       lands mid-card on narrow screens and fights scroll-snap. Measure it. */
    var step = function () {
      var card = $$(".review-card", reviewsTrack).filter(function (c) { return c.offsetParent !== null; })[0];
      if (!card) return reviewsTrack.clientWidth;
      var gap = parseFloat(getComputedStyle(reviewsTrack).columnGap) || 0;
      return card.getBoundingClientRect().width + gap;
    };
    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        reviewsTrack.scrollBy({ left: -step(), behavior: "smooth" });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        reviewsTrack.scrollBy({ left: step(), behavior: "smooth" });
      });
    }

    // Review Filters
    var filterBtns = $$(".review-filter-btn");
    var reviewCards = $$(".review-card");
    filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b.classList.contains("active"))); });
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filterBtns.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");

        var filter = btn.getAttribute("data-filter");
        reviewCards.forEach(function (card) {
          if (filter === "all" || card.getAttribute("data-category") === filter) {
            card.style.display = "flex";
          } else {
            card.style.display = "none";
          }
        });
        reviewsTrack.scrollTo({ left: 0, behavior: "smooth" });
      });
    });
  }
})();
