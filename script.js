/* =========================================================
   PT Cardani Konstruksi Utama — interaksi & kalkulator
   ========================================================= */
(function () {
'use strict';

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const fmt = (n, d = 0) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d });
const rp = (n) => 'Rp ' + fmt(Math.round(n));

/* ---------- Jam real-time ---------- */
function updateClock() {
    const clockElement = document.getElementById('clock');
    if (clockElement) {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        clockElement.textContent = timeString + ' WIB';
    }
}
window.updateClock = updateClock;
updateClock();
setInterval(updateClock, 1000);

/* ---------- Ticker cuaca Jabodetabek ---------- */
const dataCuaca = [
    'Jakarta: Cerah Berawan 33°C (Siap Kirim Material)',
    'Bogor: Hujan Ringan 25°C (Awas Semen Basah)',
    'Depok: Berawan 30°C (Cocok Buat Pasang Bata)',
    'Tangerang: Cerah Panas 34°C (Semangat Kuli!)',
    'Bekasi: Panas Cetar 35°C (Gass Ngecor!)'
];
let indeksCuaca = 0;
function rotasiCuaca() {
    const el = document.getElementById('weather-ticker');
    if (!el) return;
    if (reduceMotion) { el.textContent = dataCuaca[indeksCuaca]; indeksCuaca = (indeksCuaca + 1) % dataCuaca.length; return; }
    el.classList.add('is-out');
    setTimeout(() => {
        el.textContent = dataCuaca[indeksCuaca];
        indeksCuaca = (indeksCuaca + 1) % dataCuaca.length;
        el.classList.remove('is-out');
        el.classList.add('is-in');
        void el.offsetWidth;
        el.classList.remove('is-in');
    }, 350);
}
rotasiCuaca();
setInterval(rotasiCuaca, 3500);

/* ---------- Teks per kata (untuk animasi mask) ---------- */
$$('[data-split]').forEach((el) => {
    let i = 0;
    (function walk(node) {
        Array.from(node.childNodes).forEach((n) => {
            if (n.nodeType === 3) {
                const parts = n.textContent.split(/(\s+)/);
                const frag = document.createDocumentFragment();
                parts.forEach((p) => {
                    if (!p) return;
                    if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
                    const o = document.createElement('span'); o.className = 'sw';
                    const inner = document.createElement('span'); inner.className = 'sw__i'; inner.style.setProperty('--i', i++);
                    inner.textContent = p; o.appendChild(inner); frag.appendChild(o);
                });
                node.replaceChild(frag, n);
            } else if (n.nodeType === 1) walk(n);
        });
    })(el);
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
});

/* ---------- Preloader & intro ---------- */
function ready() {
    root.classList.add('is-ready');
    try { sessionStorage.setItem('cardani-intro', '1'); } catch (e) { /* abaikan */ }
}
if (reduceMotion || root.classList.contains('no-loader')) {
    requestAnimationFrame(() => requestAnimationFrame(ready));
} else {
    const lb = $('#loaderBar'), lc = $('#loaderCount');
    const t0 = performance.now(), dur = 1300;
    (function tick(t) {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        lb.style.transform = 'scaleX(' + e + ')';
        lc.textContent = String(Math.round(e * 100)).padStart(3, '0');
        if (k < 1) requestAnimationFrame(tick); else setTimeout(ready, 180);
    })(t0);
}

/* ---------- Reveal saat scroll (dengan stagger) ---------- */
const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealIO.unobserve(e.target);
    });
}, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
function observeReveal(scope = document) {
    $$('[data-reveal]:not(.is-in)', scope).forEach((el) => {
        const sibs = $$(':scope > [data-reveal]', el.parentElement);
        const i = sibs.indexOf(el);
        if (sibs.length > 1 && i > 0) el.style.setProperty('--d', (i % 4) * 0.09 + 's');
        revealIO.observe(el);
    });
}
observeReveal();
$$('.footer__word').forEach((el) => revealIO.observe(el));

/* ---------- Parallax gambar (hanya yang terlihat) ---------- */
const parallaxEls = new Set();
const pIO = new IntersectionObserver((entries) => entries.forEach((e) => { e.isIntersecting ? parallaxEls.add(e.target) : parallaxEls.delete(e.target); }));
if (!reduceMotion) $$('[data-parallax]').forEach((el) => pIO.observe(el));
function runParallax() {
    const vh = window.innerHeight;
    parallaxEls.forEach((img) => {
        const r = img.parentElement.getBoundingClientRect();
        const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
        img.style.transform = 'translate3d(0,' + (p * -7).toFixed(2) + '%,0)';
    });
}

/* ---------- Progress bar, nav, parallax ---------- */
const nav = $('#nav');
const bar = $('#progressBar');
let ticking = false;
let lastY = window.scrollY;
function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
    nav.classList.toggle('is-scrolled', y > 8);
    // Nav sembunyi saat scroll turun, muncul lagi saat scroll naik
    if (!document.getElementById('sheet').classList.contains('is-open')) {
        if (y > lastY + 6 && y > 480) nav.classList.add('is-hidden');
        else if (y < lastY - 6 || y < 480) nav.classList.remove('is-hidden');
    }
    lastY = y;
    if (!reduceMotion) runParallax();
    ticking = false;
}
window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
onScroll();

/* ---------- Menu HP ---------- */
const burger = $('#burger');
const sheet = $('#sheet');
function setMenu(open) {
    sheet.classList.toggle('is-open', open);
    sheet.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
}
burger.addEventListener('click', () => setMenu(!sheet.classList.contains('is-open')));
sheet.addEventListener('click', (e) => { if (e.target.closest('a') || e.target.hasAttribute('data-close')) setMenu(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth >= 1080) setMenu(false); movePill(); });

