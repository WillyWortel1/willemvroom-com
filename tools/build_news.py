#!/usr/bin/env python3
"""Build news/index.html (English) for willemvroom.com. Text + images only, no video.
Usage: build_news.py --title T --date 2026-11-08 --text article-en.md --assets DIR
DIR must contain kaart-krakau-en.png, kaart-polen-en.png, kaars.jpg."""
import argparse,html,os,re,shutil,sys
p=argparse.ArgumentParser();a=p.add_argument
a('--title',required=True);a('--date',required=True);a('--text',required=True);a('--assets',required=True)
o=p.parse_args();e=html.escape
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)));d=os.path.join(root,'news');os.makedirs(d,exist_ok=True)
paras=[l.strip() for l in open(o.text,encoding='utf-8').read().split('\n') if l.strip() and not l.lstrip().startswith(('#','![','*'))]
M=['January','February','March','April','May','June','July','August','September','October','November','December']
y,m,dd=o.date.split('-');ds=f'{int(dd)} {M[int(m)-1]} {y}';t=e(o.title)
S=[('Małopolska Police (X), 7–8 November','https://x.com/kwpkrakow'),
('Polish Police (X), reconstruction, 8 November','https://x.com/PolskaPolicja/status/2119382978627248335'),
('Świętokrzyskie Police (X), 7 November','https://x.com/SPolicja/status/2119173745713529094'),
('Polish National Prosecutor\'s Office (X), 8 November','https://x.com/PK_GOV_PL/status/2119367536441524417'),
('City of Kraków: shooting in the city centre (Polish)','https://krakow.pl/aktualnosci/345151,29,komunikat,strzelanina_w_centrum_krakowa__sa_zabici_i_ranni.html'),
('City of Kraków: national mourning on 8 and 9 November (Polish)','https://krakow.pl/aktualnosci/345178,29,komunikat,8_i_9_listopada_obowiazuje_zaloba_narodowa__.html'),
('City of Kraków: city mourning until 11 November (Polish)','https://krakow.pl/aktualnosci/345157,29,komunikat,prezydent_miasta_oglosil_zalobe_na_terenie_krakowa__flagi_przepasane_kirem__miejskie_imprezy_odwolane.html'),
('Reuters (via Investing.com), 7 November','https://www.investing.com/news/world-news/polish-gunman-kills-four-women-and-two-men-in-krakows-main-square-5009995'),
('WP, eyewitnesses, 7 November (Polish)','https://wiadomosci.wp.pl/krakow/myslalem-ze-kreca-film-swiadkowie-o-strzelaninie-na-krakowskim-rynku-7348513298622944a'),
('PAP via Super Express, 8 November (Polish)','https://www.se.pl/krakow/lzy-cisna-sie-do-oczu-poruszajace-slowa-o-bohaterze-strzelaniny-w-krakowie-dla-kuby-sluzba-byla-wszystkim-aa-42YR-AHUZ-WkV7.html'),
('RMF FM, Academy of Fine Arts, 8 November (Polish)','https://www.rmf.fm/magazyn/news,n1025324,zamach-w-krakowie-akademia-sztuk-pieknych-zegna-swoja-studentke-i-oglasza-zalobe.html'),
('Fakt, neighbours in Ostrowiec, 8 November (Polish)','https://www.fakt.pl/wydarzenia/polska/sasiedzi-wspominaja-zamordowanych-bliskich-zamachowca-z-krakowa/gnp04kk'),
('Map data: © OpenStreetMap contributors (ODbL), Natural Earth','https://www.openstreetmap.org/copyright')]
src=''.join(f'<li><a href="{e(u)}" rel="noreferrer noopener" target="_blank">{e(n)}</a></li>' for n,u in S)
FIGS=[('Point 1 is the Main Market Square','kaart-krakau-en.png','kaart-krakau.png',1920,1080,'Map of Kraków with point 1 at the Main Market Square and point 2 at Dietla and Stradomska streets.','Main Market Square (1): area of the shooting. Dietla/Stradomska (2): vicinity of the arrest. Map: <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>, ODbL.'),
('Ostrowiec lies north-east','kaart-polen-en.png','kaart-polen.png',1920,1080,'Map of Poland with Kraków and point 3 at Ostrowiec Świętokrzyski.','Point 3: Ostrowiec Świętokrzyski. Map: <a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> (public domain); city positions: OpenStreetMap and Polish PRNG register.'),
('Poland is observing national mourning','kaars.jpg','kaars.jpg',1600,1200,'A burning candle against a dark background; illustrative photo.','Illustrative photo; not taken at this event. Photo: <a href="https://commons.wikimedia.org/wiki/File:Candle-Vela.jpg">ViajeroExtraviado / Wikimedia Commons</a>, 11 June 2018, <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>.')]
out=[];n=0
for x in paras:
    for pre,s_,dst,w,h,alt,cap in FIGS:
        if x.startswith(pre):
            n+=1;shutil.copy(os.path.join(o.assets,s_),os.path.join(d,dst))
            out.append(f'</div><figure class="nw-m nw-f"><img src="/news/{dst}" width="{w}" height="{h}" loading="lazy" decoding="async" alt="{e(alt)}"><figcaption class="mt-2 text-sm text-subtle">{cap}</figcaption></figure><div class="nw-w nw-m text-lg text-fg nw-body">')
    out.append(f'<p>{e(x)}</p>')
