/* ==========================================================================
   Appointment request flow.
   Availability is derived from CLINIC.hours / closedDates / minNoticeHours.
   Delivery is pluggable via CLINIC.bookingMode — see config.js.
   NOTE: with no server this sends a REQUEST, not a confirmed booking. The
   copy on the page says so. Swap bookingMode to "endpoint" once a backend
   (Easy!Appointments / Cal.com / Worker) exists and real slot-locking works.
   ========================================================================== */
(function () {
  "use strict";
  var C = window.CLINIC;
  var form = document.getElementById("bookForm");
  if (!form || !C) return;

  var $ = function (s) { return form.querySelector(s); };
  var t12 = window.__t12 || function (x) { return x; };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var ymd = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };

  var dateInput = $("#apptDate");
  var slotBox   = document.getElementById("slotBox");
  var slotNote  = document.getElementById("slotNote");

  /* --- Populate the service chips from config --------------------------- */
  var svcBox = document.getElementById("serviceChips");
  if (svcBox) {
    svcBox.innerHTML = C.services.map(function (s, i) {
      return '<label class="chip"><input type="radio" name="service" value="' + s.id +
             '" data-label="' + s.name + '"' + (i === 0 ? " required" : "") + '>' +
             '<span>' + s.name + '</span></label>';
    }).join("");
  }

  /* --- Date bounds ------------------------------------------------------- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var max = new Date(today); max.setDate(max.getDate() + (C.bookAheadDays || 60));
  dateInput.min = ymd(today);
  dateInput.max = ymd(max);

  function isClosed(dateStr) {
    var d = new Date(dateStr + "T00:00:00");
    if ((C.closedDates || []).indexOf(dateStr) > -1) return "The clinic is closed on this date.";
    if (!C.hours[d.getDay()]) {
      var names = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      return "The clinic is closed on " + names[d.getDay()] + "s. Please pick another day.";
    }
    return null;
  }

  /* --- Build the slot list for a chosen date ---------------------------- */
  function buildSlots(dateStr) {
    slotBox.innerHTML = "";
    slotNote.textContent = "";
    slotNote.className = "hint";
    if (!dateStr) { slotNote.textContent = "Choose a date first to see available times."; return; }

    var shut = isClosed(dateStr);
    if (shut) {
      slotNote.textContent = shut;
      slotNote.className = "closed-note";
      return;
    }

    var d = new Date(dateStr + "T00:00:00");
    var ranges = C.hours[d.getDay()];
    var step = C.slotMinutes || 30;
    var now = new Date();
    var cutoff = new Date(now.getTime() + (C.minNoticeHours || 0) * 3600e3);
    var html = "", count = 0;

    ranges.forEach(function (r) {
      var a = r[0].split(":"), b = r[1].split(":");
      var start = +a[0] * 60 + +a[1], end = +b[0] * 60 + +b[1];
      for (var m = start; m + step <= end; m += step) {
        var slotDate = new Date(d);
        slotDate.setHours(Math.floor(m / 60), m % 60, 0, 0);
        var past = slotDate < cutoff;
        var label = t12(pad(Math.floor(m / 60)) + ":" + pad(m % 60));
        html += '<label class="chip"><input type="radio" name="slot" value="' + label + '"' +
                (past ? " disabled" : "") + '><span>' + label + "</span></label>";
        if (!past) count++;
      }
    });

    slotBox.innerHTML = html;
    if (!count) {
      slotNote.textContent = "No times left today (we need " + (C.minNoticeHours || 0) +
        " hours' notice). Please pick a later date — or call us if it's urgent.";
      slotNote.className = "closed-note";
    } else {
      slotNote.textContent = count + " time" + (count === 1 ? "" : "s") +
        " available. Times are requests — we'll confirm the exact slot with you.";
    }
  }

  dateInput.addEventListener("change", function () { buildSlots(dateInput.value); });
  buildSlots("");

  /* --- Validation -------------------------------------------------------- */
  function fail(el, msgId, msg) {
    var box = document.getElementById(msgId);
    if (box) { box.textContent = msg; box.classList.add("show"); }
    if (el) { el.setAttribute("aria-invalid", "true"); }
    return false;
  }
  function clear(el, msgId) {
    var box = document.getElementById(msgId);
    if (box) box.classList.remove("show");
    if (el) el.removeAttribute("aria-invalid");
  }

  function validate() {
    var ok = true, firstBad = null;
    var name = $("#patName"), phone = $("#patPhone"), date = dateInput;
    var svc = form.querySelector('input[name="service"]:checked');
    var slot = form.querySelector('input[name="slot"]:checked');

    clear(name, "errName"); clear(phone, "errPhone"); clear(date, "errDate");
    clear(null, "errService"); clear(null, "errSlot");

    if (!name.value.trim() || name.value.trim().length < 2) {
      ok = fail(name, "errName", "Please tell us your name."); firstBad = firstBad || name;
    }
    var digits = phone.value.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      ok = fail(phone, "errPhone", "Enter a 10-digit Indian mobile number (starting 6, 7, 8 or 9).");
      firstBad = firstBad || phone;
    }
    if (!svc) { ok = fail(null, "errService", "Please choose what you're coming in for."); firstBad = firstBad || svcBox; }
    if (!date.value) { ok = fail(date, "errDate", "Please choose a date."); firstBad = firstBad || date; }
    else if (isClosed(date.value)) { ok = fail(date, "errDate", isClosed(date.value)); firstBad = firstBad || date; }
    else if (!slot) { ok = fail(null, "errSlot", "Please choose a time."); firstBad = firstBad || slotBox; }

    if (firstBad && firstBad.scrollIntoView) {
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      if (firstBad.focus) firstBad.focus({ preventScroll: true });
    }
    return ok;
  }

  /* --- Collect + deliver -------------------------------------------------- */
  function collect() {
    var svc = form.querySelector('input[name="service"]:checked');
    var slot = form.querySelector('input[name="slot"]:checked');
    var d = new Date(dateInput.value + "T00:00:00");
    return {
      name:    $("#patName").value.trim(),
      phone:   "+91" + $("#patPhone").value.replace(/\D/g, ""),
      email:   $("#patEmail").value.trim(),
      service: svc ? svc.getAttribute("data-label") : "",
      date:    dateInput.value,
      dateLong: d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      time:    slot ? slot.value : "",
      status:  (form.querySelector('input[name="patientType"]:checked') || {}).value || "Not stated",
      notes:   $("#patNotes").value.trim(),
      ref:     "P32-" + Date.now().toString(36).toUpperCase().slice(-6)
    };
  }

  function message(b) {
    return [
      "*Appointment request — " + C.name + "*",
      "Ref: " + b.ref,
      "",
      "Name: " + b.name,
      "Phone: " + b.phone,
      b.email ? "Email: " + b.email : null,
      "Patient: " + b.status,
      "",
      "Treatment: " + b.service,
      "Preferred date: " + b.dateLong,
      "Preferred time: " + b.time,
      b.notes ? "\nNotes: " + b.notes : null,
      "",
      "(Sent from the clinic website — please confirm this slot.)"
    ].filter(Boolean).join("\n");
  }

  function showDone(b, channel) {
    var done = document.getElementById("bookDone");
    document.getElementById("bookStage").classList.add("hide");
    done.classList.remove("hide");
    done.querySelector("#doneRef").textContent = b.ref;
    done.querySelector("#doneSummary").innerHTML =
      "<dt>Treatment</dt><dd>" + esc(b.service) + "</dd>" +
      "<dt>Date</dt><dd>" + esc(b.dateLong) + "</dd>" +
      "<dt>Time</dt><dd>" + esc(b.time) + "</dd>" +
      "<dt>Name</dt><dd>" + esc(b.name) + "</dd>" +
      "<dt>Phone</dt><dd>" + esc(b.phone) + "</dd>";
    var ch = done.querySelector("#doneChannel");
    if (ch) ch.textContent = channel;
    done.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!validate()) return;
    var b = collect(), msg = message(b);
    var mode = C.bookingMode;

    if (mode === "endpoint" && C.bookingEndpoint) {
      var btn = $("#bookSubmit");
      btn.setAttribute("aria-disabled", "true");
      btn.textContent = "Sending…";
      fetch(C.bookingEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b)
      }).then(function (r) {
        if (!r.ok) throw new Error(r.status);
        showDone(b, "sent to the clinic");
      }).catch(function () {
        btn.removeAttribute("aria-disabled");
        btn.textContent = "Request this appointment";
        fail(null, "errSlot", "We couldn't send that. Please call us on " + C.phonePrimary + " instead.");
      });
      return;
    }

    if (mode === "email") {
      window.location.href = "mailto:" + C.email +
        "?subject=" + encodeURIComponent("Appointment request " + b.ref + " — " + b.name) +
        "&body=" + encodeURIComponent(msg.replace(/\*/g, ""));
      showDone(b, "opened in your email app");
      return;
    }

    /* Default: WhatsApp */
    window.open("https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    showDone(b, "opened in WhatsApp");
  });

  /* Fallback links on the confirmation panel */
  var again = document.getElementById("bookAgain");
  if (again) {
    again.addEventListener("click", function () {
      form.reset();
      buildSlots("");
      document.getElementById("bookDone").classList.add("hide");
      document.getElementById("bookStage").classList.remove("hide");
      window.scrollTo({ top: form.offsetTop - 100, behavior: "smooth" });
    });
  }
})();
