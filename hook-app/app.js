(function(){
"use strict";
var H=window.HOOKS||[],KEY="wv-hookapp",$=function(id){return document.getElementById(id)};
var GOALS={all:"All",grow:"Grow followers",teach:"Teach",sell:"Sell",story:"Story",debate:"Debate"};
var CTAS=["","Follow for more like this.","Reply with your take.","Bookmark this for later.","Repost if this helps someone.","custom"];
var CHECK=[["specific","Is it specific? Concrete numbers, names or situations."],["one","One idea only? The hook makes one clear promise."],["promise","Does the body keep the promise of the hook?"]];
var S={hook:0,vals:[],line:"",edited:false,body:"",cta:"",ctaCustom:"",thread:false,goal:"all",checks:{},ex:0,ov:null,p1url:"","bt-topic":"","bt-aud":"","bt-tone":"plain"};
try{var o=JSON.parse(localStorage.getItem(KEY)||"null");if(o&&typeof o==="object")for(var k in S)if(k in o)S[k]=o[k];}catch(e){}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]})}

/* X weighted length: URLs = 23, emoji and wide characters = 2 */
var URL_RE=/(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/[^\s]*)?/gi;
var seg=window.Intl&&Intl.Segmenter?new Intl.Segmenter("en",{granularity:"grapheme"}):null;
var PIC;try{PIC=new RegExp("\\p{Extended_Pictographic}","u")}catch(e){PIC=/[\uD83C-\uDBFF]/}
function w1(cp){return cp<=4351||(cp>=8192&&cp<=8205)||(cp>=8208&&cp<=8223)||(cp>=8242&&cp<=8247)}
function xlen(t){var n=0;t=t.replace(URL_RE,function(m){n+=23;return""});
 var parts=seg?Array.from(seg.segment(t),function(x){return x.segment}):Array.from(t);
 parts.forEach(function(g){if(PIC.test(g)){n+=2;return}Array.from(g).forEach(function(c){var cp=c.codePointAt(0);if(cp>=0xFE00&&cp<=0xFE0F||cp===0x200D)return;n+=w1(cp)?1:2})});return n}

function hook(){return H[S.hook-1]}
function blanks(h){var r=[];h.fill.replace(/\{([^}]*)\}/g,function(m,ph){r.push(ph)});return r}
function filled(){var h=hook();if(!h)return"";var i=0;return h.fill.replace(/\{([^}]*)\}/g,function(m,ph){var v=(S.vals[i++]||"").trim();return v||"["+(h.labels[i-1])+"]"})}
function hookLine(){return S.edited?S.line:filled()}
function ctaText(){return S.cta==="custom"?S.ctaCustom.trim():S.cta}
function norm(t){return String(t).toLowerCase().replace(/\s+/g," ").replace(/\s*([.!?])\s*/g,"$1").trim()}
function full(){var a=[hookLine().trim(),S.body.trim()].filter(Boolean),c=ctaText().trim();if(c&&norm(a.join(" ")).indexOf(norm(c).replace(/[.!?]+$/,""))<0)a.push(c);return a.join("\n\n")}
function srcKey(){return(S.thread?"T":"S")+"|"+full()}
function split(t){
 if(xlen(t)<=280)return[t];
 var words=t.split(/(\s+)/),out=[],cur="",lim=272;
 words.forEach(function(w){if(xlen(cur+w)>lim&&cur.trim()){out.push(cur.trim());cur=w.replace(/^\s+/,"")}else cur+=w});
 if(cur.trim())out.push(cur.trim());
 /* prefer paragraph breaks: already kept since whitespace incl. newlines is preserved */
 return out.map(function(p,i){return p+"\n\n"+(i+1)+"/"+out.length});
}
function autoPosts(){var t=full();return S.thread?split(t):[t]}
function posts(){if(S.ov&&S.ov.src===srcKey()&&S.ov.p&&S.ov.p.length)return S.ov.p.slice();if(S.ov){S.ov=null;save()}return autoPosts()}
function cardMeta(d,t,i,n){var l=xlen(t),lb=d.querySelector(".lb"),w=d.querySelector(".pw");lb.textContent=(n>1?"Post "+(i+1)+" of "+n:"Your post")+" \u00b7 "+l+" / 280";lb.classList.toggle("over",l>280);w.hidden=l<=280;w.textContent="Too long by "+(l-280)+". X allows 280 per post."}
function postsChanged(){var P=posts();$("ha-post").href=intent(P[0]);$("ha-resplit-row").hidden=!S.ov;
 $("ha-count").textContent=S.thread?P.length+" posts \u00b7 longest "+Math.max.apply(null,P.map(xlen))+" / 280":xlen(P[0])+" / 280";
 var ov=P.some(function(t){return xlen(t)>280});$("ha-count").className="count"+(ov?" over":"");$("ha-over").hidden=S.thread||!ov}