/* ---------- Scroll-spy + pil nav ---------- */
const navLinks = $('#navLinks');
const pill = $('.nav__pill');
let activeId = 'beranda';
function movePill(target) {
    const a = target || $('a.is-active', navLinks);
    if (!a || !pill || navLinks.offsetParent === null) { if (pill) pill.style.opacity = 0; return; }
    pill.style.width = a.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
    pill.style.opacity = 1;
}
function setActive(id) {
    activeId = id;
    $$('[data-spy]').forEach((a) => a.classList.toggle('is-active', a.dataset.spy === id));
    movePill();
}
navLinks.addEventListener('mouseover', (e) => { const a = e.target.closest('a'); if (a) movePill(a); });
navLinks.addEventListener('mouseleave', () => movePill());
const spyIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
}, { rootMargin: '-40% 0px -55% 0px' });
['beranda', 'dashboard', 'petinggi', 'layanan', 'kalkulator', 'katalog'].forEach((id) => { const s = document.getElementById(id); if (s) spyIO.observe(s); });
setActive('beranda');

/* ---------- Ripple pada tombol ---------- */
document.addEventListener('pointerdown', (e) => {
    const btn = e.target.closest('.btn');
    if (!btn || reduceMotion) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    btn.appendChild(s);
    setTimeout(() => s.remove(), 650);
});

/* ---------- Tombol magnetik (desktop) ---------- */
if (finePointer && !reduceMotion) {
    $$('[data-magnetic]').forEach((b) => {
        b.addEventListener('pointermove', (e) => {
            const r = b.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.35;
            b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        });
        b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
}

/* ---------- Tilt + sorotan kartu (desktop) ---------- */
if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--ry', ((px - 0.5) * 6).toFixed(2) + 'deg');
            card.style.setProperty('--rx', ((0.5 - py) * 6).toFixed(2) + 'deg');
            card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
            card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
            card.classList.add('is-tilting');
        });
        card.addEventListener('pointerleave', () => card.classList.remove('is-tilting'));
    });
}

/* ---------- Carousel layanan (HP) ---------- */
const services = $('#services');
const dots = $$('#serviceDots i');
if (services && dots.length) {
    services.addEventListener('scroll', () => {
        const w = services.firstElementChild.offsetWidth + 12;
        const i = Math.min(dots.length - 1, Math.round(services.scrollLeft / w));
        dots.forEach((d, k) => d.classList.toggle('on', k === i));
    }, { passive: true });
}

/* =========================================================
   KATALOG MATERIAL (ilustrasi SVG buatan sendiri)
   ========================================================= */
const shade = '<ellipse cx="80" cy="104" rx="50" ry="7" fill="#000" opacity=".35"/>';
const ILLO = {
    bag: (c1, c2, label) => `${shade}<path d="M46 30Q80 22 114 30L120 98Q80 107 40 98Z" fill="${c1}"/><path d="M46 30Q80 22 114 30L112 41Q80 34 48 41Z" fill="#000" opacity=".18"/><rect x="52" y="54" width="56" height="26" rx="5" fill="${c2}"/><text x="80" y="72" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="800" fill="#fff">${label}</text><path d="M58 88h44" stroke="#000" stroke-opacity=".15" stroke-width="3" stroke-linecap="round"/>`,
    pile: (c1, c2, stones) => {
        let d = '';
        if (stones) for (let i = 0; i < 26; i++) { const x = 40 + ((i * 37) % 80), y = 58 + ((i * 23) % 40); if (y > 102 - Math.abs(x - 80) * 0.4 || y < 40 + Math.abs(x - 80) * 0.95) continue; d += `<ellipse cx="${x}" cy="${y}" rx="4" ry="3" fill="${c2}"/>`; }
        return `${shade}<path d="M18 102Q44 44 80 38Q116 44 142 102Z" fill="${c1}"/><path d="M80 38Q64 50 56 76" stroke="#fff" stroke-opacity=".18" stroke-width="4" fill="none" stroke-linecap="round"/>${d}`;
    },
    stones: () => `${shade}<ellipse cx="56" cy="88" rx="24" ry="15" fill="#6b7280"/><ellipse cx="102" cy="90" rx="22" ry="13" fill="#7c8592"/><ellipse cx="80" cy="66" rx="25" ry="16" fill="#8b95a3"/><ellipse cx="74" cy="60" rx="9" ry="4" fill="#fff" opacity=".18"/><ellipse cx="50" cy="82" rx="7" ry="3" fill="#fff" opacity=".15"/>`,
    bricks: () => {
        let r = shade;
        for (let row = 0; row < 4; row++) for (let col = 0; col < 3; col++) {
            const off = row % 2 ? 14 : 0, x = 30 + col * 34 + off, y = 82 - row * 15;
            if (x + 32 > 136) continue;
            r += `<rect x="${x}" y="${y}" width="32" height="13" rx="2" fill="${row % 2 ? '#b4532a' : '#c4622d'}"/><rect x="${x}" y="${y}" width="32" height="3" rx="1.5" fill="#fff" opacity=".15"/>`;
        }
        return r;
    },
    block: () => `${shade}<path d="M34 56L70 46 128 56 92 66Z" fill="#f1f3f6"/><path d="M34 56L92 66V98L34 88Z" fill="#d9dde3"/><path d="M92 66L128 56V88L92 98Z" fill="#b9c0ca"/><g fill="#9aa3af" opacity=".5"><circle cx="50" cy="72" r="1.5"/><circle cx="62" cy="80" r="1.2"/><circle cx="76" cy="74" r="1.5"/><circle cx="84" cy="86" r="1.2"/><circle cx="104" cy="76" r="1.3"/><circle cx="116" cy="70" r="1.2"/></g>`,
    rods: (n) => {
        let r = shade;
        for (let i = 0; i < 5; i++) { const o = i * 8; r += `<path d="M${22 + o} ${96 - o * 0.2}L${132 + o * 0.2} ${36 + o}" stroke="#6b7684" stroke-width="${3 + n}" stroke-linecap="round"/><path d="M${22 + o} ${96 - o * 0.2}L${132 + o * 0.2} ${36 + o}" stroke="#a5b0bd" stroke-width="${1 + n * 0.4}" stroke-dasharray="2 5" stroke-linecap="round"/>`; }
        return r;
    },
    tiles: (c1, c2, n) => {
        let r = shade + '<g transform="translate(80 70) scale(1 .55) rotate(45)">';
        const s = 78 / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) r += `<rect x="${-39 + i * s + 1}" y="${-39 + j * s + 1}" width="${s - 2}" height="${s - 2}" rx="1.5" fill="${(i + j) % 2 ? c1 : c2}"/>`;
        return r + '<rect x="-39" y="-39" width="78" height="20" fill="#fff" opacity=".12"/></g>';
    },
    bucket: (c) => `${shade}<path d="M50 40H110L104 100H56Z" fill="#e8ecf2"/><ellipse cx="80" cy="40" rx="30" ry="7" fill="#cfd5dd"/><path d="M53 60H107L105 82H55Z" fill="${c}"/><path d="M50 40Q80 8 110 40" fill="none" stroke="#9aa3af" stroke-width="3"/><path d="M66 40v10q0 4 3 4t3-4v-10" fill="${c}"/>`,
    roof: () => {
        let r = shade;
        for (let row = 0; row < 4; row++) { const y = 46 + row * 14; let d = `M28 ${y}`; for (let k = 0; k < 6; k++) d += `q9 -9 18 0`; r += `<path d="${d}v12h-108z" fill="${row % 2 ? '#a9472a' : '#bf5631'}"/><path d="M28 ${y}${'q9 -9 18 0'.repeat(6)}" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="2"/>`; }
        return r;
    },
    truss: () => `${shade}<path d="M20 96L80 34 140 96Z" fill="none" stroke="#c7ced8" stroke-width="5" stroke-linejoin="round"/><path d="M50 96L65 50M80 96V34M110 96L95 50M50 96L80 66 110 96" fill="none" stroke="#9aa5b3" stroke-width="3"/>`,
    mixer: () => `${shade}<rect x="22" y="70" width="112" height="16" rx="3" fill="#374151"/><path d="M110 50H130L138 66V80H110Z" fill="#ffc531"/><rect x="116" y="55" width="12" height="9" rx="2" fill="#7dd3fc"/><g transform="rotate(-14 66 58)"><ellipse cx="66" cy="58" rx="40" ry="20" fill="#e5e7eb"/><path d="M40 44l12 28M60 38l12 40M82 40l10 34" stroke="#ffc531" stroke-width="5"/></g><circle cx="42" cy="92" r="9" fill="#111827"/><circle cx="64" cy="92" r="9" fill="#111827"/><circle cx="122" cy="92" r="9" fill="#111827"/><circle cx="42" cy="92" r="3" fill="#6b7280"/><circle cx="64" cy="92" r="3" fill="#6b7280"/><circle cx="122" cy="92" r="3" fill="#6b7280"/>`,
    coil: () => `${shade}<circle cx="80" cy="64" r="36" fill="#e5e7eb"/><circle cx="80" cy="64" r="36" fill="none" stroke="#cbd2db" stroke-width="2" stroke-dasharray="3 3"/><circle cx="80" cy="64" r="26" fill="none" stroke="#d1d5db" stroke-width="6"/><circle cx="80" cy="64" r="14" fill="#1f2937"/><path d="M116 64Q132 70 128 96" fill="none" stroke="#e5e7eb" stroke-width="5" stroke-linecap="round"/><path d="M126 94l-4 8M130 94l3 8" stroke="#ffc531" stroke-width="2.5" stroke-linecap="round"/>`,
    pipe: () => `${shade}<g transform="rotate(-18 80 66)"><rect x="24" y="52" width="112" height="28" fill="#cfd6df"/><rect x="24" y="52" width="112" height="7" fill="#fff" opacity=".35"/><rect x="60" y="52" width="40" height="28" fill="#2b6cb0" opacity=".25"/><ellipse cx="136" cy="66" rx="7" ry="14" fill="#9aa3af"/><ellipse cx="136" cy="66" rx="4" ry="9" fill="#4b5563"/><ellipse cx="24" cy="66" rx="7" ry="14" fill="#cfd6df"/></g>`
};
const svg = (inner) => `<svg viewBox="0 0 160 120" aria-hidden="true">${inner}</svg>`;

