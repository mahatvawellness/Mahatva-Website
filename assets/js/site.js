(() => {
'use strict';
const M = window.MH, D = document, H = D.documentElement, $ = (s, r = D) => r.querySelector(s), $$ = (s, r = D) => [...r.querySelectorAll(s)];
const calm = matchMedia('(prefers-reduced-motion:reduce)').matches, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const store = { get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k) } catch (e) { return null } }, set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v) } catch (e) { } } };

/* ---------- menu + language ---------- */
const lb = $('.langb'), lp = $('#langp'), bg = $('.burger'), dr = $('#drawer');
const setLang = o => { lp.hidden = !o; lb.setAttribute('aria-expanded', o) };
const setMenu = o => { dr.hidden = !o; bg.setAttribute('aria-expanded', o); D.body.classList.toggle('open', o) };
lb.onclick = e => { e.stopPropagation(); setMenu(false); setLang(lp.hidden) };
bg.onclick = () => { setLang(false); setMenu(dr.hidden) };
D.addEventListener('click', e => { if (!lp.hidden && !lp.contains(e.target)) setLang(false) });
D.addEventListener('keydown', e => { if (e.key === 'Escape') { setLang(false); setMenu(false) } });
dr.addEventListener('click', e => { if (e.target.closest('nav a')) setMenu(false) });
D.addEventListener('click', e => { const a = e.target.closest('[data-lang]'); if (a) { store.set('mh-lang', a.dataset.lang); if (location.hash && !a.href.includes('#')) a.href += location.hash } });

/* ---------- location-based language suggestion ---------- */
const STATE = {}; const add = (c, l) => l.split('|').forEach(s => STATE[s] = c);
add('ta', 'tamil nadu|tamilnadu|puducherry|pondicherry|tn|py');
add('ml', 'kerala|lakshadweep|kl|ld');
add('kn', 'karnataka|ka');
add('te', 'andhra pradesh|telangana|ap|ts|tg');
add('hi', 'uttar pradesh|madhya pradesh|bihar|rajasthan|haryana|himachal pradesh|uttarakhand|uttaranchal|jharkhand|chhattisgarh|delhi|national capital territory of delhi|nct|new delhi|chandigarh|andaman and nicobar islands|andaman and nicobar|maharashtra|gujarat|punjab|jammu and kashmir|ladakh|dadra and nagar haveli and daman and diu|daman and diu|dadra and nagar haveli');
const CITY = { mahe: 'ml', yanam: 'te' }; // enclaves of Puducherry
const norm = s => (s || '').toLowerCase().replace(/&/g, 'and').replace(/^(state|union territory) of /, '').trim();
function pick(g) { if (!g || !g.region) return null; if (g.country && !/^(india|in)$/i.test(g.country)) return null; const c = CITY[norm(g.city)] || STATE[norm(g.region)]; return c && M.sug[c] ? { code: c, state: g.region } : null }
async function ask(u) { const c = new AbortController(), t = setTimeout(() => c.abort(), 3500); try { const r = await fetch(u, { signal: c.signal, credentials: 'omit', referrerPolicy: 'no-referrer' }); if (!r.ok) throw 0; return await r.json() } finally { clearTimeout(t) } }
async function locate() {
  const test = new URLSearchParams(location.search).get('state'); if (test) return { region: test, country: 'India' };
  const c = store.get('mh-geo', 1); if (c) try { return JSON.parse(c) } catch (e) { }
  for (const u of [M.geo, 'https://get.geojs.io/v1/ip/geo.json', 'https://ipwho.is/?fields=country,region,city'].filter(Boolean)) try { const j = await ask(u), g = { region: j.region || j.regionName, country: j.country || j.countryCode, city: j.city }; if (g.country) { store.set('mh-geo', JSON.stringify(g), 1); return g } } catch (e) { }
  return null;
}
async function suggest() {
  const g = await locate(); let s = pick(g);
  if (!g) for (const n of navigator.languages || []) { const c = n.slice(0, 2); if (c !== 'en' && M.sug[c]) { s = { code: c }; break } }
  if (!s || s.code === 'en') return;
  const S = M.sug[s.code];
  $$(`.lc[data-lang="${s.code}"]`).forEach(a => { a.classList.add('sugd'); if (s.state && !a.querySelector('.tag')) { const t = D.createElement('span'); t.className = 'tag'; t.textContent = M.st.replace('{state}', s.state); a.append(t) } });
  const forced = new URLSearchParams(location.search).has('state');
  if (M.lang !== 'en' || (!forced && (store.get('mh-lang') || store.get('mh-nosug', 1)))) return;
  const el = $('.sug'); el.innerHTML = `<span class="wd" lang="${s.code}" aria-hidden="true"></span><small></small><p lang="${s.code}"></p><div><a class="btn" lang="${s.code}" data-lang="${s.code}"></a><button></button></div>`;
  $('.wd', el).textContent = S.w; $('small', el).textContent = s.state ? M.st.replace('{state}', s.state) : S.n; $('p', el).textContent = S.q; const a = $('a', el); a.textContent = S.y; a.href = M.paths[s.code] + location.hash;
  const b = $('button', el); b.textContent = M.no; b.onclick = () => { el.hidden = true; store.set('mh-lang', 'en') };
  addEventListener('scroll', function mini() { if (scrollY > innerHeight * .7) { el.classList.add('mini'); removeEventListener('scroll', mini) } }, { passive: true });
  setTimeout(() => el.hidden = false, H.classList.contains('seen') ? 900 : 2800);
}
suggest();

