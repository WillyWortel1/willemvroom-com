/* Read-aloud for news pages: browser speechSynthesis, user-triggered only. Same file on .nl and .com. */
(function(){
var box=document.getElementById("listen");if(!box)return;
var nl=/^nl/i.test(document.documentElement.lang);
var T=nl?{play:"Voorlezen",pause:"Pauzeren",resume:"Doorgaan",reading:"Bezig met voorlezen…",paused:"Gepauzeerd.",stopped:"Gestopt.",done:"Klaar.",err:"Voorlezen gestopt door een fout.",none:"Voorlezen wordt niet ondersteund in deze browser.",novoice:"Geen Nederlandse stem gevonden; de browser kiest een stem."}
 :{play:"Listen",pause:"Pause",resume:"Resume",reading:"Reading the article…",paused:"Paused.",stopped:"Stopped.",done:"Finished.",err:"Read-aloud stopped because of an error.",none:"Read-aloud is not supported in this browser.",novoice:"No English voice found; the browser will choose a voice."};
var LANG=nl?"nl-NL":"en-GB",RX=nl?/^nl/i:/^en/i;
var ss=window.speechSynthesis,U=window.SpeechSynthesisUtterance;
var play=box.querySelector("[data-a=play]"),stop=box.querySelector("[data-a=stop]"),st=box.querySelector("[data-s]");
box.hidden=false;
if(!ss||!U){play.hidden=stop.hidden=true;st.textContent=T.none;return;}
var parts=[],i=0,state="idle",gen=0;
function chunks(){var out=[],h=document.querySelector("article h1");if(h)out.push(h.textContent);
 document.querySelectorAll("article .nw-body > p").forEach(function(p){out.push(p.textContent)});
 var c=[];out.forEach(function(t){(t.match(/[^.!?]+[.!?]*\s*/g)||[t]).forEach(function(s){s=s.trim();if(s)c.push(s)})});return c;}
function voice(){var v=ss.getVoices()||[];return v.find(function(x){return x.lang&&x.lang.replace("_","-").toLowerCase()===LANG.toLowerCase()})||v.find(function(x){return RX.test(x.lang||"")})||null;}
function set(s,msg){state=s;play.textContent=s==="playing"?T.pause:s==="paused"?T.resume:T.play;
 play.setAttribute("aria-pressed",s==="playing"?"true":"false");stop.disabled=s==="idle";st.textContent=msg||"";}
function next(g){if(g!==gen)return;if(i>=parts.length){set("idle",T.done);return;}
 var u=new U(parts[i]);u.lang=LANG;var v=voice();if(v){u.voice=v;u.lang=v.lang;}
 u.onend=function(){if(g!==gen)return;i++;next(g)};
 u.onerror=function(e){if(g!==gen||e.error==="interrupted"||e.error==="canceled")return;gen++;ss.cancel();set("idle",T.err)};
 try{ss.speak(u);}catch(e){gen++;set("idle",T.err);}}
function start(){gen++;ss.cancel();parts=chunks();i=0;var v=voice();set("playing",v||!(ss.getVoices()||[]).length?T.reading:T.novoice);next(gen);}
function halt(){gen++;ss.cancel();set("idle",T.stopped);}
play.addEventListener("click",function(){
 if(state==="idle")start();
 else if(state==="playing"){ss.pause();set("paused",T.paused);}
 else{ss.resume();set("playing",T.reading);}});
stop.addEventListener("click",halt);
window.addEventListener("pagehide",function(){gen++;ss.cancel()});
try{ss.getVoices();}catch(e){}
set("idle","");
})();