const CATALOG = [
    { id: 'semen', cat: 'Struktur', name: 'Semen Portland 50 kg', spec: 'PCC, sak 50 kg', unit: 'sak', price: 70000, img: ILLO.bag('#a7afb9', '#c0392b', '50 KG') },
    { id: 'pasir', cat: 'Struktur', name: 'Pasir Cor', spec: 'Pasir beton bersih, per m³', unit: 'm³', price: 300000, img: ILLO.pile('#c9a66b', '#000', false) },
    { id: 'split', cat: 'Struktur', name: 'Batu Split 1–2 cm', spec: 'Kerikil cor, per m³', unit: 'm³', price: 330000, img: ILLO.pile('#7d8590', '#5c636c', true) },
    { id: 'batukali', cat: 'Struktur', name: 'Batu Kali', spec: 'Pondasi, per m³', unit: 'm³', price: 280000, img: ILLO.stones() },
    { id: 'readymix', cat: 'Struktur', name: 'Beton Ready Mix K-300', spec: 'Truk mixer, per m³', unit: 'm³', price: 1050000, img: ILLO.mixer() },
    { id: 'besi8', cat: 'Struktur', name: 'Besi Beton Ø8 mm', spec: 'Panjang 12 m, SNI', unit: 'batang', price: 55000, img: ILLO.rods(0) },
    { id: 'besi10', cat: 'Struktur', name: 'Besi Beton Ø10 mm', spec: 'Panjang 12 m, SNI', unit: 'batang', price: 85000, img: ILLO.rods(1) },
    { id: 'besi12', cat: 'Struktur', name: 'Besi Beton Ø12 mm', spec: 'Panjang 12 m, SNI', unit: 'batang', price: 120000, img: ILLO.rods(2) },
    { id: 'besi16', cat: 'Struktur', name: 'Besi Beton Ø16 mm', spec: 'Panjang 12 m, SNI', unit: 'batang', price: 210000, img: ILLO.rods(3) },
    { id: 'bata', cat: 'Dinding', name: 'Bata Merah Press', spec: '±5 × 10 × 20 cm', unit: 'buah', price: 900, img: ILLO.bricks() },
    { id: 'hebel', cat: 'Dinding', name: 'Bata Ringan (Hebel) 10 cm', spec: '60 × 20 × 10 cm', unit: 'buah', price: 9500, img: ILLO.block() },
    { id: 'mortar', cat: 'Dinding', name: 'Mortar Instan 40 kg', spec: 'Perekat bata ringan & keramik', unit: 'sak', price: 95000, img: ILLO.bag('#e7e2d4', '#2563eb', 'MORTAR') },
    { id: 'keramik30', cat: 'Finishing', name: 'Keramik 30 × 30', spec: 'Isi 11 pcs (0,99 m²)', unit: 'dus', price: 60000, img: ILLO.tiles('#d9cbb4', '#e8dcc8', 4) },
    { id: 'keramik40', cat: 'Finishing', name: 'Keramik Lantai 40 × 40', spec: 'Isi 6 pcs (0,96 m²)', unit: 'dus', price: 65000, img: ILLO.tiles('#e5e7eb', '#f3f4f6', 3) },
    { id: 'granit60', cat: 'Finishing', name: 'Granit 60 × 60', spec: 'Isi 4 pcs (1,44 m²)', unit: 'dus', price: 185000, img: ILLO.tiles('#6b7280', '#9ca3af', 2) },
    { id: 'cat', cat: 'Finishing', name: 'Cat Tembok Interior 5 L', spec: 'Daya sebar ±10 m²/L/lapis', unit: 'galon', price: 150000, img: ILLO.bucket('#ffc531') },
    { id: 'genteng', cat: 'Atap', name: 'Genteng Keramik', spec: '±14 buah per m²', unit: 'buah', price: 6500, img: ILLO.roof() },
    { id: 'bajaringan', cat: 'Atap', name: 'Rangka Atap Baja Ringan', spec: 'Harga terpasang per m²', unit: 'm²', price: 185000, img: ILLO.truss() },
    { id: 'kabel', cat: 'MEP', name: 'Kabel NYM 3 × 2,5 mm²', spec: 'Roll 50 m', unit: 'roll', price: 850000, img: ILLO.coil() },
    { id: 'pipa', cat: 'MEP', name: 'Pipa PVC 3" (AW)', spec: 'Panjang 4 m', unit: 'batang', price: 120000, img: ILLO.pipe() }
];
const byId = Object.fromEntries(CATALOG.map((c) => [c.id, c]));