/* ---------- reveals ---------- */
$$('.rvl,h1').forEach(h => $$('.w', h).forEach((w, i) => w.style.setProperty('--i', i)));
$$('.care,.pgs,.pers,.steps ol,.dben ul').forEach(p => [...p.children].forEach((c, i) => c.style.setProperty('--i', i % 6)));
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px', threshold: .05 });
const first = store.get('mh-seen', 1); if (first) H.classList.add('seen');
const go = () => { $$('.rv,.rvl,h1,.pho').forEach(e => io.observe(e)) };
if (D.body.classList.contains('home') && !first && !calm) { store.set('mh-seen', '1', 1); setTimeout(go, 1900) } else go();

/* ribbon clones, then illustration visibility */
$$('.rtr').forEach(r => { [...r.children].forEach(a => { const c = a.cloneNode(true); c.tabIndex = -1; c.setAttribute('aria-hidden', 'true'); r.append(c) }) });
const ao = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('in', e.isIntersecting)), { rootMargin: '60px' });
const watch = r => $$('.art', r).forEach(a => ao.observe(a)); watch(D);

/* ---------- header ---------- */
const top = $('.top'); let ly = 0;
/* ---------- pillars ---------- */
const panels = $$('.panel');
panels.forEach(p => {
  const b = $('.ph', p), on = () => { const was = p.classList.contains('on'); panels.forEach(q => { const o = q === p && !(was && innerWidth <= 900); q.classList.toggle('on', o); $('.ph', q).setAttribute('aria-expanded', o) }) };
  b.addEventListener('click', on);
  const slot = $('.part', p); let cur;
  $$('[data-art]', p).forEach(a => { const f = () => { if (cur === a.dataset.art) return; const s = $(`.rib a[data-id="${a.dataset.art}"] svg`); if (!s) return; cur = a.dataset.art; const n = s.cloneNode(true); n.classList.remove('in'); slot.replaceChildren(n); requestAnimationFrame(() => requestAnimationFrame(() => n.classList.add('in'))) }; a.addEventListener('pointerenter', f); a.addEventListener('focus', f) });
});

/* ---------- gallery drag ---------- */
const gal = $('.gal');
if (gal) { let d = 0, sx, sl; gal.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; d = 1; sx = e.clientX; sl = gal.scrollLeft; gal.classList.add('drag') }); addEventListener('pointermove', e => { if (d) gal.scrollLeft = sl - (e.clientX - sx) * 1.3 }); addEventListener('pointerup', () => { d = 0; gal.classList.remove('drag') });
  const px = () => $$('figure', gal).forEach(f => { const r = f.getBoundingClientRect(); f.style.setProperty('--px', clamp((innerWidth - r.left) / (innerWidth + r.width)).toFixed(3)) }); gal.addEventListener('scroll', px, { passive: true }); px() }

/* ---------- therapies filter ---------- */
const fil = $('.fil');
if (fil) {
  const q = $('#q'), cs = $$('.listp .cards .card'), cnt = $('.cnt'), none = $('.none'); let f = location.hash.slice(1);
  if (!$(`.fil [data-f="${CSS.escape(f)}"]`)) f = '';
  const run = () => { const s = q.value.trim().toLowerCase(); let n = 0; cs.forEach(c => { const o = (!f || c.dataset.p === f) && (!s || c.dataset.s.includes(s)); c.classList.toggle('hide', !o); n += o }); cnt.textContent = M.res.replace('{n}', n); none.hidden = n > 0; $$('button', fil).forEach(b => b.setAttribute('aria-pressed', b.dataset.f === f)) };
  fil.onclick = e => { const b = e.target.closest('button'); if (!b) return; f = b.dataset.f; history.replaceState(null, '', f ? '#' + f : location.pathname); if (D.startViewTransition && !calm) D.startViewTransition(run); else run() };
  q.oninput = run; addEventListener('hashchange', () => { f = location.hash.slice(1); run() }); run();
}
/* touch: reveal the photo of the card nearest the middle of the screen */
if (matchMedia('(hover:none)').matches) { const co = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('show', e.isIntersecting)), { rootMargin: '-42% 0px -42% 0px' }); $$('.card,.cc').forEach(c => co.observe(c)) }