function intent(t,rid){return"https://x.com/intent/post?text="+encodeURIComponent(t)+(rid?"&in_reply_to="+rid:"")}
function statusId(u){var m=String(u||"").match(/(?:^|[\/.])(?:x|twitter)\.com\/(?:[^\/?#\s]+\/status(?:es)?|i(?:\/web)?\/status)\/(\d{5,25})/i);return m?m[1]:""}
function refreshLinks(){var P=posts(),id=statusId(S.p1url);document.querySelectorAll("#ha-out .post").forEach(function(d,i){var a=d.querySelector("a.postx");if(a&&P[i]!=null)a.href=intent(P[i],i>0?id:"");var h=d.querySelector(".rhint");if(h)h.hidden=!!id});var st=$("ha-p1st");if(st){st.textContent=S.p1url.trim()?(id?"Reply mode on: posts 2+ reply to post "+id+".":"That doesn\u2019t look like a link to a post on X."):"";st.className="hint"+(S.p1url.trim()&&!id?" warn":"")}}

/* Step 1: pick */
function renderChips(){var c=$("ha-chips");c.innerHTML="";Object.keys(GOALS).forEach(function(g){var b=document.createElement("button");b.type="button";b.className="chip"+(S.goal===g?" on":"");b.textContent=GOALS[g];b.setAttribute("aria-pressed",S.goal===g);b.onclick=function(){S.goal=g;save();renderChips();renderGrid()};c.appendChild(b)})}
function renderGrid(){var g=$("ha-grid");g.innerHTML="";H.forEach(function(h){if(S.goal!=="all"&&h.goal!==S.goal)return;var b=document.createElement("button");b.type="button";b.className="hcard"+(S.hook===h.n?" on":"");b.setAttribute("aria-pressed",S.hook===h.n);
 b.innerHTML='<span class="n">'+h.n+'</span><span class="hn">'+esc(h.name)+'</span><span class="hu">'+esc(h.use)+'</span>';
 b.onclick=function(){choose(h.n,true)};g.appendChild(b)})}
function choose(n,scroll){if(S.hook!==n){S.hook=n;S.vals=[];S.edited=false;S.line="";S.ex=0;S.checks={}}save();renderGrid();renderFill();update();if(scroll)$("step2").scrollIntoView({behavior:"smooth",block:"start"})}

/* Step 2: fill */
function renderFill(){var h=hook(),f=$("ha-fields");$("step2").hidden=$("step3").hidden=$("step4").hidden=$("step5").hidden=!h;if(!h)return;
 $("ha-name").textContent=h.n+". "+h.name;$("ha-tpl").textContent=h.tpl;$("ha-watch").textContent=h.watch;
 f.innerHTML="";blanks(h).forEach(function(ph,i){var id="f"+i,l=document.createElement("label");l.setAttribute("for",id);l.textContent=h.labels[i];var inp=document.createElement("input");inp.id=id;inp.type="text";inp.placeholder=ph;inp.value=S.vals[i]||"";inp.autocomplete="off";
  inp.oninput=function(){S.vals[i]=inp.value;if(S.edited&&!confirmKeep()){}save();update()};f.appendChild(l);f.appendChild(inp)});
 showEx();$("ha-line").value=hookLine()}
function confirmKeep(){return true}
function showEx(){var h=hook();if(!h)return;var e=[h.ex,h.alt];$("ha-ex").textContent=e[S.ex%2]}

function update(){var h=hook();if(!h)return;
 var line=hookLine();$("ha-preview").textContent=line;
 if(document.activeElement!==$("ha-line"))$("ha-line").value=line;
 $("ha-edited").hidden=!S.edited;
 var hl=xlen(line.trim());$("ha-hlwarn").textContent=hl>100?"Your hook line is "+hl+" characters. Only the first lines show before \u201cShow more\u201d, so keep it under about 100.":"Hook line: "+hl+" characters. Short enough to show before \u201cShow more\u201d.";$("ha-hlwarn").className="hint"+(hl>100?" warn":"");
 var P=posts(),o=$("ha-out");
 if(!o.contains(document.activeElement)){o.innerHTML="";P.forEach(function(t,i){var d=document.createElement("div");d.className="post";d.innerHTML='<p class="lb"></p><textarea class="pv" rows="4" spellcheck="true"></textarea><p class="hint warn pw" hidden></p>';var ta=d.querySelector("textarea");ta.value=t;ta.setAttribute("aria-label",P.length>1?"Post "+(i+1)+" of "+P.length:"Your post");
  var fit=function(){ta.style.height="auto";ta.style.height=(ta.scrollHeight+2)+"px"};
  ta.oninput=function(){var cur=posts();cur[i]=ta.value;S.ov={src:srcKey(),p:cur};save();cardMeta(d,ta.value,i,P.length);fit();postsChanged();refreshLinks()};
  cardMeta(d,t,i,P.length);
  if(P.length>1){var row=document.createElement("p");row.className="prow";var a=document.createElement("a");a.className="pbtn bold postx";a.target="_blank";a.rel="noopener";a.textContent="Post "+(i+1)+" on X";var b=document.createElement("button");b.type="button";b.className="pbtn";b.textContent="Copy post "+(i+1);b.onclick=function(){copy(posts()[i],b)};row.appendChild(a);row.appendChild(b);d.appendChild(row);
   if(i===0){var w=document.createElement("div");w.className="p1link";w.innerHTML='<label for="ha-p1url">Paste the link to your post 1 (after posting)</label><input type="url" id="ha-p1url" inputmode="url" autocomplete="off" placeholder="https://x.com/you/status/\u2026"><p class="hint" id="ha-p1st" aria-live="polite"></p>';var inp=w.querySelector("input");inp.value=S.p1url||"";inp.oninput=function(){S.p1url=inp.value;save();refreshLinks()};d.appendChild(w)}
   else{var h=document.createElement("p");h.className="hint warn rhint";h.textContent="Paste your post 1 link first so this posts as a reply";d.appendChild(h)}}
  o.appendChild(d);requestAnimationFrame(fit)})}
 postsChanged();refreshLinks();$("ha-post").textContent="Post on X";$("ha-post").hidden=P.length>1;
 $("ha-threadnote").hidden=P.length<2;
 if(!botDirty)botMode(botCur,true);
 CHECK.forEach(function(c){var e=$("ck-"+c[0]);if(e)e.checked=!!S.checks[c[0]]});
}
function copy(t,b){var done=function(){var o=b.textContent;b.textContent="Copied";setTimeout(function(){b.textContent=o},1400)};
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(done,function(){fb(t);done()});else{fb(t);done()}}
function fb(t){var a=document.createElement("textarea");a.value=t;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;opacity:0";document.body.appendChild(a);a.select();a.setSelectionRange(0,t.length);try{document.execCommand("copy")}catch(e){}document.body.removeChild(a)}

function init(){
 initBot();
 renderChips();renderGrid();
 var sel=$("ha-cta");CTAS.forEach(function(c){var o=document.createElement("option");o.value=c;o.textContent=c===""?"No call to action":c==="custom"?"Custom\u2026":c;sel.appendChild(o)});
 sel.value=S.cta;$("ha-ctac").hidden=S.cta!=="custom";$("ha-ctac").value=S.ctaCustom;
 sel.onchange=function(){S.cta=sel.value;$("ha-ctac").hidden=S.cta!=="custom";save();update()};
 $("ha-ctac").oninput=function(){S.ctaCustom=this.value;save();update()};
 $("ha-body").value=S.body;$("ha-body").oninput=function(){S.body=this.value;save();update()};
 $("ha-thread").checked=S.thread;$("ha-thread").onchange=function(){S.thread=this.checked;save();update()};
 $("ha-line").oninput=function(){S.line=this.value;S.edited=true;save();update()};
 $("ha-reset").onclick=function(){S.edited=false;S.line="";save();$("ha-line").value=filled();update()};
 $("ha-shuffle").onclick=function(){S.ex++;save();showEx()};
 $("ha-useex").onclick=function(){S.line=$("ha-ex").textContent;S.edited=true;save();$("ha-line").value=S.line;update()};
 var cl=$("ha-check");CHECK.forEach(function(c){var l=document.createElement("label");l.className="ck";l.innerHTML='<input type="checkbox" id="ck-'+c[0]+'"> '+esc(c[1]);cl.appendChild(l);l.querySelector("input").onchange=function(){S.checks[c[0]]=this.checked;save()}});
 $("ha-resplit").onclick=function(){S.ov=null;save();update()};
 $("ha-copy").onclick=function(){copy(posts().join("\n\n---\n\n"),this)};
 $("ha-clear").onclick=function(){if(!confirm("Clear this draft?"))return;S.vals=[];S.line="";S.edited=false;S.body="";S.checks={};S.ov=null;S.p1url="";save();$("ha-body").value="";renderFill();update()};
 var q=+(new URLSearchParams(location.search).get("hook")||0);
 if(q>=1&&q<=H.length){choose(q,false);setTimeout(function(){$("step2").scrollIntoView()},0)}else{renderFill();update()}
}

/* Bot help */
var botCur="write",botDirty=false,TONES={plain:"plain and clear",bold:"bold and confident",funny:"funny and light",expert:"expert and precise"};
function fieldsText(h){var b=blanks(h);return b.map(function(ph,i){return"- "+h.labels[i]+": "+((S.vals[i]||"").trim()||"(empty)")}).join("\n")}
function botPrompt(mode){var h=hook();if(!h)return"";var topic=$("bt-topic").value.trim(),aud=$("bt-aud").value.trim(),tone=TONES[$("bt-tone").value],inc=$("bt-draft").checked,d=full();
 var ctx="Hook type: "+h.n+". "+h.name+"\nTemplate: "+h.tpl+"\nExample: "+h.ex+"\nWhy it works: "+h.why+"\nUse it when: "+h.use+"\nWatch out: "+h.watch+"\n\nTopic/idea: "+(topic||"[TOPIC]")+"\nAudience: "+(aud||"people on X who care about this topic")+"\nTone: "+tone+"\nMy filled template fields:\n"+fieldsText(h);
 var rules="\n\nRules:\n- Hook line first, under 100 characters, specific (numbers, names, situations).\n- One idea per post. The body must keep the promise of the hook.\n- Each post max 280 characters (X counts a link as 23 and an emoji as 2).\n- No hashtags, no emoji spam, US English, my voice.";
 var fmt="\n\nReply in exactly this format, with nothing before or after:\n===HOOKS===\n1. ...\n2. ...\n3. ...\n4. ...\n5. ...\n===BODY===\n(the post text that comes after the hook line, without the hook line)\n"+(S.thread?"===THREAD===\n1/ ...\n2/ ...\n(the full post split into a numbered thread, each part max 280 characters)\n":"")+"===END===";
 if(mode==="improve")return"Improve my X post. Keep my voice and the hook type.\n\n"+ctx+rules+"\n\nMy post:\n"+(d||"(empty)")+"\n\nGive 5 improved hook lines and 1 improved body. Say nothing else."+fmt;
 if(mode==="more")return"Write 5 new hook lines for my X post using this hook type.\n\n"+ctx+rules+(d?"\n\nMy current post:\n"+d:"")+"\n\nOnly give the hooks."+"\n\nReply in exactly this format:\n===HOOKS===\n1. ...\n2. ...\n3. ...\n4. ...\n5. ...\n===END===";
 return"Write an X post for me with this hook type.\n\n"+ctx+rules+(inc&&d?"\n\nMy draft so far:\n"+d:"")+"\n\nGive 5 hook-line variants and 1 full post body"+(S.thread?" plus a thread version":"")+"."+fmt}
function botMode(m,auto){botCur=m;var p=$("ha-botp");p.textContent=botPrompt(m);if(!auto)botDirty=false;
 document.querySelectorAll("#bt-modes button").forEach(function(b){var on=b.getAttribute("data-m")===m;b.className="chip"+(on?" on":"");b.setAttribute("aria-pressed",on)});
 $("bt-need").hidden=!!$("bt-topic").value.trim()||m!=="write"}
function parseAnswer(t){var r={hooks:[],body:"",thread:[]},m=t.match(/===\s*HOOKS\s*===([\s\S]*?)(?====)/i);
 if(m)r.hooks=m[1].split("\n").map(function(l){return l.replace(/^\s*(\d+[.)]|[-*•])\s*/,"").replace(/^["“]|["”]$/g,"").trim()}).filter(Boolean).slice(0,10);
 var b=t.match(/===\s*BODY\s*===([\s\S]*?)(?====|$)/i);if(b)r.body=b[1].trim();
 var th=t.match(/===\s*THREAD\s*===([\s\S]*?)(?====|$)/i);if(th)r.thread=th[1].split(/\n(?=\s*\d+\s*\/)/).map(function(x){return x.replace(/^\s*\d+\s*\/\s*\d*\s*/,"").trim()}).filter(Boolean);
 return r}
function applyAnswer(){var t=$("bt-ans").value.trim(),o=$("bt-res");o.innerHTML="";if(!t)return;var r=parseAnswer(t);
 if(!r.hooks.length&&!r.body){S.body=S.body?S.body+"\n\n"+t:t;$("ha-body").value=S.body;save();update();o.innerHTML='<p class="hint">No known format found, so the whole answer went into the body. Edit it there.</p>';return}
 if(r.body){S.body=r.thread.length&&S.thread?r.thread.join("\n\n"):r.body;$("ha-body").value=S.body}
 var msg=document.createElement("p");msg.className="hint";msg.textContent=(r.hooks.length?"Tap a hook line to use it.":"")+(r.body?" The post went into the body.":"");o.appendChild(msg);
 var w=document.createElement("div");w.className="chips";r.hooks.forEach(function(hk){var c=document.createElement("button");c.type="button";c.className="chip vchip";c.textContent=hk;c.onclick=function(){S.line=hk;S.edited=true;$("ha-line").value=hk;save();update();w.querySelectorAll(".vchip").forEach(function(x){x.classList.toggle("on",x===c)})};w.appendChild(c)});o.appendChild(w);save();update()}
function initBot(){["bt-topic","bt-aud"].forEach(function(id){$(id).value=S[id]||"";$(id).oninput=function(){S[id]=this.value;save();botMode(botCur,true)}});
 $("bt-tone").value=S["bt-tone"]||"plain";$("bt-tone").onchange=function(){S["bt-tone"]=this.value;save();botMode(botCur,true)};
 $("bt-draft").onchange=function(){botMode(botCur,true)};
 $("bt-modes").onclick=function(e){var b=e.target.closest("button");if(b)botMode(b.getAttribute("data-m"))};
 $("ha-botp").oninput=function(){botDirty=true};
 $("bt-regen").onclick=function(){botMode(botCur)};

 $("bt-parse").onclick=applyAnswer;
 $("ha-openbot").onclick=function(){var d=$("botpanel");d.open=true;d.scrollIntoView({behavior:"smooth",block:"start"})}}
init();
})();