/* ---------- Keranjang estimasi ---------- */
let cart = {};
try { cart = JSON.parse(localStorage.getItem('cardani-cart') || '{}') || {}; } catch (e) { cart = {}; }
function saveCart() { try { localStorage.setItem('cardani-cart', JSON.stringify(cart)); } catch (e) { /* abaikan */ } }
const qtyFmt = (q) => (Number.isInteger(q) ? fmt(q) : fmt(q, 1));

const catalogEl = $('#catalog');
catalogEl.innerHTML = CATALOG.map((c) => `
    <article class="item" data-id="${c.id}" data-cat="${c.cat}">
        <div class="item__img">${svg(c.img)}<span class="item__tag">${c.cat}</span><span class="item__qtybadge" data-badge>0</span></div>
        <div class="item__body">
            <h3 class="item__name">${c.name}</h3>
            <p class="item__spec">${c.spec}</p>
            <p class="item__price">${rp(c.price)} <small>/ ${c.unit}</small></p>
            <div class="stepper">
                <button type="button" data-step="-1" aria-label="Kurangi ${c.name}"><svg class="ico"><use href="#i-minus"/></svg></button>
                <output data-qty>0</output>
                <button type="button" data-step="1" aria-label="Tambah ${c.name}"><svg class="ico"><use href="#i-plus"/></svg></button>
            </div>
        </div>
    </article>`).join('');

const cats = ['Semua', ...new Set(CATALOG.map((c) => c.cat))];
const filtersEl = $('#catFilters');
filtersEl.innerHTML = cats.map((c, i) => `<button type="button" class="tab" aria-pressed="${i === 0}" ${i === 0 ? 'aria-selected="true"' : ''} data-cat="${c}">${c}</button>`).join('');
filtersEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    $$('.tab', filtersEl).forEach((t) => { const on = t === b; t.setAttribute('aria-selected', String(on)); t.setAttribute('aria-pressed', String(on)); });
    let k = 0;
    $$('.item', catalogEl).forEach((it) => {
        const show = b.dataset.cat === 'Semua' || it.dataset.cat === b.dataset.cat;
        it.classList.toggle('is-hide', !show);
        it.classList.remove('is-pop');
        if (show && !reduceMotion) { it.style.setProperty('--d', Math.min(k++, 8) * 0.04 + 's'); void it.offsetWidth; it.classList.add('is-pop'); }
    });
});

catalogEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-step]');
    if (!b) return;
    const id = b.closest('.item').dataset.id;
    const next = Math.max(0, Math.round(((cart[id] || 0) + Number(b.dataset.step)) * 10) / 10);
    if (next <= 0) delete cart[id]; else cart[id] = next;
    renderCart(id);
});

$('#cartReset').addEventListener('click', () => { cart = {}; renderCart(); });

const pillEl = $('#cartPill');
function renderCart(bumpId) {
    saveCart();
    $$('.item', catalogEl).forEach((it) => {
        const q = cart[it.dataset.id] || 0;
        const out = $('[data-qty]', it);
        out.textContent = qtyFmt(q);
        $('[data-badge]', it).textContent = qtyFmt(q);
        it.classList.toggle('is-picked', q > 0);
        if (bumpId === it.dataset.id && !reduceMotion) { out.classList.remove('bump'); void out.offsetWidth; out.classList.add('bump'); }
    });
    const ids = Object.keys(cart).filter((id) => byId[id]);
    const total = ids.reduce((s, id) => s + cart[id] * byId[id].price, 0);
    $('#cartBody').innerHTML = ids.length
        ? `<div class="cost">${ids.map((id) => `<div class="cost__row"><span>${byId[id].name} <small>× ${qtyFmt(cart[id])} ${byId[id].unit}</small></span><span>${rp(cart[id] * byId[id].price)}</span></div>`).join('')}
           <div class="cost__total"><span>Total Estimasi</span><span>${rp(total)}</span></div></div>`
        : '<p class="cart__empty">Belum ada material dipilih. Tekan tombol + pada katalog, atau masukkan hasil kalkulator ke sini.</p>';
    $('#cartCount').textContent = ids.length;
    $('#cartPillTotal').textContent = rp(total);
    updatePill();
}

