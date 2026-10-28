(function(){"use strict";
var A=window.REPLY_ANGLES||[],K="wv-replyapp-v1",$=function(i){return document.getElementById(i)};
var S={url:"",ptext:"",angle:"",ti:0,text:"",mode:"write3",hist:[],targets:[],days:{}};
try{var o=JSON.parse(localStorage.getItem(K)||"{}");for(var k in o)S[k]=o[k]}catch(e){}
function save(){try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}
function day(d){d=d||new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function today(){var t=day();if(!S.days[t])S.days[t]={post:false,replies:0,followers:"",visits:""};return S.days[t]}
function statusId(u){var m=String(u||"").match(/(?:^|[\/.])(?:x|twitter)\.com\/(?:[^\/?#\s]+\/status(?:es)?|i(?:\/web)?\/status)\/(\d{5,25})/i);return m?m[1]:""}
function author(u){var m=String(u||"").match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status/i);return m&&!/^i$/i.test(m[1])?m[1]:""}
function intent(t,id){return "https://x.com/intent/post?text="+encodeURIComponent(t)+(id?"&in_reply_to="+id:"")}
function len(s){return Array.from(s).length+ (s.match(/https?:\/\/\S+/g)||[]).reduce(function(n,u){return n-Array.from(u).length+23},0)}
function ang(){for(var i=0;i<A.length;i++)if(A[i].id===S.angle)return A[i];return null}
window.RA={statusId:statusId,intent:intent};

/* Step 1 */
function step1(){var id=statusId(S.url),st=$("ra-urlst");
 st.textContent=S.url.trim()?(id?"Replying to post "+id+(author(S.url)?" by @"+author(S.url):"")+".":"That doesn\u2019t look like a link to a post on X."):"Paste a link like x.com/name/status/123…";
 st.className="hint"+(S.url.trim()&&!id?" warn":"")}
/* Step 2 */
function renderAngles(){var g=$("ra-grid");g.innerHTML="";A.forEach(function(a,i){var b=document.createElement("button");b.type="button";b.className="hcard"+(S.angle===a.id?" on":"");b.setAttribute("aria-pressed",S.angle===a.id);
 b.innerHTML='<span class="n">'+(i+1)+'</span><span class="hn">'+esc(a.name)+'</span><span class="hu">'+esc(a.use)+'</span>';
 b.onclick=function(){S.angle=a.id;S.ti=0;save();renderAngles();renderTpl();bot();$("ra-tplbox").scrollIntoView({behavior:"smooth",block:"nearest"})};g.appendChild(b)});renderTpl()}
function renderTpl(){var a=ang(),bx=$("ra-tplbox");bx.hidden=!a;if(!a)return;
 $("ra-aname").textContent=a.name;var c=$("ra-tpls");c.innerHTML="";
 a.t.forEach(function(t,i){var b=document.createElement("button");b.type="button";b.className="chip vchip"+(S.ti===i?" on":"");b.textContent=t;b.onclick=function(){S.ti=i;save();renderTpl()};c.appendChild(b)});
 $("ra-bad").textContent=a.bad;$("ra-good").textContent=a.good}
/* Step 3/4: checks + score */
var GEN=/^(great|nice|awesome|amazing|love (this|it)|so true|this|agreed?|100%|facts|exactly|well said|thanks for sharing|great (post|thread|point|advice)|same|wow|\+1|yes|true|based|saving this|bookmarked)[\s!.\u{1F300}-\u{1FAFF}\u2600-\u27BF]*$/iu;
var GENP=/\b(great post|great thread|100% agree|so true|well said|thanks for sharing|love this|this is gold|couldn['\u2019]t agree more|nailed it|game.?changer)\b/i;
var PROMO=/\b(my (course|newsletter|ebook|e-book|product|app|channel)|check (out )?my|link in (my )?bio|dm me|follow me|subscribe|sign up|use code|my profile)\b/i;
function shingles(s){var w=s.toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean),o={};for(var i=0;i+3<w.length;i++)o[w.slice(i,i+4).join(" ")]=1;return o}
function repeats(t){var me=shingles(t),hits={};S.hist.slice(-50).forEach(function(h){if(h.text===t)return;var o=shingles(h.text);for(var k in me)if(o[k])hits[k]=(hits[k]||0)+1});return Object.keys(hits)}
function specific(t){return /\d/.test(t)||/\b(for example|e\.g\.|like when|i tried|we tested|did this|step|then|because)\b/i.test(t)||/[:→]/.test(t)}
function checks(t){var L=len(t),tt=t.trim(),rep=repeats(t);
 return [
 {k:"generic",w:20,ok:tt.length>0&&!GEN.test(tt)&&!GENP.test(tt),l:"Not a generic reply (“Great post!”, “Agree”, “100%”)",tip:"Swap praise for a point: add an example, a tactic or a number."},
 {k:"len",w:15,ok:L>=60&&L<=280,l:"60–280 characters",tip:L<60?"Under ~60 characters rarely adds anything. Say what, how or why.":"Over 280 characters. Cut it down to one idea."},
 {k:"spec",w:20,ok:specific(tt),l:"Adds something specific (a number, example, step or reason)",tip:"Add one concrete detail: a number, a named tool, a step or a real result."},
 {k:"link",w:10,ok:!/https?:\/\/|www\.|\b\w+\.(com|io|co|net|org|ly)\b/i.test(tt),l:"No links",tip:"Drop the link. Links in replies look like spam and pull people off the post."},
 {k:"promo",w:10,ok:!PROMO.test(tt),l:"No self-promo",tip:"Remove the plug. Let a useful reply send people to your profile."},
 {k:"rep",w:15,ok:rep.length===0,l:"Not repetitive vs your last replies",tip:"You used these phrases before: “"+rep.slice(0,3).join("”, “")+"”. Rephrase it.",rep:rep},
 {k:"conv",w:10,ok:/\?/.test(tt)||S.angle==="counter"||S.angle==="question"||/\b(you|your)\b/i.test(tt),l:"Invites a response (question or talks to the author)",tip:"End with a short question, so the author has a reason to reply."}]}
function update(){var t=S.text,L=len(t),c=$("ra-count");c.textContent=L+" / 280";c.className="count"+(L>280?" over":"");
 var C=checks(t),sc=0,ul=$("ra-check"),tips=$("ra-tips");ul.innerHTML="";tips.innerHTML="";
 C.forEach(function(x){if(x.ok)sc+=x.w;var li=document.createElement("li");li.className=x.ok?"ok":"no";li.setAttribute("data-k",x.k);li.innerHTML='<span class="ic" aria-hidden="true">'+(x.ok?"\u2713":"\u2715")+'</span><span>'+esc(x.l)+'<span class="sr-only">'+(x.ok?": passed":": not yet")+'</span></span>';ul.appendChild(li);
  if(!x.ok&&t.trim()){var p=document.createElement("li");p.textContent=x.tip;tips.appendChild(p)}});
 if(!t.trim())sc=0;
 $("ra-score").textContent=sc;$("ra-bar").style.width=sc+"%";$("ra-grade").textContent=!t.trim()?"Start writing":sc>=85?"Post-worthy":sc>=60?"Good, can be sharper":"Reads like a comment";
 $("ra-scorebox").className="scorebox "+(sc>=85?"hi":sc>=60?"mid":"lo");
 var id=statusId(S.url),a=$("ra-post");a.href=intent(t,id);a.setAttribute("aria-disabled",!t.trim());
 $("ra-noid").hidden=!!id;bot()}
/* Bot */
var RULES="Rules: one idea; add something specific (an example, a tactic, a number, a step or a respectful counterargument); 60\u2013280 characters; no generic praise (\u201cGreat post\u201d, \u201cAgree\u201d, \u201c100%\u201d); no links; no self-promo; no hashtags or emojis; write it so it reads like a post worth reading on its own; plain US English.";
function bot(){var a=ang(),p=S.ptext.trim()?S.ptext.trim():"[PASTE THE POST HERE]",an=a?a.name+" ("+a.use+")":"pick the best angle",L=[];
 if(S.mode==="write3")L=["You help me write replies on X that earn follows.","","Post I\u2019m replying to:","\"\"\""+p+"\"\"\"","","Angle: "+an+(a?"\nTemplate: "+a.t[S.ti||0]:""),"",RULES,"","Write 3 different replies. Number them. After each, one line on why it adds value."];
 else if(S.mode==="specific")L=["Make my X reply more specific. Keep my voice and the core point.","","Post:","\"\"\""+p+"\"\"\"","","My reply:","\"\"\""+(S.text.trim()||"[MY REPLY]")+"\"\"\"","","Add one concrete detail (number, named tool, step or real result). If I didn\u2019t give a fact, use a [PLACEHOLDER] instead of inventing one.",RULES,"","Give 2 versions."];
 else L=["Turn my reply into a respectful counterargument.","","Post:","\"\"\""+p+"\"\"\"","","My draft:","\"\"\""+(S.text.trim()||"[MY REPLY OR VIEW]")+"\"\"\"","","Start by agreeing with what\u2019s true, then name the exception and why, then the alternative. No sarcasm.",RULES,"","Give 3 versions."];
 var pr=$("ra-botp");if(document.activeElement!==pr)pr.textContent=L.join("\n")}
/* History */
function renderHist(){var u=$("ra-hist");u.innerHTML="";var H=S.hist.slice().reverse();$("ra-hn").textContent=S.hist.length;
 if(!H.length){u.innerHTML='<li class="hint">No replies yet. Replies you post through this app show up here.</li>';return}
 H.slice(0,30).forEach(function(h){var li=document.createElement("li");li.innerHTML='<span class="hint">'+esc(h.d)+(h.id?' · <a href="https://x.com/i/web/status/'+h.id+'" target="_blank" rel="noopener">post</a>':"")+(h.a?" · "+esc(h.a):"")+'</span><br>'+esc(h.text);u.appendChild(li)})}
/* Tracker */
function streak(){var n=0,d=new Date();for(;;){var r=S.days[day(d)];if(r&&r.post&&r.replies>=5){n++;d.setDate(d.getDate()-1)}else if(n===0&&day(d)===day()){d.setDate(d.getDate()-1);var y=S.days[day(d)];if(!(y&&y.post&&y.replies>=5))break}else break}return n}
function renderTrack(){var t=today(),r=t.replies;$("ra-today").textContent=r;$("ra-tbar").style.width=Math.min(100,r*10)+"%";
 $("ra-tmsg").textContent=r>=10?"Goal maxed. Go reply to the people who replied to you.":r>=5?"Goal reached. Up to 10 if you still have useful things to say.":(5-r)+" more thoughtful repl"+(5-r===1?"y":"ies")+" to reach today\u2019s goal (5\u201310).";
 $("ra-tpost").checked=!!t.post;$("ra-tfol").value=t.followers;$("ra-tvis").value=t.visits;$("ra-streak").textContent=streak();
 var keys=Object.keys(S.days).sort(),start=keys.length?keys[0]:day(),s=new Date(start+"T12:00:00"),dn=Math.floor((new Date(day()+"T12:00:00")-s)/864e5)+1;$("ra-dayn").textContent=Math.min(dn,30);
 var W=300,Hh=90,bw=W/30,svg='<svg viewBox="0 0 '+W+' '+(Hh+14)+'" width="100%" role="img" aria-label="Replies per day, last 30 days">',fol=[];
 for(var i=29;i>=0;i--){var d=new Date();d.setDate(d.getDate()-i);var k=day(d),x=(29-i)*bw,v=S.days[k]||{};var h=Math.min(1,(v.replies||0)/10)*Hh;
  svg+='<rect x="'+(x+1)+'" y="'+(Hh-h)+'" width="'+(bw-2)+'" height="'+h+'" rx="1.5" fill="'+((v.replies||0)>=5?"#ff2a3a":"rgba(127,127,127,.55)")+'"/>';
  if(v.post)svg+='<circle cx="'+(x+bw/2)+'" cy="'+(Hh+8)+'" r="2.2" fill="#ff2a3a"/>';if(v.followers!==""&&v.followers!=null&&!isNaN(+v.followers))fol.push([x+bw/2,+v.followers])}
 svg+='<line x1="0" x2="'+W+'" y1="'+(Hh/2)+'" y2="'+(Hh/2)+'" stroke="currentColor" stroke-opacity=".25" stroke-dasharray="3 3"/>';
 if(fol.length>1){var mn=Math.min.apply(0,fol.map(function(f){return f[1]})),mx=Math.max.apply(0,fol.map(function(f){return f[1]}));svg+='<polyline fill="none" stroke="currentColor" stroke-width="1.5" points="'+fol.map(function(f){return f[0]+","+(mx===mn?Hh/2:Hh-4-(f[1]-mn)/(mx-mn)*(Hh-8))}).join(" ")+'"/>'}
 $("ra-chart").innerHTML=svg+"</svg>"}
/* Targets */
function renderTargets(){var u=$("ra-tlist");u.innerHTML="";$("ra-tn").textContent=S.targets.length;
 S.targets.forEach(function(t,i){var li=document.createElement("li");li.innerHTML='<span><b>@'+esc(t.h)+'</b>'+(t.n?' <span class="hint">'+esc(t.n)+'</span>':"")+'</span><span class="tl"><a href="https://x.com/'+encodeURIComponent(t.h)+'" target="_blank" rel="noopener">Profile</a><a href="https://x.com/search?q=from%3A'+encodeURIComponent(t.h)+'&f=live" target="_blank" rel="noopener">Latest posts</a><button type="button" class="pbtn sm" aria-label="Remove @'+esc(t.h)+'">Remove</button></span>';
  li.querySelector("button").onclick=function(){S.targets.splice(i,1);save();renderTargets()};u.appendChild(li)});
 $("ra-tadd").disabled=S.targets.length>=20;$("ra-tfull").hidden=S.targets.length<20}
function toast(m){var t=$("ra-toast");t.textContent=m;t.hidden=false;clearTimeout(t._h);t._h=setTimeout(function(){t.hidden=true},2400)}
function copy(s){if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(s).catch(function(){});var a=document.createElement("textarea");a.value=s;document.body.appendChild(a);a.select();try{document.execCommand("copy")}catch(e){}a.remove()}

/* wire */
function init(){
 var u=$("ra-url"),pt=$("ra-ptext"),tx=$("ra-text");u.value=S.url;pt.value=S.ptext;tx.value=S.text;
 u.oninput=function(){S.url=u.value;save();step1();update()};pt.oninput=function(){S.ptext=pt.value;save();bot()};
 tx.oninput=function(){S.text=tx.value;save();update()};
 $("ra-usetpl").onclick=function(){var a=ang();if(!a)return;S.text=a.t[S.ti||0];tx.value=S.text;save();update();tx.focus();var m=S.text.indexOf("[");if(m>=0)tx.setSelectionRange(m,S.text.indexOf("]",m)+1)};
 $("ra-useex").onclick=function(){var a=ang();if(!a)return;S.text=a.good;tx.value=S.text;save();update();toast("Example loaded. Make it yours before you post.")};
 document.querySelectorAll("#ra-modes .chip").forEach(function(b){b.classList.toggle("on",b.getAttribute("data-m")===S.mode);b.onclick=function(){S.mode=b.getAttribute("data-m");save();document.querySelectorAll("#ra-modes .chip").forEach(function(c){c.classList.toggle("on",c===b);c.setAttribute("aria-pressed",c===b)});var p=$("ra-botp");p.blur();bot()}});
 $("ra-post").onclick=function(e){var t=S.text.trim();if(!t){e.preventDefault();toast("Write your reply first.");tx.focus();return}
  var a=ang();S.hist.push({d:day(),text:t,id:statusId(S.url),a:a?a.name:""});if(S.hist.length>200)S.hist=S.hist.slice(-200);today().replies++;save();renderHist();renderTrack();setTimeout(update,0)};
 $("ra-copy").onclick=function(){copy(S.text);toast("Reply copied")};
 $("ra-clear").onclick=function(){if(S.text&&!confirm("Clear this draft?"))return;S.text="";S.url="";S.ptext="";tx.value=u.value=pt.value="";save();step1();update()};
 $("ra-tpost").onchange=function(){today().post=this.checked;save();renderTrack()};
 $("ra-tfol").oninput=function(){today().followers=this.value;save();renderTrack()};$("ra-tvis").oninput=function(){today().visits=this.value;save()};
 $("ra-minus").onclick=function(){var t=today();if(t.replies>0)t.replies--;save();renderTrack()};$("ra-plus").onclick=function(){today().replies++;save();renderTrack()};
 $("ra-tform").onsubmit=function(e){e.preventDefault();var h=$("ra-th").value.trim().replace(/^.*(?:x|twitter)\.com\//i,"").replace(/^@/,"").replace(/[\/?#].*$/,"");
  if(!/^[A-Za-z0-9_]{1,15}$/.test(h)){toast("That doesn\u2019t look like an X handle.");return}
  if(S.targets.some(function(t){return t.h.toLowerCase()===h.toLowerCase()})){toast("Already on your list.");return}
  if(S.targets.length>=20)return;S.targets.push({h:h,n:$("ra-tnote").value.trim()});$("ra-th").value=$("ra-tnote").value="";save();renderTargets()};
 $("ra-hclear").onclick=function(){if(confirm("Delete your reply history on this device?")){S.hist=[];save();renderHist();update()}};
 $("ra-reset").onclick=function(){if(confirm("Reset the 30-day tracker on this device?")){S.days={};save();renderTrack()}};
 step1();renderAngles();update();renderHist();renderTrack();renderTargets()}
init();
})();