/* ---------- enquiry form ---------- */
const form = $('.form');
if (form) {
  const sel = form.interest, pre = new URLSearchParams(location.search).get('i'); if (pre) sel.value = pre;
  D.addEventListener('click', e => { const a = e.target.closest('[data-int]'); if (a) sel.value = a.dataset.int });
  form.onsubmit = e => {
    e.preventDefault(); const msg = $('.fmsg', form), bad = [form.name, form.phone].filter(i => { const el = form.querySelector(`[name=${i === form.name ? 'name' : 'phone'}]`), b = !el.value.trim() || (el.name === 'phone' && el.value.replace(/\D/g, '').length < 8); el.classList.toggle('bad', b); el.setAttribute('aria-invalid', b); return b });
    if (bad.length) { msg.textContent = M.err; form.querySelector('.bad').focus(); return }
    if (!M.wa) { msg.textContent = M.soon; return }
    const v = n => form.querySelector(`[name=${n}]`), t = ['MAHATVA', v('name').value, v('phone').value, sel.selectedOptions[0].textContent, v('msg').value].filter(Boolean).join('\n');
    open('https://wa.me/' + M.wa + '?text=' + encodeURIComponent(t), '_blank', 'noopener');
  };
}

/* ---------- hero words ---------- */
const ws = $$('.words span'); if (ws.length > 1 && !calm) { let i = Math.max(0, ws.findIndex(w => w.classList.contains('on'))); setInterval(() => { ws[i].classList.remove('on'); i = (i + 1) % ws.length; ws[i].classList.add('on') }, 2600) }

/* ---------- enso, painted bristle by bristle ---------- */
const cv = $('.enso'), hero = $('.hero');
if (cv) {
  const c = cv.getContext('2d'); let W, Hh, R, cx, cy, B = [], t0 = performance.now() + (first || calm ? 0 : 1500), mx = 0, my = 0, tx = 0, ty = 0, vis = true, done = false;
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647 })();
  for (let i = 0; i < 124; i++) { const u = i / 123, edge = Math.abs(u - .5) * 2; B.push({ off: (u - .5), a0: -80 + rnd() * 12 * (1 + edge), a1: -80 - 280 + edge * 24 + rnd() * 26, w: .5 + rnd() * 2.4, al: .08 + rnd() * .34, ph: rnd() * 6.28, gap: rnd() < .46 ? [rnd() < .5 ? rnd() * .24 : .62 + rnd() * .3, .05 + rnd() * .2] : null, wob: rnd() * 5 }) }
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); W = hero.clientWidth; Hh = hero.clientHeight; cv.width = W * d; cv.height = Hh * d; c.setTransform(d, 0, 0, d, 0, 0); const m = W < 800; R = m ? Math.min(W * .36, Hh * .2) : Math.min(W * .232, Hh * .365); cx = m ? W * .56 : W * .735; cy = m ? Hh * .25 : Hh * .5; const a = -36 * Math.PI / 180; hero.style.setProperty('--dx', (cx + R * .98 * Math.cos(a)) + 'px'); hero.style.setProperty('--dy', (cy + R * .98 * Math.sin(a)) + 'px'); H.style.setProperty('--dotr', R * .52) };
  const paint = now => {
    const p = calm ? 1 : clamp((now - t0) / 2600), e = 1 - Math.pow(1 - p, 3), br = calm ? 0 : Math.sin(now / 2400); tx += (mx - tx) * .05; ty += (my - ty) * .05;
    c.clearRect(0, 0, W, Hh); c.lineCap = 'round';
    for (const b of B) {
      const tot = b.a0 - b.a1, end = tot * e; if (end <= 0) continue; const N = 46; let pen = false;
      c.beginPath(); for (let i = 0; i <= N; i++) { const f = i / N; if (f > e + .0001) break; if (b.gap && f > b.gap[0] && f < b.gap[0] + b.gap[1]) { pen = false; continue }
        const a = (b.a0 - tot * f) * Math.PI / 180, th = R * (.06 + .2 * Math.pow(Math.sin(Math.PI * clamp(f * .92 + .04)), 1.4)), r = R + b.off * th + Math.sin(a * 3 + b.ph + now / 3000) * b.wob * .5 + br * 3 * (1 + b.off), x = cx + Math.cos(a) * r + tx * (14 + b.off * 60), y = cy + Math.sin(a) * r * 1.02 + ty * (14 + b.off * 60); pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true }
      c.strokeStyle = `rgba(106,90,75,${b.al})`; c.lineWidth = b.w * R / 190; c.stroke();
    }
  };
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5 }, { passive: true });
  new IntersectionObserver(e => vis = e[0].isIntersecting).observe(hero); addEventListener('resize', size); size();
  if (calm) paint(0); else (function loop(n) { if (vis) paint(n); requestAnimationFrame(loop) })(performance.now());
}

