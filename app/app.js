(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var HOOKS = window.HOOKS || [];
  var ANGLES = window.REPLY_ANGLES || [];
  var TABS = ["write", "hook", "score", "reply", "timing", "post"];
  var text = "";
  var threadParts = null;

  var BOLD_MAP = (function () {
    var m = {}, i, from, to;
    from = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    to = "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗";
    for (i = 0; i < from.length; i++) m[from[i]] = Array.from(to)[i];
    return m;
  })();
  var ITALIC_MAP = (function () {
    var m = {}, i, from, to;
    from = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    to = "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧";
    for (i = 0; i < from.length; i++) m[from[i]] = Array.from(to)[i];
    return m;
  })();

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function xlen(s) {
    return Array.from(String(s).replace(/https?:\/\/\S+/g, "x".repeat(23))).reduce(function (n, c) {
      return n + (c.codePointAt(0) > 0x2000 ? 2 : 1);
    }, 0);
  }

  function mapChars(s, map) {
    return Array.from(s).map(function (c) { return map[c] || c; }).join("");
  }

  function wrapSelection(map) {
    var el = $("composer");
    var start = el.selectionStart, end = el.selectionEnd;
    if (start === end) return;
    var before = el.value.slice(0, start);
    var mid = el.value.slice(start, end);
    var after = el.value.slice(end);
    el.value = before + mapChars(mid, map) + after;
    el.focus();
    el.setSelectionRange(start, start + Array.from(mapChars(mid, map)).length);
    onInput();
  }

  function splitThread(t) {
    var limit = 270;
    var words = t.split(/(\s+)/);
    var out = [], cur = "";
    words.forEach(function (w) {
      if (xlen(cur + w) > limit && cur.trim()) {
        out.push(cur.trim());
        cur = w.trimStart();
      } else cur += w;
    });
    if (cur.trim()) out.push(cur.trim());
    if (out.length <= 1) return out;
    return out.map(function (p, i) { return p + " " + (i + 1) + "/" + out.length; });
  }

  function firstLine(t) {
    return (t.split(/\n/)[0] || "").trim();
  }

  function scorePost(t) {
    var sc = 50, tips = [], L = xlen(t), low = t.toLowerCase(), fl = firstLine(t);
    function a(d, msg, good, why) {
      sc += d;
      tips.push({ good: good, msg: msg, why: why });
    }
    if (!t.trim()) {
      return { sc: 0, tips: [{ good: false, msg: "Start writing. The score updates as you type.", why: "/toolkit/" }] };
    }
    if (fl.length >= 15 && fl.length <= 100) a(10, "First line is a readable hook (under ~100 characters).", true, "/hooks/");
    else if (fl.length > 100) a(-6, "First line is long. Put the strongest idea before “Show more”.", false, "/hooks/");
    else a(-5, "Make the first line a short, specific hook.", false, "/how-to-hook/");

    if (/\d/.test(fl)) a(4, "A number in the hook makes it specific.", true, "/hooks/");

    if (L > 280 && !(threadParts && threadParts.length > 1)) a(-10, "Over 280 characters. Split into a thread or cut.", false, "/toolkit/");
    else if (L < 50) a(-6, "Very short. Add one concrete detail so people stay (dwell is a signal).", false, "/x-algorithm/");
    else if (L <= 280) a(6, "Length fits in one post.", true, "/toolkit/");

    if (/\n/.test(t.trim())) a(4, "Line breaks make the post easier to skim.", true, "/toolkit/");
    else a(-2, "Add a line break or two for scannability.", false, "/toolkit/");

    if (/https?:\/\//.test(t)) a(-4, "External link in the post: people may leave. Prefer the link in a reply.", false, "/x-algorithm/");
    else a(3, "No external link in the post body.", true, "/x-algorithm/");

    if (/\?/.test(t)) a(8, "Asks a question: replies (+5.0) are a strong signal.", true, "/reply/");
    else a(0, "A real question can invite replies (weight +5.0).", false, "/reply/");

    if (/(reply|comment) (with|below)|drop a|type ["']?(yes|1|me)|like if|rt if|retweet if|follow (me|for)|smash|tag \d|tag a friend/.test(low))
      a(-15, "Reply bait or pushy CTA. That can trigger “not interested” (−52) or mutes (−58.8).", false, "/x-negative-signals/");

    if (/#\w+.*#\w+.*#\w+/.test(t)) a(-5, "Many hashtags look spammy.", false, "/x-algorithm/");

    if (/!!!|[A-Z]{8,}/.test(t)) a(-4, "Shouting (caps, !!!) tends to read as low quality.", false, "/x-algorithm/");

    if (/(who needs this|who should see this|know someone)/i.test(t))
      a(6, "Share prompt present: copy link (+20) is the top positive weight when the post is useful.", true, "/x-shares/");

    return { sc: Math.max(0, Math.min(100, sc)), tips: tips };
  }

  function renderScore() {
    var c = scorePost(text);
    $("badge-score").textContent = c.sc;
    $("panel-score").textContent = c.sc;
    $("score-bar").style.width = c.sc + "%";
    $("score-tips").innerHTML = c.tips.map(function (t) {
      return '<li class="' + (t.good ? "ok" : "warn") + '">' +
        (t.good ? "✓ " : "! ") + esc(t.msg) +
        ' <a href="' + t.why + '">Why?</a></li>';
    }).join("");
  }

  function onInput() {
    text = $("composer").value;
    var L = xlen(text);
    var cnt = $("char-count");
    cnt.textContent = L + " / 280";
    cnt.className = "cnt" + (L > 280 ? " over" : "");
    $("composer").className = "composer" + (L > 280 ? " over" : "");
    if (threadParts) {
      threadParts = null;
      $("thread-list").hidden = true;
      $("btn-clear-thread").hidden = true;
    }
    updatePostLink();
    renderScore();
  }

  function updatePostLink() {
    var payload = (threadParts && threadParts.length) ? threadParts[0] : text;
    $("btn-post").href = "https://x.com/intent/post?text=" + encodeURIComponent(payload);
    var note = $("post-note");
    if (threadParts && threadParts.length > 1) {
      note.textContent = "Thread: " + threadParts.length + " parts. Posting opens part 1; reply with the rest.";
    } else if (xlen(text) > 280) {
      note.textContent = "Draft is over 280 characters. Split into a thread in Write, or shorten it.";
    } else {
      note.textContent = text.trim() ? "Ready to post." : "Write something first.";
    }
  }

  function showTab(name) {
    TABS.forEach(function (t) {
      var on = t === name;
      $("tab-" + t).setAttribute("aria-selected", on ? "true" : "false");
      $("pane-" + t).hidden = !on;
    });
    if (name === "score") renderScore();
    if (name === "timing") renderTiming();
    if (name === "post") updatePostLink();
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
  }

  var TONE_PICK = {
    direct: [2, 3, 7, 11, 16, 18],
    curious: [0, 7, 13, 19, 9, 14],
    bold: [1, 13, 16, 11, 3, 6],
    helpful: [10, 9, 14, 15, 17, 2],
    story: [4, 5, 12, 18, 19, 8]
  };

  function fillTemplate(tpl, topic) {
    var t = topic.trim() || "this";
    var i = 0;
    return tpl.replace(/\{[^}]*\}/g, function () {
      i++;
      if (i === 1) return t;
      return "…";
    });
  }

  function buildHooks() {
    var topic = $("hook-topic").value.trim() || "this";
    var tone = $("hook-tone").value;
    var idxs = (TONE_PICK[tone] || TONE_PICK.direct).slice();
    var extras = [];
    for (var i = 0; i < HOOKS.length && idxs.length + extras.length < 10; i++) {
      if (idxs.indexOf(i) === -1) extras.push(i);
    }
    var pick = idxs.concat(extras).slice(0, 10);
    var list = $("hook-list");
    list.innerHTML = pick.map(function (ix) {
      var h = HOOKS[ix];
      if (!h) return "";
      var line = fillTemplate(h.fill || h.tpl || "", topic);
      return '<li><button type="button" data-hook="' + esc(line) + '">' + esc(line) +
        '<br><small style="opacity:.6">' + esc(h.name) + "</small></button></li>";
    }).join("");
  }

  function insertHook(line) {
    var body = text.replace(/^\s+/, "");
    var next = line + (body ? "\n\n" + body : "");
    $("composer").value = next;
    onInput();
    showTab("write");
    $("composer").focus();
  }

  function buildReplies() {
    var src = $("reply-src").value.trim();
    var list = $("reply-list");
    if (!src) {
      list.innerHTML = "<li><p class='hint'>Paste a post first.</p></li>";
      return;
    }
    var want = ["example", "question", "counter"];
    var labels = {
      example: "Add value",
      question: "Ask a question",
      counter: "Politely disagree"
    };
    var out = [];
    want.forEach(function (id) {
      var a = ANGLES.filter(function (x) { return x.id === id; })[0];
      if (!a) return;
      var tpl = (a.t && a.t[0]) || a.good || "";
      var snippet = src.length > 80 ? src.slice(0, 77) + "…" : src;
      var filled = tpl
        .replace(/\[specific situation\]/gi, "what you described")
        .replace(/\[What happened\]/gi, "what changed")
        .replace(/\[result\]/gi, "the result")
        .replace(/\[who\/what\]/gi, "someone in this niche")
        .replace(/\[what they did\]/gi, "tried this")
        .replace(/\[outcome\]/gi, "it worked")
        .replace(/\[action\]/gi, "one concrete step")
        .replace(/\[next step\]/gi, "measure what happens")
        .replace(/\[Why it works\]/gi, "It invites a real reply.")
        .replace(/\[specific variable\]/gi, "the part that moved the needle")
        .replace(/\[factor\]/gi, "the main change")
        .replace(/\[option A\]/gi, "option A")
        .replace(/\[option B\]/gi, "option B")
        .replace(/\[situation\]/gi, "this comes up")
        .replace(/\[exception\]/gi, "one caveat")
        .replace(/\[reason\]/gi, "context changes the advice")
        .replace(/\[alternative\]/gi, "I'd try a smaller test first")
        .replace(/\[claim\]/gi, "this")
        .replace(/\[group\]/gi, "large accounts")
        .replace(/\[other group\]/gi, "new accounts");
      out.push({
        label: labels[id] || a.name,
        text: filled,
        tip: a.use || "",
        ref: snippet
      });
    });
    list.innerHTML = out.map(function (r) {
      return '<li><button type="button" data-reply="' + esc(r.text) + '"><strong>' +
        esc(r.label) + "</strong><br>" + esc(r.text) +
        '<br><small style="opacity:.6">' + esc(r.tip) + "</small></button></li>";
    }).join("");
  }

  var REGIONS = {
    "us-east": { name: "US East", tz: "America/New_York", hours: [8, 12, 17] },
    "us-west": { name: "US West", tz: "America/Los_Angeles", hours: [8, 12, 17] },
    "uk": { name: "UK / Ireland", tz: "Europe/London", hours: [8, 12, 18] },
    "eu": { name: "Western Europe", tz: "Europe/Amsterdam", hours: [8, 12, 18] },
    "india": { name: "India", tz: "Asia/Kolkata", hours: [9, 13, 20] },
    "sea": { name: "SE Asia / Australia", tz: "Australia/Sydney", hours: [8, 12, 19] }
  };

  function formatInLocal(regionHour, regionTz) {
    var now = new Date();
    // Build a date that is `regionHour:00` today in regionTz, then show in local.
    var probe = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
    // Iterate offsets to find UTC time that formats as regionHour in regionTz
    var best = null;
    for (var h = 0; h < 24; h++) {
      var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, 0, 0));
      var parts = new Intl.DateTimeFormat("en-US", { timeZone: regionTz, hour: "numeric", hour12: false }).formatToParts(d);
      var rh = parseInt(parts.filter(function (p) { return p.type === "hour"; })[0].value, 10);
      if (rh === 24) rh = 0;
      if (rh === regionHour) { best = d; break; }
    }
    if (!best) best = probe;
    var local = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(best);
    var region = new Intl.DateTimeFormat("en-US", { timeZone: regionTz, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(best);
    return { local: local, region: region };
  }

  function renderTiming() {
    var boxes = $("region-boxes").querySelectorAll("input[type=checkbox]");
    var selected = [];
    boxes.forEach(function (b) { if (b.checked) selected.push(b.value); });
    var ul = $("windows");
    if (!selected.length) {
      ul.innerHTML = "<li>Select at least one audience region.</li>";
      return;
    }
    var localTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "local";
    var html = selected.map(function (key) {
      var r = REGIONS[key];
      if (!r) return "";
      var times = r.hours.map(function (h) {
        var f = formatInLocal(h, r.tz);
        return '<span class="when">' + esc(f.local) + "</span> <small>(" + esc(f.region) + " there)</small>";
      }).join("<br>");
      return "<li><strong>" + esc(r.name) + "</strong><br>" + times +
        "<small>Shown in your timezone (" + esc(localTz) + "). General guidance.</small></li>";
    }).join("");
    ul.innerHTML = html;
  }

  function initLearn() {
    var btn = $("learn-btn"), menu = $("learn-menu");
    btn.addEventListener("click", function () {
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("click", function (e) {
      if (!btn.parentElement.contains(e.target)) {
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        menu.hidden = true;
        btn.setAttribute("aria-expanded", "false");
      }
    });
  }

  function init() {
    initLearn();
    TABS.forEach(function (t) {
      $("tab-" + t).addEventListener("click", function () { showTab(t); });
    });
    $("composer").addEventListener("input", onInput);
    $("btn-bold").addEventListener("click", function () { wrapSelection(BOLD_MAP); });
    $("btn-italic").addEventListener("click", function () { wrapSelection(ITALIC_MAP); });
    $("btn-split").addEventListener("click", function () {
      var parts = splitThread(text.trim());
      if (!text.trim()) return;
      threadParts = parts;
      var ul = $("thread-list");
      ul.hidden = false;
      $("btn-clear-thread").hidden = false;
      ul.innerHTML = parts.map(function (p, i) {
        return "<li>" + esc(p) + "<small>Part " + (i + 1) + " · " + xlen(p) + " / 280</small></li>";
      }).join("");
      updatePostLink();
    });
    $("btn-clear-thread").addEventListener("click", function () {
      threadParts = null;
      $("thread-list").hidden = true;
      $("btn-clear-thread").hidden = true;
      updatePostLink();
    });
    $("btn-hooks").addEventListener("click", buildHooks);
    $("hook-list").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-hook]");
      if (b) insertHook(b.getAttribute("data-hook"));
    });
    $("btn-replies").addEventListener("click", buildReplies);
    $("reply-list").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-reply]");
      if (!b) return;
      $("composer").value = b.getAttribute("data-reply");
      onInput();
      showTab("write");
      $("composer").focus();
    });
    $("region-boxes").addEventListener("change", renderTiming);
    $("btn-copy").addEventListener("click", function () {
      var payload = (threadParts && threadParts.length) ? threadParts.join("\n\n") : text;
      var btn = $("btn-copy");
      (navigator.clipboard && window.isSecureContext
        ? navigator.clipboard.writeText(payload)
        : Promise.reject()
      ).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy text"; }, 1200);
      }).catch(function () {
        window.prompt("Copy:", payload);
      });
    });
    var hash = (location.hash || "").replace(/^#/, "");
    showTab(TABS.indexOf(hash) >= 0 ? hash : "write");
    onInput();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
