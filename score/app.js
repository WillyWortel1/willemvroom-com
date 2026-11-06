(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var MAX_POSTS = 10;
  var MIN_POSTS = 5;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function num(v) {
    var n = parseFloat(String(v).replace(/,/g, "").trim());
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function round(n) {
    return Math.round(n);
  }

  function cleanHandle(h) {
    return String(h || "").trim().replace(/^@+/, "").replace(/\s+/g, "");
  }

  function tip(msg, href) {
    return { msg: msg, href: href };
  }

  function scoreProfile(d) {
    var sc = 0, tips = [], explain = [];
    var name = (d.name || "").trim();
    var bio = (d.bio || "").trim();
    var bl = bio.length;

    if (name.length >= 2) { sc += 12; explain.push("Display name is set."); }
    else { tips.push(tip("Add a clear display name people can remember.", "/x-followers/")); }

    if (d.photo) { sc += 14; explain.push("Profile photo present."); }
    else { tips.push(tip("Add a real profile photo — empty avatars get skipped.", "/x-followers/")); }

    if (d.banner) { sc += 8; explain.push("Banner set."); }
    else { tips.push(tip("A banner makes the profile feel finished.", "/x-followers/")); }

    if (d.link) { sc += 10; explain.push("Link present."); }
    else { tips.push(tip("Add one link (site, newsletter, or lead magnet).", "/x-followers/")); }

    if (d.pin) { sc += 14; explain.push("Pinned post present."); }
    else { tips.push(tip("Pin your best intro or proof post.", "/hooks/")); }

    if (bl === 0) {
      tips.push(tip("Write a bio: who you help + what you post about.", "/x-followers/"));
    } else if (bl < 40) {
      sc += 8;
      tips.push(tip("Bio is short. Name who you help and one outcome.", "/x-followers/"));
    } else if (bl <= 160) {
      sc += 22;
      explain.push("Bio length looks usable.");
      if (!/[?!.]/.test(bio) && !/\b(I|help|for|about)\b/i.test(bio)) {
        tips.push(tip("Make the bio specific: audience + topic in one line.", "/x-followers/"));
      } else {
        sc += 6;
      }
    } else {
      sc += 14;
      tips.push(tip("Bio is long. Cut to one sharp line plus a proof detail.", "/x-followers/"));
    }

    if (/https?:\/\//.test(bio)) {
      sc = Math.max(0, sc - 4);
      tips.push(tip("Prefer the link field over a URL inside the bio.", "/x-algorithm/"));
    }

    while (tips.length < 2 && explain.length) {
      tips.push(tip("Keep the profile consistent with what you post.", "/toolkit/"));
      break;
    }
    if (!tips.length) tips.push(tip("Profile basics look solid — keep the pin fresh.", "/hooks/"));

    return {
      key: "profile",
      label: "Profile",
      score: clamp(round(sc), 0, 100),
      explain: explain.length ? explain.join(" ") : "Profile signals from name, bio and setup.",
      tips: tips.slice(0, 3)
    };
  }

  function scoreActivity(d) {
    var ppw = d.ppw, tips = [], explain, sc;
    if (ppw <= 0) {
      sc = 10;
      explain = "No weekly posting rhythm entered.";
      tips = [
        tip("Aim for a steady cadence you can keep (often 3–7 posts/week).", "/x-timing/"),
        tip("Consistency beats bursts — For You favors fresh posts.", "/x-timing/")
      ];
    } else if (ppw < 2) {
      sc = 45;
      explain = "Light posting: " + ppw + " posts/week.";
      tips = [
        tip("Post a bit more often so new people can find you.", "/x-timing/"),
        tip("Pair fewer posts with stronger replies in your niche.", "/reply/")
      ];
    } else if (ppw <= 7) {
      sc = 88;
      explain = "Healthy rhythm: " + ppw + " posts/week.";
      tips = [
        tip("Protect the first hours after posting — reply to early comments.", "/x-timing/"),
        tip("Quality over volume inside this range.", "/toolkit/")
      ];
    } else if (ppw <= 14) {
      sc = 70;
      explain = "High volume: " + ppw + " posts/week.";
      tips = [
        tip("High volume can dilute quality. Cut weak posts first.", "/x-negative-signals/"),
        tip("Watch for “not interested” if posts feel repetitive.", "/x-negative-signals/")
      ];
    } else {
      sc = 40;
      explain = "Very high volume: " + ppw + " posts/week.";
      tips = [
        tip("This pace often looks spammy. Slow down and raise the bar.", "/x-negative-signals/"),
        tip("Fewer, clearer posts usually travel further.", "/toolkit/")
      ];
    }
    tips.push(tip("Posts older than ~48 hours leave For You — timing matters.", "/x-timing/"));
    return { key: "activity", label: "Activity", score: sc, explain: explain, tips: tips.slice(0, 3) };
  }

  function scoreEngagement(d, posts) {
    var tips = [], followers = Math.max(d.followers, 1);
    if (!posts.length) {
      return {
        key: "engagement",
        label: "Engagement",
        score: 25,
        explain: "Add recent posts with likes / replies / reposts to estimate engagement.",
        tips: [
          tip("Paste 5–10 recent posts so the rate is meaningful.", "/toolkit/"),
          tip("Replies weigh more than likes in X’s published weights.", "/x-algorithm/")
        ]
      };
    }
    var totalWeighted = 0;
    posts.forEach(function (p) {
      totalWeighted += p.likes * 1 + p.replies * 5 + p.reposts * 2;
    });
    var perPost = totalWeighted / posts.length;
    var rate = perPost / followers; // weighted engagements per follower per post
    var pct = rate * 100;
    var sc;
    var explain = "≈ " + (Math.round(pct * 100) / 100) + "% weighted eng. per follower per post (replies ×5, reposts ×2, likes ×1).";

    if (pct >= 2) sc = 92;
    else if (pct >= 1) sc = 80;
    else if (pct >= 0.4) sc = 68;
    else if (pct >= 0.15) sc = 52;
    else if (pct >= 0.05) sc = 38;
    else sc = 22;

    if (d.followers < 100) {
      sc = clamp(sc + 8, 0, 100);
      explain += " Small audience: rates swing a lot.";
    }

    if (sc < 50) {
      tips.push(tip("Write posts people want to reply to — ask a real question.", "/reply/"));
      tips.push(tip("A sharper first line lifts engagement more than posting more.", "/hooks/"));
    } else {
      tips.push(tip("Keep inviting replies; reply weight (+5.0) beats likes (+0.66).", "/x-algorithm/"));
      tips.push(tip("On useful posts, a “Who needs this?” can lift shares.", "/x-shares/"));
    }
    tips.push(tip("Avoid reply bait — it can trigger negative signals.", "/x-negative-signals/"));
    return { key: "engagement", label: "Engagement", score: sc, explain: explain, tips: tips.slice(0, 3) };
  }

  function scoreGrowth(d) {
    var tips = [], followers = d.followers, following = d.following, sc, explain, ratio;
    if (followers === 0 && following === 0) {
      return {
        key: "growth",
        label: "Growth",
        score: 20,
        explain: "Enter follower and following counts.",
        tips: [
          tip("Followers matter as a signal; mutual follows get a boost.", "/x-followers/"),
          tip("Grow with useful posts and thoughtful replies, not follow-for-follow.", "/reply/")
        ]
      };
    }
    ratio = following === 0 ? (followers > 0 ? 99 : 0) : followers / following;
    explain = "Follower / following ratio ≈ " + (Math.round(ratio * 100) / 100) + ".";

    if (ratio >= 3) sc = 90;
    else if (ratio >= 1.5) sc = 78;
    else if (ratio >= 1) sc = 65;
    else if (ratio >= 0.5) sc = 48;
    else if (ratio >= 0.25) sc = 32;
    else sc = 18;

    // Following thousands with few followers looks spammy
    if (following > 2000 && ratio < 0.5) {
      sc = Math.min(sc, 28);
      tips.push(tip("Following far more people than follow you can look like spam.", "/x-followers/"));
    }

    if (ratio < 1) {
      tips.push(tip("Earn follows with pinned proof and niche replies, then unfollow noise.", "/x-followers/"));
      tips.push(tip("Thoughtful replies on relevant accounts still work.", "/reply/"));
    } else {
      tips.push(tip("Healthy ratio. Keep attracting follows with useful posts.", "/x-followers/"));
      tips.push(tip("Mutual follows get extra weight in the code — real relationships help.", "/x-followers/"));
    }
    if (tips.length < 2) tips.push(tip("Avoid follow-for-follow schemes.", "/x-negative-signals/"));
    return { key: "growth", label: "Growth", score: sc, explain: explain, tips: tips.slice(0, 3) };
  }

  function scoreContent(posts) {
    var tips = [];
    if (!posts.length) {
      return {
        key: "content",
        label: "Content",
        score: 25,
        explain: "Paste recent posts to score hooks, questions, length and links.",
        tips: [
          tip("Start every post with a specific first line.", "/hooks/"),
          tip("Questions invite replies (weight +5.0).", "/reply/"),
          tip("Prefer links in a reply, not the first post.", "/x-algorithm/")
        ]
      };
    }
    var n = posts.length;
    var withQ = 0, withLink = 0, shortHook = 0, tooShort = 0, tooLong = 0, bait = 0, lineBreaks = 0;
    posts.forEach(function (p) {
      var t = p.text || "";
      var first = (t.split(/\n/)[0] || "").trim();
      if (/\?/.test(t)) withQ++;
      if (/https?:\/\//.test(t)) withLink++;
      if (first.length >= 15 && first.length <= 100) shortHook++;
      if (t.trim().length < 40) tooShort++;
      if (t.length > 280) tooLong++;
      if (/\n/.test(t.trim())) lineBreaks++;
      if (/(reply|comment) (with|below)|like if|rt if|follow (me|for)|tag a friend/i.test(t)) bait++;
    });
    var sc = 40;
    sc += Math.round((shortHook / n) * 22);
    sc += Math.round((withQ / n) * 18);
    sc += Math.round((lineBreaks / n) * 8);
    sc -= Math.round((withLink / n) * 12);
    sc -= Math.round((tooShort / n) * 10);
    sc -= Math.round((tooLong / n) * 8);
    sc -= Math.round((bait / n) * 20);
    sc = clamp(round(sc), 0, 100);

    var explain = shortHook + "/" + n + " posts with a readable first line · " +
      withQ + "/" + n + " ask a question · " + withLink + "/" + n + " include a link.";

    if (shortHook / n < 0.5) tips.push(tip("Tighten the first line — treat it like a headline.", "/how-to-hook/"));
    else tips.push(tip("Hooks look decent. Keep varying patterns so they don’t go stale.", "/hooks/"));

    if (withQ / n < 0.3) tips.push(tip("Ask more real questions to invite replies.", "/reply/"));
    else tips.push(tip("Good question rate. Make sure each question is answerable.", "/how-to-reply/"));

    if (withLink / n > 0.3) tips.push(tip("Move links to the first reply more often.", "/x-algorithm/"));
    else if (bait) tips.push(tip("Drop reply-bait CTAs — they invite mutes and “not interested”.", "/x-negative-signals/"));
    else tips.push(tip("On useful posts, try a share prompt like “Who needs this?”.", "/share-hooks/"));

    return { key: "content", label: "Content", score: sc, explain: explain, tips: tips.slice(0, 3) };
  }

  function totalScore(parts) {
    // Profile 20, Activity 15, Engagement 25, Growth 15, Content 25
    var w = { profile: 0.20, activity: 0.15, engagement: 0.25, growth: 0.15, content: 0.25 };
    var sum = 0;
    parts.forEach(function (p) { sum += p.score * (w[p.key] || 0); });
    return clamp(round(sum), 0, 100);
  }

  function collectPostsFromRows() {
    var rows = document.querySelectorAll(".post-row");
    var out = [];
    rows.forEach(function (row) {
      var text = row.querySelector(".p-text").value.trim();
      if (!text) return;
      out.push({
        text: text,
        likes: num(row.querySelector(".p-likes").value),
        replies: num(row.querySelector(".p-replies").value),
        reposts: num(row.querySelector(".p-reposts").value)
      });
    });
    return out;
  }

  function parsePaste(raw) {
    var chunks = String(raw || "").split(/\n\s*---\s*\n|\n{3,}/);
    var out = [];
    chunks.forEach(function (chunk) {
      var lines = chunk.trim().split(/\n/);
      if (!lines.length || !lines[0].trim()) return;
      var meta = { likes: 0, replies: 0, reposts: 0 };
      var body = [];
      lines.forEach(function (line) {
        var m = line.match(/^\s*(likes?|replies|reposts?|rts?)\s*[:=]\s*([\d,.]+)/i);
        if (m) {
          var k = m[1].toLowerCase();
          var v = num(m[2]);
          if (k.indexOf("like") === 0) meta.likes = v;
          else if (k.indexOf("repl") === 0) meta.replies = v;
          else meta.reposts = v;
          return;
        }
        var m2 = line.match(/likes?\s*[:=]?\s*([\d,.]+).*replies?\s*[:=]?\s*([\d,.]+).*reposts?\s*[:=]?\s*([\d,.]+)/i);
        if (m2) {
          meta.likes = num(m2[1]);
          meta.replies = num(m2[2]);
          meta.reposts = num(m2[3]);
          return;
        }
        var m3 = line.match(/^\s*([\d,.]+)\s*[|/]\s*([\d,.]+)\s*[|/]\s*([\d,.]+)\s*$/);
        if (m3) {
          meta.likes = num(m3[1]);
          meta.replies = num(m3[2]);
          meta.reposts = num(m3[3]);
          return;
        }
        body.push(line);
      });
      var text = body.join("\n").trim();
      if (text) out.push({ text: text, likes: meta.likes, replies: meta.replies, reposts: meta.reposts });
    });
    return out.slice(0, MAX_POSTS);
  }

  function addPostRow(data) {
    data = data || { text: "", likes: "", replies: "", reposts: "" };
    var wrap = $("posts");
    if (wrap.querySelectorAll(".post-row").length >= MAX_POSTS) return;
    var div = document.createElement("div");
    div.className = "post-row";
    div.innerHTML =
      '<label class="f">Post text<textarea class="p-text" rows="3" placeholder="Paste one post…">' + esc(data.text || "") + "</textarea></label>" +
      '<div class="nums">' +
      '<label class="f">Likes<input class="p-likes" type="number" min="0" value="' + esc(data.likes === "" ? "" : data.likes) + '"></label>' +
      '<label class="f">Replies<input class="p-replies" type="number" min="0" value="' + esc(data.replies === "" ? "" : data.replies) + '"></label>' +
      '<label class="f">Reposts<input class="p-reposts" type="number" min="0" value="' + esc(data.reposts === "" ? "" : data.reposts) + '"></label>' +
      "</div>" +
      '<button type="button" class="chip p-remove">Remove</button>';
    wrap.appendChild(div);
  }

  function fillRowsFromPosts(posts) {
    $("posts").innerHTML = "";
    posts.forEach(function (p) { addPostRow(p); });
    while ($("posts").querySelectorAll(".post-row").length < Math.min(MIN_POSTS, MAX_POSTS)) addPostRow();
  }

  function renderResults(handle, parts, total) {
    $("out-handle").textContent = "@" + (handle || "you");
    $("total").textContent = total;
    $("total-bar").style.width = total + "%";
    var html = parts.map(function (p) {
      return '<div class="sub" id="sub-' + p.key + '">' +
        '<div class="sub-head"><h3>' + esc(p.label) + "</h3><b>" + p.score + "</b></div>" +
        '<div class="bar"><i style="width:' + p.score + '%"></i></div>' +
        "<p>" + esc(p.explain) + "</p>" +
        '<ul class="tips">' + p.tips.map(function (t) {
          return "<li>" + esc(t.msg) + ' <a href="' + t.href + '">Why?</a></li>';
        }).join("") + "</ul></div>";
    }).join("");
    $("subs").innerHTML = html;
    $("results").hidden = false;
    $("share-box").hidden = false;

    var lines = [
      "My X Account Score: " + total + "/100",
      "",
      parts.map(function (p) { return p.label + ": " + p.score; }).join(" · "),
      "",
      "Rule-based estimate (not X’s score) via @willemvroom",
      "https://willemvroom.com/score/"
    ];
    if (handle) lines[0] = "@" + handle + " Account Score: " + total + "/100";
    var text = lines.join("\n");
    $("share-text").value = text;
    $("btn-post").href = "https://x.com/intent/post?text=" + encodeURIComponent(text);
    $("results").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function readForm() {
    return {
      handle: cleanHandle($("handle").value),
      name: $("name").value,
      bio: $("bio").value,
      photo: $("has-photo").checked,
      banner: $("has-banner").checked,
      link: $("has-link").checked,
      pin: $("has-pin").checked,
      followers: num($("followers").value),
      following: num($("following").value),
      ppw: num($("ppw").value)
    };
  }

  function runScore(e) {
    if (e) e.preventDefault();
    var d = readForm();
    var posts = collectPostsFromRows();
    if (!posts.length) {
      var pasted = parsePaste($("paste").value);
      if (pasted.length) {
        fillRowsFromPosts(pasted);
        posts = collectPostsFromRows();
      }
    }
    var parts = [
      scoreProfile(d),
      scoreActivity(d),
      scoreEngagement(d, posts),
      scoreGrowth(d),
      scoreContent(posts)
    ];
    renderResults(d.handle, parts, totalScore(parts));
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
    for (var i = 0; i < MIN_POSTS; i++) addPostRow();
    $("add-post").addEventListener("click", function () { addPostRow(); });
    $("posts").addEventListener("click", function (e) {
      var b = e.target.closest(".p-remove");
      if (!b) return;
      var row = b.closest(".post-row");
      if (row) row.remove();
    });
    $("parse-paste").addEventListener("click", function () {
      var posts = parsePaste($("paste").value);
      if (!posts.length) {
        alert("No posts found. Use blank lines or --- between posts, and a likes/replies/reposts line.");
        return;
      }
      fillRowsFromPosts(posts);
    });
    $("form").addEventListener("submit", runScore);
    $("btn-reset").addEventListener("click", function () {
      $("form").reset();
      $("posts").innerHTML = "";
      for (var i = 0; i < MIN_POSTS; i++) addPostRow();
      $("results").hidden = true;
      $("share-box").hidden = true;
    });
    $("btn-copy").addEventListener("click", function () {
      var t = $("share-text").value;
      var btn = $("btn-copy");
      (navigator.clipboard && window.isSecureContext
        ? navigator.clipboard.writeText(t)
        : Promise.reject()
      ).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy result"; }, 1200);
      }).catch(function () { window.prompt("Copy:", t); });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