/* Pil keranjang kecil: hanya muncul di area kalkulator/katalog & saat ringkasan belum terlihat */
const pillZones = new Set();
let cartVisible = false;
function updatePill() {
    const has = Object.keys(cart).length > 0;
    pillEl.classList.toggle('is-show', has && pillZones.size > 0 && !cartVisible);
}
new IntersectionObserver((entries) => {
    entries.forEach((e) => { e.isIntersecting ? pillZones.add(e.target.id) : pillZones.delete(e.target.id); });
    updatePill();
}).observe($('#katalog'));
new IntersectionObserver((entries) => { cartVisible = entries[0].isIntersecting; updatePill(); }, { threshold: 0.2 }).observe($('#cart'));
renderCart();

/* ---------- Toast ---------- */
let toastEl, toastT;
function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-show'), 2200);
}

/* =========================================================
   KALKULATOR (10 jenis)
   ========================================================= */
const ERR_COR = 'Harap masukkan angka yang benar, Bos! Panjang, Lebar, dan Tebal tidak boleh kosong atau nol.';
const ERR = 'Harap masukkan angka yang benar, Bos! Semua kolom wajib diisi dan tidak boleh kosong atau nol.';
const num = (id, ph, label, unit, extra = {}) => Object.assign({ id, ph, label, unit }, extra);
const sel = (id, label, options) => ({ id, label, type: 'select', options });

