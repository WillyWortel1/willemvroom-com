(function(){
var S=[87.5,100,112.5,125,137.5,150],K="wv-textsize",d=document.documentElement;
function get(){try{var v=parseFloat(localStorage.getItem(K));return S.indexOf(v)>-1?v:100}catch(e){return 100}}
function set(v){d.style.fontSize=v===100?"":v+"%";try{v===100?localStorage.removeItem(K):localStorage.setItem(K,v)}catch(e){}}
set(get());
function ui(){var nav=document.querySelector(".wv-head nav");if(!nav||document.getElementById("ts"))return;
 var w=document.createElement("span");w.id="ts";w.setAttribute("role","group");w.setAttribute("aria-label","Text size");
 w.innerHTML='<button type="button" data-d="-1" aria-label="Smaller text" class="ts-s">A</button><span class="ts-sep" aria-hidden="true">|</span><button type="button" data-d="1" aria-label="Larger text" class="ts-l">A</button>';
 nav.insertBefore(w,nav.firstChild);
 function upd(){var i=S.indexOf(get());w.children[0].disabled=i<=0;w.children[2].disabled=i>=S.length-1;}
 w.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var i=S.indexOf(get())+ +b.getAttribute("data-d");if(i<0||i>=S.length)return;set(S[i]);upd();});
 upd();}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",ui);else ui();
})();
