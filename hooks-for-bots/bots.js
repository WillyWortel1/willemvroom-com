(function(){
var T={grokbot:null,grok:"https://grok.com/?q=",chatgpt:"https://chatgpt.com/?q=",dots:null,claude:"https://claude.ai/new?q=",perplexity:"https://www.perplexity.ai/search/new?q=",gemini:null,metaai:null,muse:null};
var N={grokbot:"Grok Bot",grok:"Grok",chatgpt:"ChatGPT",dots:"ChatGPT Dots",claude:"Claude",perplexity:"Perplexity",gemini:"Gemini",metaai:"Meta AI",muse:"Muse"};
function toast(m){var t=document.getElementById("bt-toast");if(!t){t=document.createElement("div");t.id="bt-toast";t.setAttribute("role","status");t.style.cssText="position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#111;color:#fff;padding:.7rem 1.1rem;border-radius:999px;font-weight:600;z-index:99;font-size:.9rem;max-width:90vw;text-align:center";document.body.appendChild(t);}t.textContent=m;t.style.display="block";clearTimeout(t._h);t._h=setTimeout(function(){t.style.display="none"},2600);}
function copy(s){if(navigator.clipboard&&window.isSecureContext){return navigator.clipboard.writeText(s).catch(function(){fb(s)});}fb(s);return Promise.resolve();}
function fb(s){var a=document.createElement("textarea");a.value=s;a.setAttribute("readonly","");a.style.cssText="position:fixed;top:0;opacity:0";document.body.appendChild(a);a.select();a.setSelectionRange(0,s.length);try{document.execCommand("copy")}catch(e){}document.body.removeChild(a);}
function txt(id){var e=document.getElementById(id);return e?e.innerText.trim():"";}
document.querySelectorAll("pre.pr").forEach(function(p){
 var row=document.createElement("p");row.className="noprint sendrow";
 var h='<button type="button" class="pbtn" data-a="copy">Copy prompt</button><span class="lb">Send to</span>';
 for(var k in N)h+='<button type="button" class="pbtn sm" data-a="'+k+'">'+N[k]+'</button>';
 row.innerHTML=h;p.parentNode.insertBefore(row,p.nextSibling);
 row.addEventListener("click",function(ev){var b=ev.target.closest("button");if(!b)return;var a=b.getAttribute("data-a"),s=txt(p.id);
  if(a==="copy"){copy(s);toast("Prompt copied");return;}
  // Always copy too: fallback if the prefill is ignored (e.g. logged out or app intercepts the link)
  copy(s);
  var O={dots:"https://chatgpt.com/",grokbot:"https://x.ai/bot",gemini:"https://gemini.google.com/app",metaai:"https://www.meta.ai/",muse:"https://muse.ai/"};var url=T[a]?T[a]+encodeURIComponent(s):O[a];
  var w=window.open(url,"_blank","noopener");if(!w){location.href=url;}
  toast(T[a]?"Opening "+N[a]+". Prompt also copied, paste it if the box is empty":"Copied, paste it in "+N[a]+(a==="dots"?" (needs ChatGPT Pro or Business Premium)":""));
 });
});
})();