const CALCS = [
    {
        key: 'cor', tab: 'Cor Dak', icon: 'i-ruler',
        title: 'Kalkulator Estimasi Cor Dak Beton',
        desc: 'Hitungan valid material (Rasio 1:2:3) untuk pengecoran plat lantai/jalan.',
        fields: [num('panjang', 'Contoh: 10', 'Panjang (Meter)', 'm'), num('lebar', 'Contoh: 5', 'Lebar (Meter)', 'm'), num('tebal', 'Contoh: 12', 'Tebal Cor (Centimeter)', 'cm', { wide: true })],
        err: ERR_COR,
        run(v) {
            const p = v.panjang, l = v.lebar, t = v.tebal / 100;
            const volume = p * l * t;
            const semen = Math.ceil(volume * 7);
            const pasir = +(volume * 0.5).toFixed(2);
            const split = +(volume * 0.8).toFixed(2);
            const totalMaterialAlam = pasir + split;
            const ritase = Math.ceil(totalMaterialAlam / 3.5);
            return {
                head: ['Hasil Kalkulasi Volume', volume, 2, 'm³'],
                sub: 'Estimasi Material Bersih (Rasio 1:2:3):',
                stats: [['Semen (50kg)', semen, 0, 'Sak'], ['Pasir Cor', pasir, 2, 'm³'], ['Batu Split (Kerikil)', split, 2, 'm³']],
                cost: [['semen', semen], ['pasir', pasir], ['split', split]],
                note: `<b>Info Logistik:</b> Total muatan pasir dan split sekitar ${fmt(totalMaterialAlam, 2)} m³. Muatan ini membutuhkan estimasi sekitar <b>${ritase} rit</b> angkutan truk bak (engkel). Kalau material ini disubkon angkutannya ke armada truk sendiri via aplikasi Lalamove, lumayan banget kan bisa buat nambah-nambah cuan bersih Rp 100.000 - Rp 150.000 per harinya!<br><br>Alternatif praktis: beton <b>ready mix K-300</b> ± ${rp(volume * byId.readymix.price)}.`,
                noteIcon: 'i-truck'
            };
        }
    },
    {
        key: 'bata', tab: 'Pasangan Bata', icon: 'i-building',
        title: 'Kebutuhan Pasangan Dinding',
        desc: 'Bata merah ½ batu campuran 1:4 (70 buah/m²) atau bata ringan 10 cm (8,33 buah/m²). Sudah termasuk cadangan pecah 5%.',
        fields: [num('p', 'Contoh: 12', 'Panjang Dinding (Meter)', 'm'), num('t', 'Contoh: 3', 'Tinggi Dinding (Meter)', 'm'), num('buka', 'Contoh: 4', 'Luas Pintu/Jendela (m²)', 'm²', { min0: true }), sel('jenis', 'Jenis Bata', [['merah', 'Bata Merah'], ['hebel', 'Bata Ringan (Hebel)']])],
        cols: 4,
        run(v) {
            const luas = v.p * v.t - (v.buka || 0);
            if (luas <= 0) return null;
            if (v.jenis === 'hebel') {
                const pcs = Math.ceil(luas * 8.33 * 1.05), mortar = Math.ceil(luas / 9);
                return { head: ['Luas Dinding Bersih', luas, 2, 'm²'], sub: 'Kebutuhan material bata ringan (thinbed):', stats: [['Bata Ringan 10 cm', pcs, 0, 'buah'], ['Mortar Instan 40 kg', mortar, 0, 'sak'], ['Volume Hebel', luas * 0.1, 2, 'm³']], cost: [['hebel', pcs], ['mortar', mortar]], note: 'Tips: bata ringan lebih cepat dipasang (±15–20 m²/hari per tukang) dan bebannya lebih ringan untuk struktur.' };
            }
            const bata = Math.ceil(luas * 70 * 1.05), semen = Math.ceil(luas * 11.5 / 50), pasir = +(luas * 0.043).toFixed(2);
            return { head: ['Luas Dinding Bersih', luas, 2, 'm²'], sub: 'Kebutuhan material bata merah (campuran 1:4):', stats: [['Bata Merah', bata, 0, 'buah'], ['Semen (50kg)', semen, 0, 'Sak'], ['Pasir Pasang', pasir, 2, 'm³']], cost: [['bata', bata], ['semen', semen], ['pasir', pasir]], note: 'Produktivitas tukang bata merah ±8–10 m²/hari. Rendam bata sebelum dipasang agar adukan tidak cepat kering.' };
        }
    },
    {
        key: 'plester', tab: 'Plester & Aci', icon: 'i-building',
        title: 'Plesteran & Acian Dinding',
        desc: 'Plester campuran 1:4 (6,24 kg semen & 0,024 m³ pasir per m² untuk tebal 15 mm) + acian 3,25 kg semen/m².',
        fields: [num('luas', 'Contoh: 60', 'Luas Bidang Dinding (m²)', 'm²', { wide: true }), num('tebal', 'Contoh: 15', 'Tebal Plester (mm)', 'mm', { def: 15 }), sel('aci', 'Pakai Acian?', [['ya', 'Ya, plester + aci'], ['tidak', 'Plester saja']])],
        run(v) {
            const semenKg = v.luas * 0.416 * v.tebal + (v.aci === 'ya' ? v.luas * 3.25 : 0);
            const sak = Math.ceil(semenKg / 50), pasir = +(v.luas * 0.0016 * v.tebal).toFixed(2);
            return { head: ['Luas Plesteran', v.luas, 2, 'm²'], sub: 'Kebutuhan material plester' + (v.aci === 'ya' ? ' + acian:' : ':'), stats: [['Total Semen', semenKg, 0, 'kg'], ['Semen (50kg)', sak, 0, 'Sak'], ['Pasir Pasang', pasir, 2, 'm³']], cost: [['semen', sak], ['pasir', pasir]], note: 'Hitung dua sisi dinding jika plester dalam & luar. Tunggu plester kering ±7 hari sebelum diaci.' };
        }
    },
    {
        key: 'cat', tab: 'Cat Dinding', icon: 'i-building',
        title: 'Kebutuhan Cat Tembok',
        desc: 'Liter = luas × jumlah lapis ÷ daya sebar. Kemasan galon 5 liter.',
        fields: [num('luas', 'Contoh: 120', 'Luas Bidang Cat (m²)', 'm²', { wide: true }), num('lapis', 'Contoh: 2', 'Jumlah Lapis', 'x', { def: 2 }), num('sebar', 'Contoh: 10', 'Daya Sebar (m²/L)', 'm²/L', { def: 10 })],
        run(v) {
            const liter = v.luas * v.lapis / v.sebar, galon = Math.ceil(liter / 5);
            return { head: ['Kebutuhan Cat', liter, 1, 'liter'], sub: 'Rincian kebutuhan:', stats: [['Galon 5 L', galon, 0, 'galon'], ['Luas Total Dicat', v.luas * v.lapis, 0, 'm²'], ['Cadangan', galon * 5 - liter, 1, 'liter']], cost: [['cat', galon]], note: 'Untuk dinding baru, gunakan 1 lapis cat dasar (sealer/alkali resisting) sebelum cat akhir agar warna awet.' };
        }
    },
    {
        key: 'keramik', tab: 'Keramik', icon: 'i-building',
        title: 'Kebutuhan Keramik Lantai',
        desc: 'Jumlah dus dihitung dari luas ruangan + 5% potongan/pecah. Perekat mortar instan ±1 sak per 4 m².',
        fields: [num('p', 'Contoh: 4', 'Panjang Ruangan (Meter)', 'm'), num('l', 'Contoh: 3', 'Lebar Ruangan (Meter)', 'm'), sel('ukuran', 'Ukuran Keramik', [['40', '40 × 40 cm'], ['30', '30 × 30 cm'], ['60', 'Granit 60 × 60 cm']])],
        run(v) {
            const area = v.p * v.l;
            const map = { 30: ['keramik30', 0.99, 11, 0.09], 40: ['keramik40', 0.96, 6, 0.16], 60: ['granit60', 1.44, 4, 0.36] }[v.ukuran];
            const dus = Math.ceil(area * 1.05 / map[1]), pcs = Math.ceil(area * 1.05 / map[3]), mortar = Math.ceil(area / 4);
            return { head: ['Luas Lantai', area, 2, 'm²'], sub: 'Kebutuhan keramik & perekat:', stats: [['Keramik', dus, 0, 'dus'], ['Jumlah Keping', pcs, 0, 'pcs'], ['Mortar Instan', mortar, 0, 'sak']], cost: [[map[0], dus], ['mortar', mortar]], note: 'Beli dari satu nomor produksi (shading) yang sama agar warna seragam, dan sisakan 1 dus untuk cadangan perbaikan.' };
        }
    },
    {
        key: 'besi', tab: 'Besi Tulangan', icon: 'i-ruler',
        title: 'Berat & Jumlah Besi Tulangan',
        desc: 'Berat besi = 0,00617 × d² kg/m (d dalam mm). Batang standar 12 m + 5% untuk sambungan/overlap.',
        fields: [sel('d', 'Diameter Besi', [['10', 'Ø10 mm'], ['8', 'Ø8 mm'], ['12', 'Ø12 mm'], ['16', 'Ø16 mm']]), num('n', 'Contoh: 4', 'Jumlah Tulangan', 'btg'), num('L', 'Contoh: 30', 'Panjang per Tulangan (m)', 'm')],
        run(v) {
            const d = Number(v.d), total = v.n * v.L, perM = 0.00617 * d * d, berat = perM * total, batang = Math.ceil(total * 1.05 / 12);
            return { head: ['Total Panjang Besi', total, 1, 'm'], sub: `Besi Ø${d} mm (${fmt(perM, 3)} kg/m):`, stats: [['Berat Total', berat, 1, 'kg'], ['Batang 12 m', batang, 0, 'batang'], ['Berat / Batang', perM * 12, 2, 'kg']], cost: [['besi' + d, batang]], note: 'Panjang overlap sambungan tulangan umumnya 40 × diameter (mis. Ø12 → 48 cm). Periksa label SNI & diameter asli dengan jangka sorong.' };
        }
    },
    {
        key: 'pondasi', tab: 'Pondasi Batu Kali', icon: 'i-building',
        title: 'Pondasi Batu Kali (Trapesium)',
        desc: 'Volume = (lebar atas + lebar bawah) ÷ 2 × tinggi × panjang. Campuran 1:4 → 3,26 sak semen, 0,52 m³ pasir, 1,2 m³ batu per m³.',
        fields: [num('p', 'Contoh: 40', 'Panjang Total (m)', 'm', { wide: true }), num('a', 'Contoh: 30', 'Lebar Atas (cm)', 'cm', { def: 30 }), num('b', 'Contoh: 60', 'Lebar Bawah (cm)', 'cm', { def: 60 }), num('t', 'Contoh: 70', 'Tinggi (cm)', 'cm', { def: 70 })],
        cols: 4,
        run(v) {
            const vol = (v.a + v.b) / 200 * (v.t / 100) * v.p;
            const batu = +(vol * 1.2).toFixed(2), semen = Math.ceil(vol * 3.26), pasir = +(vol * 0.52).toFixed(2);
            return { head: ['Volume Pondasi', vol, 2, 'm³'], sub: 'Kebutuhan material (campuran 1:4):', stats: [['Batu Kali', batu, 2, 'm³'], ['Semen (50kg)', semen, 0, 'Sak'], ['Pasir Pasang', pasir, 2, 'm³']], cost: [['batukali', batu], ['semen', semen], ['pasir', pasir]], note: 'Jangan lupa lapisan pasir urug ±5–10 cm dan aanstamping (batu kosong) di bawah pondasi.' };
        }
    },
    {
        key: 'galian', tab: 'Galian Tanah', icon: 'i-truck',
        title: 'Volume Galian & Ritase Buang Tanah',
        desc: 'Tanah galian mengembang ±25% saat diangkut. Truk engkel ±3,5 m³, dump truck ±7 m³.',
        fields: [num('p', 'Contoh: 20', 'Panjang Galian (m)', 'm'), num('l', 'Contoh: 0,8', 'Lebar Galian (m)', 'm'), num('d', 'Contoh: 0,8', 'Kedalaman (m)', 'm', { wide: true })],
        run(v) {
            const vol = v.p * v.l * v.d, gembur = vol * 1.25;
            return { head: ['Volume Galian', vol, 2, 'm³'], sub: 'Volume angkut & ritase:', stats: [['Tanah Gembur', gembur, 2, 'm³'], ['Truk Engkel', Math.ceil(gembur / 3.5), 0, 'rit'], ['Dump Truck', Math.ceil(gembur / 7), 0, 'rit']], extra: [['Upah gali manual (±Rp 85.000/m³)', vol * 85000]], note: 'Produktivitas gali manual ±3–4 m³ per pekerja per hari (tanah biasa).', noteIcon: 'i-truck' };
        }
    },
    {
        key: 'atap', tab: 'Atap', icon: 'i-building',
        title: 'Luas Atap & Kebutuhan Genteng',
        desc: 'Luas atap = luas denah × (1 + overstek) ÷ cos(kemiringan). Genteng keramik ±14 buah/m² + 5% cadangan.',
        fields: [num('denah', 'Contoh: 72', 'Luas Denah Bangunan (m²)', 'm²', { wide: true }), num('deg', 'Contoh: 30', 'Kemiringan (°)', '°', { def: 30 }), num('ov', 'Contoh: 15', 'Tambahan Overstek (%)', '%', { def: 15, min0: true })],
        run(v) {
            if (v.deg >= 80) return null;
            const luas = v.denah * (1 + (v.ov || 0) / 100) / Math.cos(v.deg * Math.PI / 180);
            const genteng = Math.ceil(luas * 14 * 1.05), rangka = Math.ceil(luas);
            return { head: ['Luas Bidang Atap', luas, 2, 'm²'], sub: 'Kebutuhan penutup & rangka:', stats: [['Genteng Keramik', genteng, 0, 'buah'], ['Rangka Baja Ringan', rangka, 0, 'm²'], ['Kemiringan', v.deg, 0, '°']], cost: [['genteng', genteng], ['bajaringan', rangka]], note: 'Genteng keramik umumnya butuh kemiringan minimal 30°. Untuk spandek/metal bisa 15–20°.' };
        }
    },
    {
        key: 'rab', tab: 'RAB Rumah', icon: 'i-building',
        title: 'RAB Kasar Bangun Rumah',
        desc: 'Estimasi biaya borongan per m² (material + upah) wilayah Jabodetabek 2026. Gunakan sebagai patokan awal sebelum RAB detail.',
        fields: [num('luas', 'Contoh: 90', 'Luas per Lantai (m²)', 'm²', { wide: true }), num('lantai', 'Contoh: 1', 'Jumlah Lantai', 'lt', { def: 1 }), sel('kelas', 'Spesifikasi', [['5500000', 'Menengah (Rp 5,5 jt/m²)'], ['4000000', 'Sederhana (Rp 4 jt/m²)'], ['8000000', 'Mewah (Rp 8 jt/m²)']])],
        run(v) {
            const total = v.luas * v.lantai, harga = Number(v.kelas), biaya = total * harga;
            const bulan = Math.max(2, Math.round(total / 25) + 1);
            const pos = [['Persiapan & pekerjaan tanah', 0.05], ['Struktur (pondasi, kolom, balok, plat)', 0.30], ['Dinding & finishing', 0.33], ['Atap & plafon', 0.12], ['Listrik, air & sanitasi (MEP)', 0.12], ['Lain-lain & tak terduga', 0.08]];
            return { head: ['Total Estimasi Biaya', biaya, 0, '', true], sub: 'Ringkasan proyek:', stats: [['Luas Bangunan', total, 0, 'm²'], ['Harga / m²', harga / 1e6, 1, 'jt'], ['Durasi Kira-kira', bulan, 0, 'bulan']], extra: pos.map(([n, f]) => [n + ` (${Math.round(f * 100)}%)`, biaya * f]), noTotal: true, note: 'Komposisi umum: ±60–65% material, ±30% upah, sisanya alat & overhead. Siapkan dana cadangan 10% untuk perubahan di lapangan.' };
        }
    }
];