if n!=len(FIGS): sys.exit(f'IMAGE CHECK FAILED: {n} of {len(FIGS)}')
body=''.join(out);desc=e(paras[0][:155])
moon='<button id="thm" type="button" aria-label="Toggle theme"><svg class="moon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg><svg class="sun" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>'
H=f'''<!DOCTYPE html>
<html lang="en-US" class="antialiased">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t} — News — willemvroom.com</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="https://willemvroom.com/news/">
<link rel="alternate" hreflang="nl" href="https://willemvroom.nl/nieuws/"><link rel="alternate" hreflang="en" href="https://willemvroom.com/news/">
<meta name="theme-color" content="#ffffff">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preload" href="/fonts/ibm-plex-sans-latin-wght-normal-IvpUvPa2.woff2" as="font" type="font/woff2" crossorigin>
<script src="/textsize.js?v=3"></script>
<link rel="stylesheet" href="/styles.css?v=20261018">
<link rel="stylesheet" href="/site.css?v=20261028-sticky">
<meta property="og:type" content="article"><meta property="og:locale" content="en_US"><meta property="og:url" content="https://willemvroom.com/news/"><meta property="og:title" content="{t}"><meta property="og:description" content="{desc}">
<script>(function(){{try{{var t=localStorage.getItem("wv-theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches)){{document.documentElement.classList.add("dark");var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#0b0b0b");}}}}catch(e){{}}}})();</script>
<style>.nw-w{{max-width:42rem}}.nw-m{{margin-top:2.5rem}}.nw-w p+p{{margin-top:1.1em}}.text-lg{{line-height:1.65}}figure.nw-m{{max-width:56rem}}.nw-f img{{display:block;width:100%;height:auto;border-radius:16px}}figcaption a{{color:inherit;text-decoration:underline}}.nw-src a{{color:var(--accent)}}.nw-src{{font-size:.875rem;word-break:break-word}}.nw-src li{{margin:.35rem 0}}.nw-ls{{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem 1rem}}.nw-ls[hidden]{{display:none}}.nw-ls button{{min-height:44px;padding:0 1.1rem;border:1px solid currentColor;border-radius:999px;background:none;color:var(--accent);font-weight:600;font-size:.875rem;cursor:pointer}}.nw-ls button:disabled{{opacity:.4;cursor:default}}.nw-ls input[type=range]{{flex:1 1 10rem;min-width:8rem;accent-color:var(--accent)}}.nw-ls button:focus-visible{{outline:3px solid #ff2a3a;outline-offset:2px}}</style>
</head>
<body>
<div id="top" class="bg-bg text-fg">
<a class="skip" href="#inhoud">Skip to content</a>
<header class="wv-head"><a href="/" class="home">willemvroom.com</a><nav>
{moon}
</nav></header>
<main id="inhoud"><article class="mx-auto max-w-6xl px-5 pt-16 pb-20 sm:px-8 sm:pt-24 sm:pb-28">
<p class="text-sm text-subtle">News · <time datetime="{o.date}">{ds}</time></p>
<h1 class="section-title nw-w mt-3">{t}</h1>
<div id="listen" class="nw-w mt-4 nw-ls" role="group" aria-label="Read article aloud" hidden><audio preload="none" src="/news/listen.mp3"></audio><button type="button" data-a="play" aria-pressed="false">Listen</button><button type="button" data-a="stop" disabled>Stop</button><input type="range" data-a="seek" min="0" max="0" step="1" value="0" aria-label="Position in the audio"><span data-s role="status" aria-live="off" class="text-sm text-subtle"></span></div>
<div class="nw-w nw-m text-lg text-fg nw-body">{body}</div>
<div class="nw-w border-t border-line pt-4 nw-m"><h2 class="font-display text-2xl leading-tight font-medium tracking-tight">Sources</h2><ul class="nw-src mt-4">{src}</ul></div>
<p class="nw-m"><a class="link-line press inline-flex min-h-11 items-center text-sm font-medium" href="/">← Back to willemvroom.com</a></p>
</article></main>
<footer class="border-t border-line">
<div class="mx-auto flex max-w-6xl flex-col items-center gap-2 px-5 py-8 text-center text-sm text-subtle sm:px-8">
<p>willemvroom.com</p>
<p>© 2026</p>
</div>
</footer>
</div>
<script src="/site.js?v=20261020-n2"></script>
<script src="/news/listen.js?v=2"></script>
</body>
</html>
'''
got=re.findall(r'<li><a href="([^"]+)"',re.search(r'<ul class="nw-src mt-4">(.*?)</ul>',H,re.S).group(1))
if got!=[e(u) for _,u in S]: sys.exit('SOURCES CHECK FAILED')
if re.search(r'<video|\.mp4|<track|\.vtt',H): sys.exit('VIDEO CHECK FAILED')
if re.search(r'\b(Krakau|het|een|niet|Bronnen)\b',re.sub(r'<a [^>]*>|https?://\S+','',H)): sys.exit('LANGUAGE CHECK FAILED')
if '/news/listen.mp3' not in H or 'speechSynthesis' in H: sys.exit('AUDIO CHECK FAILED')
if not os.path.isfile(os.path.join(d,'listen.mp3')): sys.exit('AUDIO FILE MISSING: '+'listen.mp3')
if 'id="listen"' not in H or 'listen.js' not in H: sys.exit('LISTEN CHECK FAILED')
open(os.path.join(d,'index.html'),'w',encoding='utf-8').write(H);print('ok sources',len(got),'images',n)
