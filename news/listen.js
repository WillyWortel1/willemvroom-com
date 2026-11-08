/* Read-aloud for news pages: plays a pre-recorded MP3 (no browser speech). Same file on .nl and .com. */
(function(){
var box=document.getElementById("listen");if(!box)return;
var a=box.querySelector("audio"),play=box.querySelector("[data-a=play]"),stop=box.querySelector("[data-a=stop]"),seek=box.querySelector("[data-a=seek]"),st=box.querySelector("[data-s]");
var nl=/^nl/i.test(document.documentElement.lang);
var T=nl?{play:"Voorlezen",pause:"Pauzeren",resume:"Doorgaan",load:"Laden…",done:"Klaar.",stopped:"Gestopt.",err:"De audio kon niet worden afgespeeld.",none:"Deze browser kan de audio niet afspelen."}
 :{play:"Listen",pause:"Pause",resume:"Resume",load:"Loading…",done:"Finished.",stopped:"Stopped.",err:"The audio could not be played.",none:"This browser cannot play the audio."};
box.hidden=false;
if(!a||!a.canPlayType||!a.canPlayType("audio/mpeg")){play.hidden=stop.hidden=seek.hidden=true;st.textContent=T.none;return;}
function f(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+":"+("0"+s%60).slice(-2);}
function time(){var d=isFinite(a.duration)?a.duration:0;seek.max=d||0;seek.value=a.currentTime;seek.setAttribute("aria-valuetext",f(a.currentTime)+" / "+f(d));
 if(!a.paused||a.currentTime>0)st.textContent=f(a.currentTime)+" / "+f(d);}
function ui(){play.textContent=a.paused?(a.currentTime>0&&!a.ended?T.resume:T.play):T.pause;
 play.setAttribute("aria-pressed",a.paused?"false":"true");stop.disabled=a.paused&&a.currentTime===0;}
play.addEventListener("click",function(){
 if(a.paused){document.querySelectorAll("audio,video").forEach(function(o){if(o!==a)o.pause()});
  if(a.ended)a.currentTime=0;if(a.readyState<3)st.textContent=T.load;
  var p=a.play();if(p&&p.catch)p.catch(function(){st.textContent=T.err;ui()});}
 else a.pause();});
stop.addEventListener("click",function(){a.pause();a.currentTime=0;ui();time();st.textContent=T.stopped;});
seek.addEventListener("input",function(){if(isFinite(a.duration))a.currentTime=+seek.value;});
["play","pause","playing"].forEach(function(e){a.addEventListener(e,function(){ui();time();})});
a.addEventListener("timeupdate",time);a.addEventListener("loadedmetadata",time);
a.addEventListener("ended",function(){a.currentTime=0;ui();time();st.textContent=T.done;});
a.addEventListener("error",function(){st.textContent=T.err;ui();});
window.addEventListener("pagehide",function(){a.pause()});
ui();
})();