const tabsEl = $('#calcTabs');
const panelEl = $('#calcPanel');
let currentCalc = CALCS[0];
let lastResult = null;
tabsEl.innerHTML = CALCS.map((c, i) => `<button type="button" class="tab" role="tab" id="tab-${c.key}" aria-selected="${i === 0}" data-key="${c.key}"><svg class="ico"><use href="#${c.icon}"/></svg>${c.tab}</button>`).join('');
tabsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-key]');
    if (!b || b.dataset.key === currentCalc.key) return;
    $$('.tab', tabsEl).forEach((t) => t.setAttribute('aria-selected', String(t === b)));
    b.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
    renderCalc(CALCS.find((c) => c.key === b.dataset.key), true);
});

function fieldHTML(f) {
    if (f.type === 'select') {
        return `<label class="field"><span class="field__label">${f.label}</span><span class="field__box field__box--select"><select id="${f.id}">${f.options.map(([v, t]) => `<option value="${v}">${t}</option>`).join('')}</select></span></label>`;
    }
    return `<label class="field${f.wide ? ' field--wide' : ''}"><span class="field__label">${f.label}</span><span class="field__box"><input type="number" id="${f.id}" placeholder="${f.ph}" inputmode="decimal" min="0" step="any"${f.def !== undefined ? ` value="${f.def}"` : ''}><span class="field__unit">${f.unit}</span></span></label>`;
}