/* ---------- scroll scenes + travelling dot ---------- */
const prog = el => { const r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)) };
const nt = $('.not'), nos = $$('.no'), yes = $('.yes'), nl = $('.nl'), bms = $('.bms'), jour = $('.jour'), band = $('.band'), jl = $$('.jn li'), trav = $('.trav'), sun = $('.sun'), anc = $$('.dota');
let X = null, Y, S;
function frame() {
  const y = scrollY; top.classList.toggle('sc', y > 40); if (Math.abs(y - ly) > 6) { top.classList.toggle('up', y > ly && y > 500 && !D.body.classList.contains('open') && lp.hidden); ly = y }
  if (nt) { const p = calm ? 1 : prog(nt); nos.forEach((n, i) => n.style.setProperty('--k', clamp((p - .06 - i * .19) / .14))); const o = clamp((p - .64) / .1); nl.style.opacity = 1 - o; nl.style.transform = `translateY(${-o * 40}px)`; yes.style.setProperty('--y', clamp((p - .7) / .14)) }
  if (bms) { const p = calm ? .8 : prog(bms); bms.style.setProperty('--q', (1 - clamp(p / .8) * .2).toFixed(3)) }
  if (jour) { const p = calm ? 1 : prog(jour); jour.style.setProperty('--j', clamp(p / .75).toFixed(3)); jl.forEach((l, i) => l.style.setProperty('--o', clamp((p - .04 - i * .15) / .12).toFixed(2))) }
  if (band && !calm) { const b = band.getBoundingClientRect(); band.style.setProperty('--b', clamp((innerHeight - b.top) / (innerHeight * .95)).toFixed(3)) }
  if (trav && anc.length && !calm) {
    const pts = anc.map(a => { const k = a.dataset.dot; let r = a.getBoundingClientRect(); if (k === 'sun') { const q = sun.getBoundingClientRect(); r = { left: q.left + q.width / 2, top: q.top + q.height / 2 } } return { x: r.left, y: r.top, s: k === 'hero' ? +getComputedStyle(H).getPropertyValue('--dotr') || 100 : k === 'sun' ? 46 : +k, sec: a.closest('section').getBoundingClientRect(), k } });
    const mid = innerHeight * .5; let i = 0; pts.forEach((p, n) => { if (p.sec.top < innerHeight * .35) i = n });
    const a = pts[i], b = pts[i + 1]; let x = a.x, yy = a.y, s = a.s;
    if (b) { const span = innerHeight * .9, k = clamp((innerHeight * .94 - b.sec.top) / span), far = a.sec.bottom < innerHeight * .5, e = k * k * (3 - 2 * k); if (far || k > 0) { const ry = clamp(yy, innerHeight * .12, innerHeight * .9), rx = innerWidth - 22, dx = far ? rx : a.x, dy = far ? innerHeight * (.18 + .64 * clamp(y / (D.body.scrollHeight - innerHeight))) : ry, ds = far ? 14 : a.s; x = dx + (b.x - dx) * e; yy = dy + (b.y - dy) * e; s = ds + (b.s - ds) * e + Math.sin(e * Math.PI) * 10 } }
    if (!b && a.sec.bottom < innerHeight * .2) s = 0;
    if (X === null) { X = x; Y = yy; S = 0 } X += (x - X) * .16; Y += (yy - Y) * .16; S += (s - S) * .12; if (Math.abs(x - X) < .3) X = x;
    trav.style.transform = `translate(${X.toFixed(1)}px,${Y.toFixed(1)}px) scale(${(S / 100).toFixed(3)})`; trav.classList.add('on');
  }
  requestAnimationFrame(frame);
}
if (trav && !first && !calm) setTimeout(frame, 1700); else frame();
})();
