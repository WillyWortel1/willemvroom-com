(function(){
var $=function(i){return document.getElementById(i)},H=window.HOOKS||[],R=window.REPLY_ANGLES||[],K="wv-toolkit-app-v1";
var SH=["Who needs this?","Who should see this?","Know someone who'd use this?","Who's this for in your life?","Who would this help?","Who needs this before Monday?","Who's about to make this mistake?","Know someone starting with {topic}?","Who in your group chat needs this?","Who did this remind you of?","Which friend needs this checklist?","Who's still doing this the hard way?","Know a founder who needs this?","Who's planning a {trip/launch} soon?","Who should read this before they decide?","Who would steal this template?","Anyone you'd send this to?","Who asked you about this last week?"];
var S={};try{S=JSON.parse(localStorage.getItem(K))||{}}catch(e){}
S.h=S.h||0;S.vals=S.vals||[];S.body=S.body||"";S.useful=!!S.useful;S.sq=S.sq||0;S.hist=S.hist||[];S.ra=S.ra||0;S.rurl=S.rurl||"";S.rtext=S.rtext||"";S.thread=!!S.thread;
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function xlen(s){return Array.from(s.replace(/https?:\/\/\S+/g,"x".repeat(23))).reduce(function(n,c){return n+(c.codePointAt(0)>0x2000?2:1)},0)}
function hook(){return H[S.h]||{fill:"",labels:[]}}
function line(){var h=hook(),i=0;return (h.fill||h.tpl||"").replace(/\{[^}]*\}/g,function(m){var v=(S.vals[i]||"").trim();i++;return v||m})}
function full(){var t=line()+(S.body.trim()?"\n\n"+S.body.trim():"");if(S.useful)t+="\n\n"+SH[S.sq];return t}
function split(t){var out=[],words=t.split(/(\s+)/),cur="";words.forEach(function(w){if(xlen(cur+w)>270&&cur.trim()){out.push(cur.trim());cur=w.trimStart()}else cur+=w});if(cur.trim())out.push(cur.trim());return out.length>1?out.map(function(p,i){return p+" "+(i+1)+"/"+out.length}):out}
function check(t){var sc=50,tips=[],L=xlen(t),low=t.toLowerCase();
 function a(d,m,good){sc+=d;tips.push([good,m])}
 if(/^.{0,100}(\n|$)/.test(t)&&t.split("\n")[0].trim().length>15)a(8,"Hook line is under 100 characters.",1);else a(-6,"Make the first line a short, specific hook (under ~100 chars).",0);
 if(/\d/.test(t.split("\n")[0]))a(4,"Numbers in the hook make it specific.",1);
 if(L>280&&!S.thread)a(-8,"Over 280 characters: turn on thread mode or cut.",0);else if(L<60)a(-6,"Very short. Add one concrete detail so people stay to read (dwell is a signal).",0);else a(6,"Length is readable in one go.",1);
 if(/https?:\/\//.test(t))a(-3,"A link in the post: open link is +0.2 in param.rs, no penalty there, but people may leave. Consider the link in a reply (uncertain).",0);
 if(S.media)a(3,"Media attached: photo expand +0.05, video open +0.02 are small weights; use media when it helps the point.",1);
 if(/\?/.test(t.replace(SH[S.sq],"")))a(6,"Asks a real question: replies (+5.0) are a strong signal.",1);
 if(/(reply|comment) (with|below)|drop a|type ["']?(yes|1|me)|like if|rt if|retweet if|follow (me|for)|smash|tag \d|tag a friend/.test(low))a(-15,"Reply bait or pushy CTA detected. It can trigger 'not interested' (−52.272) or mutes (−58.8).",0);
 if(/#\w+.*#\w+.*#\w+/.test(t))a(-5,"Many hashtags look spammy.",0);
 if(S.useful)a(8,"Share question on a useful post: copy link (+20) and DM (+5) are the top weights.",1);else a(0,"If the post is genuinely useful, add a 'Who needs this?' question.",0);
 if(/!!!|[A-Z]{8,}/.test(t))a(-4,"Shouting (caps, !!!) tends to read as low quality.",0);
 return{sc:Math.max(0,Math.min(100,sc)),tips:tips}}
function botP(){return"Improve my X post. Keep my voice, US English, hook line first under 100 characters, max 280 characters per post, no hashtags, no reply bait.\n\nHook type: "+(hook().name||"")+"\n\nMy post:\n"+full()+"\n\nGive 3 improved versions. Say nothing else."}
function botR(){var a=R[S.ra]||{};return"Help me write a thoughtful reply on X (US English, max 280 characters, no flattery, add real value).\nAngle: "+a.name+" ("+a.use+")\nPost I'm replying to: "+(S.rurl||"[link]")+"\nMy draft:\n"+(S.rtext||"(empty)")+"\n\nGive 3 options. Say nothing else."}
var BOTS=[["Grok","https://grok.com/?q="],["ChatGPT","https://chatgpt.com/?q="],["Claude","https://claude.ai/new?q="],["Perplexity","https://www.perplexity.ai/search/new?q="]];
function bots(el,fn){el.innerHTML="";BOTS.forEach(function(b){var x=document.createElement("a");x.className="chip";x.target="_blank";x.rel="noopener";x.textContent="Write with "+b[0];x.onclick=function(){x.href=b[1]+encodeURIComponent(fn())};x.href=b[1];el.appendChild(x)});var c=document.createElement("button");c.type="button";c.className="chip";c.textContent="Copy prompt";c.onclick=function(){var p=fn();(navigator.clipboard&&window.isSecureContext?navigator.clipboard.writeText(p):Promise.reject()).catch(function(){window.prompt("Copy:",p)});c.textContent="Copied";setTimeout(function(){c.textContent="Copy prompt"},1400)};el.appendChild(c)}
function fields(){var h=hook(),n=((h.fill||"").match(/\{[^}]*\}/g)||[]).length,w=$("ta-fields");w.innerHTML="";for(var i=0;i<n;i++){var l=document.createElement("label");l.innerHTML='<span>'+esc(h.labels[i]||"Blank "+(i+1))+'</span>';var inp=document.createElement("input");inp.value=S.vals[i]||"";(function(i){inp.oninput=function(){S.vals[i]=this.value;save();upd()}})(i);l.appendChild(inp);w.appendChild(l)}$("ta-why").textContent=(h.why||"")+(h.ex?" Example: "+h.ex:"")}
function upd(){var t=full(),L=xlen(t);$("ta-line").textContent=line();$("ta-count").textContent=L+" / 280";$("ta-count").className="cnt"+(L>280?" over":"");
 var parts=S.thread?split(t):[t];$("ta-prev").innerHTML=parts.map(function(p){return'<div class="pv">'+esc(p).replace(/\n/g,"<br>")+'<small>'+xlen(p)+'</small></div>'}).join("");
 $("ta-sqw").hidden=!S.useful;var c=check(t);$("ta-score").textContent=c.sc;$("ta-bar").style.width=c.sc+"%";$("ta-tips").innerHTML=c.tips.map(function(x){return'<li class="'+(x[0]?"ok":"warn")+'">'+(x[0]?"✓ ":"! ")+esc(x[1])+'</li>'}).join("");
 $("ta-post").href="https://x.com/intent/post?text="+encodeURIComponent(parts[0]);
 var r=R[S.ra]||{},m=(S.rurl.match(/status\/(\d+)/)||[])[1];$("tr-use").textContent=r.use||"";$("tr-tpl").innerHTML=(r.t||[]).map(function(x){return'<button type="button" class="chip tpl">'+esc(x)+'</button>'}).join("");$("tr-ex").innerHTML=r.good?'<b>Good:</b> '+esc(r.good)+'<br><b>Avoid:</b> '+esc(r.bad):"";
 $("tr-count").textContent=xlen(S.rtext)+" / 280";$("tr-post").href="https://x.com/intent/post?text="+encodeURIComponent(S.rtext)+(m?"&in_reply_to="+m:"");$("tr-warn").hidden=!!m||!S.rurl}
function hist(){$("ta-hist").innerHTML=S.hist.length?S.hist.map(function(h,i){return'<li><button type="button" class="chip" data-i="'+i+'">Load</button> <small>'+esc(h.d)+' · '+esc(h.k)+'</small> '+esc(h.t.slice(0,90))+'</li>'}).join(""):"<li><small>Nothing saved yet.</small></li>"}
function push(k,t){S.hist.unshift({d:new Date().toLocaleString(),k:k,t:t});S.hist=S.hist.slice(0,30);save();hist()}
function tab(t){["post","reply"].forEach(function(x){$("pane-"+x).hidden=x!==t;$("tab-"+x).className="chip"+(x===t?" on":"");$("tab-"+x).setAttribute("aria-selected",x===t)})}
function init(){var sel=$("ta-hook");H.forEach(function(h,i){var o=document.createElement("option");o.value=i;o.textContent=h.n+". "+h.name;sel.appendChild(o)});sel.value=S.h;sel.onchange=function(){S.h=+this.value;S.vals=[];save();fields();upd()};
 var rs=$("tr-angle");R.forEach(function(r,i){var o=document.createElement("option");o.value=i;o.textContent=r.name;rs.appendChild(o)});rs.value=S.ra;rs.onchange=function(){S.ra=+this.value;save();upd()};
 var q=$("ta-sq");SH.forEach(function(s,i){var o=document.createElement("option");o.value=i;o.textContent=s;q.appendChild(o)});q.value=S.sq;q.onchange=function(){S.sq=+this.value;save();upd()};
 $("ta-body").value=S.body;$("ta-body").oninput=function(){S.body=this.value;save();upd()};
 [["ta-useful","useful"],["ta-thread","thread"],["ta-media","media"]].forEach(function(p){$(p[0]).checked=!!S[p[1]];$(p[0]).onchange=function(){S[p[1]]=this.checked;save();upd()}});
 $("tr-url").value=S.rurl;$("tr-url").oninput=function(){S.rurl=this.value.trim();save();upd()};$("tr-text").value=S.rtext;$("tr-text").oninput=function(){S.rtext=this.value;save();upd()};
 $("tr-tpl").onclick=function(e){var b=e.target.closest(".tpl");if(b){S.rtext=b.textContent;$("tr-text").value=S.rtext;save();upd()}};
 $("ta-post").onclick=function(){push("post",full())};$("tr-post").onclick=function(){push("reply",S.rtext)};$("ta-save").onclick=function(){push("draft",full())};
 $("ta-hist").onclick=function(e){var b=e.target.closest("button");if(!b)return;var h=S.hist[+b.dataset.i];if(h.k==="reply"){S.rtext=h.t;$("tr-text").value=h.t;tab("reply")}else{S.body=h.t;S.vals=[];$("ta-body").value=h.t;tab("post")}save();upd()};
 $("ta-clear").onclick=function(){if(confirm("Clear history?")){S.hist=[];save();hist()}};
 $("tab-post").onclick=function(){tab("post");history.replaceState(null,"","#post")};$("tab-reply").onclick=function(){tab("reply");history.replaceState(null,"","#reply")};
 bots($("ta-bots"),botP);bots($("tr-bots"),botR);fields();hist();upd();tab(location.hash==="#reply"?"reply":"post")}
init()})();