function renderCalc(c, animate) {
    currentCalc = c;
    lastResult = null;
    const cols = c.cols || c.fields.length;
    panelEl.setAttribute('aria-labelledby', 'tab-' + c.key);
    panelEl.innerHTML = `
        <div class="calc__intro"><span class="calc__badge"><svg class="ico"><use href="#${c.icon}"/></svg></span><div><h3>${c.title}</h3><p>${c.desc}</p></div></div>
        <form class="calc__form" novalidate>
            <div class="calc__fields calc__fields--${cols}">${c.fields.map(fieldHTML).join('')}</div>
            <button type="submit" id="btnHitung" class="btn btn--primary btn--block">Kalkulasi Material<svg class="ico"><use href="#i-arrow"/></svg></button>
        </form>
        <div id="hasilCor" class="result hidden" aria-live="polite"></div>`;
    if (animate && !reduceMotion) { panelEl.classList.remove('is-swap'); void panelEl.offsetWidth; panelEl.classList.add('is-swap'); }
}

panelEl.addEventListener('submit', (e) => {
    e.preventDefault();
    hitung();
});
panelEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-addcart]') && lastResult) {
        let n = 0;
        lastResult.cost.forEach(([id, q]) => { if (byId[id] && q > 0) { cart[id] = Math.round(((cart[id] || 0) + Math.ceil(q * 10) / 10) * 10) / 10; n++; } });
        renderCart();
        toast(`✓ ${n} material ditambahkan ke estimasi belanja`);
    }
});
panelEl.addEventListener('input', (e) => { const box = e.target.closest('.field__box'); if (box) box.classList.remove('is-error'); });

function hitung() {
    const c = currentCalc;
    const v = {};
    let ok = true;
    c.fields.forEach((f) => {
        const el = document.getElementById(f.id);
        if (f.type === 'select') { v[f.id] = el.value; return; }
        const raw = String(el.value).replace(',', '.');
        const n = parseFloat(raw);
        const valid = f.min0 ? (raw === '' || n >= 0) : n > 0;
        v[f.id] = isNaN(n) ? 0 : n;
        if (!valid) { ok = false; const box = el.closest('.field__box'); box.classList.remove('is-error'); void box.offsetWidth; box.classList.add('is-error'); }
    });
    const hasilDiv = document.getElementById('hasilCor');
    const res = ok ? c.run(v) : null;
    hasilDiv.classList.remove('hidden', 'is-enter');
    if (!res) {
        lastResult = null;
        hasilDiv.innerHTML = `<div class="alert"><svg class="ico"><use href="#i-alert"/></svg><span>${c.err || ERR}</span></div>`;
        void hasilDiv.offsetWidth; hasilDiv.classList.add('is-enter');
        return;
    }
    lastResult = res;
    const cost = res.cost || [];
    const rows = cost.filter(([id]) => byId[id]).map(([id, q]) => [`${byId[id].name} <small>× ${fmt(q, Number.isInteger(q) ? 0 : 2)} ${byId[id].unit}</small>`, q * byId[id].price]);
    (res.extra || []).forEach((x) => rows.push(x));
    const total = rows.reduce((s, r) => s + r[1], 0);
    const [hl, hv, hd, hu, money] = res.head;
    const statsCls = res.stats.length === 4 ? ' stats--4' : '';
    hasilDiv.innerHTML = `
        <div class="result__head"><h3>${hl}</h3><span class="result__vol">${money ? 'Rp ' : ''}<span data-count="${hv}" data-dec="${hd}">0</span>${hu ? `<small>${hu}</small>` : ''}</span></div>
        <div><p class="result__sub">${res.sub}</p>
            <div class="stats${statsCls}">${res.stats.map(([l, val, d, u]) => `<div class="stat"><span class="stat__label">${l}</span><span class="stat__val"><span data-count="${val}" data-dec="${d}">0</span><small>${u}</small></span></div>`).join('')}</div>
        </div>
        ${rows.length ? `<div class="cost">${rows.map(([n, a]) => `<div class="cost__row"><span>${n}</span><span>${rp(a)}</span></div>`).join('')}${res.noTotal ? '' : `<div class="cost__total"><span>Estimasi Biaya Material</span><span>${rp(total)}</span></div>`}</div>` : ''}
        <div>
            ${res.note ? `<div class="logi"><svg class="ico"><use href="#${res.noteIcon || 'i-check'}"/></svg><p>${res.note}</p></div>` : ''}
            ${cost.length ? `<div class="result__actions"><button type="button" class="btn btn--ghost btn--sm" data-addcart><svg class="ico"><use href="#i-cart"/></svg>Masukkan ke Estimasi Belanja</button></div>` : ''}
        </div>`;
    void hasilDiv.offsetWidth;
    hasilDiv.classList.add('is-enter');
    $$('[data-count]', hasilDiv).forEach(countUp);
}

function countUp(el) {
    const target = Number(el.dataset.count), dec = Number(el.dataset.dec) || 0;
    if (reduceMotion) { el.textContent = fmt(target, dec); return; }
    const dur = 900, t0 = performance.now();
    (function step(t) {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(target * e, dec);
        if (k < 1) requestAnimationFrame(step);
    })(t0);
}

renderCalc(CALCS[0], false);
observeReveal();
})();
