# willemvroom.com

Static site on GitHub Pages (main, root). Custom domain in `CNAME`.

## Add a work card
In `index.html`, inside `<section id="werk">`, replace the `New work coming soon.` line (or add below the marker comment) with:

```html
<article class="grid gap-4 border-b border-line py-8 sm:grid-cols-12 sm:gap-6 sm:py-10">
<div class="flex items-baseline justify-between sm:col-span-2 sm:block"><p class="werk-nr font-display text-2xl leading-none">01</p><p class="mt-2 text-sm text-subtle">2026</p></div>
<div class="sm:col-span-7"><h3 class="font-display text-3xl leading-tight font-medium tracking-tight">Project title</h3>
<p class="mt-3 max-w-xl text-base text-muted">Short description.</p></div>
<div class="sm:col-span-3 sm:text-right"><a href="/project/" class="link-line press inline-flex min-h-11 items-center gap-2 text-sm font-medium">Open</a></div>
</article>
```

Number cards 01, 02, … in order. Remove the "coming soon" line once the first card is in. Commit and push; Pages updates in about a minute.
