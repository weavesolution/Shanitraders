/* Shani Traders app — customer side (single page, works offline) */
(() => {
  'use strict';
  const S = window.SHOP || {}, CATS = window.CATEGORIES || [], DICT = window.LANG || { en: {}, hi: {} };
  const APP_VERSION = '4.2';
  // No pinch zoom on iPhone either (Android follows the viewport setting)
  ['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
   // also change version.json on GitHub when a new version is uploaded

  /* ---------- Small helpers ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage full or blocked */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  const num = v => { if (v === '' || v === null || v === undefined) return ''; const n = Number(String(v).replace(/[^\d.]/g, '')); return isFinite(n) && n > 0 ? n : ''; };
  const bool = (v, d) => v === true || v === false ? v : (v === '' || v == null ? d : ['TRUE', '1', 'YES', 'Y'].includes(String(v).trim().toUpperCase()));
  const inr = n => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const fmt = (n, d = 0) => Number(n).toLocaleString('en-IN', { maximumFractionDigits: d });

  /* ---------- Language ---------- */
  function pickLang() {
    const v = store.get('st_lang', '');
    if (v === 'en' || v === 'hi') return v;
    if (S.defaultLang === 'en' || S.defaultLang === 'hi') return S.defaultLang;
    return /^hi\b/i.test(navigator.language || '') ? 'hi' : 'en';
  }
  let lang = pickLang();
  const HI = () => lang === 'hi';
  document.documentElement.lang = lang;
  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) ?? (DICT.en && DICT.en[key]) ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => vars[k] !== undefined ? vars[k] : m);
    return s;
  }
  const loc = (o, k) => (HI() && o && o[k + 'Hi']) ? o[k + 'Hi'] : (o ? o[k] || '' : '');
  const unitT = u => HI() ? ((window.UNITS_HI || {})[String(u || '').toLowerCase()] || u) : u;
  const shop = () => loc(S, 'name');
  const pName = p => loc(p, 'name');
  const itemsN = n => n === 1 ? t('items.1') : t('items.n', { n });
  function setLang(l) { lang = l; store.set('st_lang', l); document.documentElement.lang = l; route(); }

  /* ---------- Icons ---------- */
  const I = {
    home: '<path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    cart: '<path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
    box: '<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/>',
    gift: '<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9S10.5 4 8 4.6C5.8 5.1 7 9 12 9zm0 0s1.5-5 4-4.4C18.2 5.1 17 9 12 9z"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c.8-3.8 3.9-6 7.5-6s6.7 2.2 7.5 6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
    back: '<path d="M15 5 8 12l7 7"/>', chev: '<path d="m9 5 7 7-7 7"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>',
    phone: '<path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16 16 0 0 1 4.5 6.2 2 2 0 0 1 6.5 4z"/>',
    calc: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M8 7.5h8M8.5 12h1M11.5 12h1M14.5 12h1M8.5 15.5h1M11.5 15.5h1M14.5 15.5h1"/>',
    download: '<path d="M12 4v11m-4.5-4.5L12 15l4.5-4.5M5 19.5h14"/>', logout: '<path d="M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h9"/>',
    lang: '<path d="M4 5h9M8.5 3v2M6 5c.5 3.5 3 6.5 6.5 8M11 5c-.5 3.5-3 6.5-6.5 8"/><path d="m12.5 21 4-9.5 4 9.5M14 17.5h5"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>', map: '<path d="M9 5 4 7v12l5-2 6 2 5-2V5l-5 2z"/><path d="M9 5v12M15 7v12"/>',
    wa: '<path fill="currentColor" stroke="none" d="M12 2.8A9.2 9.2 0 0 0 4.1 16.6l-1.3 4.6 4.7-1.2A9.2 9.2 0 1 0 12 2.8zm0 16.8c-1.4 0-2.8-.4-4-1.1l-.3-.2-2.8.7.8-2.7-.2-.3A7.6 7.6 0 1 1 12 19.6zm4.2-5.7c-.2-.1-1.4-.7-1.6-.7-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2a7 7 0 0 1-1.3-1.6c-.1-.2 0-.4.1-.5l.4-.4.2-.4c.1-.1 0-.3 0-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.4c.1.2 1.6 2.5 4 3.5.6.2 1 .4 1.3.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1l-.6-.3z"/>',
    coin: '<circle cx="12" cy="12" r="9" fill="#FDCB0A" stroke="#B88C00"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#B88C00" stroke-width="1.2"/><path d="M9.6 14.2c.4.8 1.3 1.2 2.4 1.2 1.3 0 2.2-.6 2.2-1.5 0-2.1-4.4-1.1-4.4-3.3 0-.9.9-1.5 2.1-1.5 1 0 1.8.4 2.1 1.1M12 7.8v1.3M12 15.4v1.1" stroke="#000" stroke-width="1.3" fill="none"/>',
    cement: '<path d="M7 4.5h10l1.5 3.5v11a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V8z"/><path d="M5.5 8h13M8.5 12.5h7M8.5 15.5h5"/>',
    steel: '<path d="M3.5 18 18 3.5M6.5 20.5 20.5 6.5"/><path d="m6 15.5 1.5 1.5M8.5 13l1.5 1.5M11 10.5l1.5 1.5M13.5 8l1.5 1.5"/>',
    bricks: '<rect x="3" y="5.5" width="18" height="13" rx=".5"/><path d="M3 9.8h18M3 14.2h18M9 5.5v4.3M15 5.5v4.3M6 9.8v4.4M12 9.8v4.4M18 9.8v4.4M9 14.2v4.3M15 14.2v4.3"/>',
    plumbing: '<path d="M4 8.5h10a3.5 3.5 0 0 1 3.5 3.5v2.5"/><path d="M4 6.5v4M9.5 8.5v-3M7.5 5.5h4M15.5 20h4M17.5 14.5V20"/>',
    electrical: '<path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/><path d="M9 18.5h6M10 21h4M12.5 6.5l-2 3.5h3l-2 3.5"/>',
    hardware: '<rect x="5" y="4" width="6" height="16" rx="1"/><rect x="13" y="4" width="6" height="16" rx="1"/><path d="M11 8h2M11 12h2M11 16h2"/>',
    curtain: '<path d="M3 4h18"/><path d="M5 4c0 6 1 11 3 16h3c-1.5-5-2-10-2-16M19 4c0 6-1 11-3 16h-3c1.5-5 2-10 2-16"/>',
    tools: '<path d="M14.5 5.5a4 4 0 0 0 4.9 4.9l-9.2 9.2a2 2 0 0 1-2.8-2.8l9.2-9.2"/><path d="m15.5 4.5 4 4"/>',
    power: '<path d="M4 7h11l2 3H4z"/><path d="M17 8.5h3M8 10l-1.5 9.5h4L11 10"/>',
    tapes: '<circle cx="10" cy="11" r="6.5"/><circle cx="10" cy="11" r="2.5"/><path d="M16.5 11v6.5H21"/>',
    fasteners: '<path d="M9 3.5h6l-1 3h-4zM10 6.5v12l2 2 2-2v-12"/><path d="M10 9.5h4M10 12.5h4M10 15.5h4"/>',
    paints: '<rect x="3.5" y="3.5" width="13" height="5.5" rx="1"/><path d="M16.5 6.2H20v4.6h-8.5v3"/><rect x="10" y="13.8" width="3" height="7" rx=".6"/>',
    tiles: '<rect x="4" y="4" width="7" height="7" rx=".6"/><rect x="13" y="4" width="7" height="7" rx=".6"/><rect x="4" y="13" width="7" height="7" rx=".6"/><rect x="13" y="13" width="7" height="7" rx=".6"/>',
    sand: '<path d="M3 19h18"/><path d="M4.5 19c1.5-4.5 4-8 7.5-8s6 3.5 7.5 8"/><path d="M9 15h.01M13 14h.01M15.5 16.5h.01M11 17h.01"/>',
    ms: '<path d="M3 8h14l4 4H7z"/><path d="M3 8v4h4M3 14h14l4 4H7zM3 14v4h4"/>',
    garden: '<path d="M6 13h12l-1.5 7.5h-9z"/><path d="M12 13V8M12 8c0-3 2-4.5 5-4.5 0 3-2 4.5-5 4.5zM12 10c0-2.5-1.7-4-4.5-4 0 2.5 1.7 4 4.5 4z"/>',
    sanitary: '<path d="M5 9h9a3 3 0 0 1 3 3v1"/><path d="M5 6.5v5M9 9V6.5M7 6.5h4"/><path d="M17 16c0 1.2-.7 2-1.5 2s-1.5-.8-1.5-2 1.5-3 1.5-3 1.5 1.8 1.5 3z"/>',
    bathroom: '<path d="M7 3.5h4v8H7z"/><path d="M5 11.5h14v1a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6z"/><path d="M9 18.5 8 21h8l-1-2.5"/>',
    kitchen: '<path d="M3 13h18v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M12 13V6.5a2.5 2.5 0 0 1 5 0M17 6.5V8"/>',
    doors: '<rect x="6" y="3" width="12" height="18" rx="1"/><path d="M15 12h.01"/><path d="M3 21h18"/>',
    site: '<path d="M3 13h18l-2.5 6h-13z"/><path d="M14 13 18 4"/><path d="M16.5 3.5l3 1.5"/>',
    cleaning: '<path d="M9 9h6l1.5 3v8a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1v-8z"/><path d="M10 9V6h3l3-2v4"/><path d="M5 5h.01M4 8h.01M6.5 3h.01"/>',
    other: '<path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/>',
    safety: '<path d="M7 20v-7.5L5 9.5a1.4 1.4 0 0 1 2.3-1.6L9 10V5a1.3 1.3 0 0 1 2.6 0v4-5.2a1.3 1.3 0 0 1 2.6 0V9V5.5a1.3 1.3 0 0 1 2.6 0V16a4 4 0 0 1-4 4z"/>'
  };
  const svg = (n, cls = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="${cls}">${I[n] || I.box}</svg>`;
  const icon = n => `<span class="ico" aria-hidden="true">${svg(n)}</span>`;
  const coin = '<svg viewBox="0 0 24 24" aria-hidden="true">' + I.coin + '</svg>';

  /* ---------- Catalogue ---------- */
  // Data saved from a different server (an older Google Sheet) is cleared once; the cart stays
  if (store.get('st_api', '') !== S.apiUrl) { ['st_catalog', 'st_auth', 'st_me'].forEach(k => store.del(k)); store.set('st_api', S.apiUrl); }
  let CAT = store.get('st_catalog', null);   // { t, data: { products, gifts, categories, offers, settings, v } }
  let byId = {};
  const prodNorm = p => ({
    id: String(p.id ?? '').trim(), name: String(p.name ?? '').trim(), nameHi: String(p.nameHi ?? '').trim(),
    category: String(p.category ?? '').trim(), brand: String(p.brand ?? '').trim(), unit: String(p.unit ?? '').trim() || 'piece',
    price: num(p.price), points: p.points === '' || p.points == null ? '' : Number(p.points) || 0,
    description: String(p.description ?? ''), descriptionHi: String(p.descriptionHi ?? ''), image: String(p.image ?? '').trim(),
    tags: String(p.tags ?? ''), inStock: bool(p.inStock, true), sort: Number(p.sort) || 9999,
    opts: parseOpts(p.options)
  });
  function parseOpts(v) {
    let a = v; if (typeof v === 'string') { try { a = v.trim() ? JSON.parse(v) : []; } catch (e) { a = []; } }
    return Array.isArray(a) ? a.filter(o => o && o.n).map(o => ({ n: String(o.n), nh: String(o.nh || ''), p: num(o.p), img: String(o.img || '') })) : [];
  }
  function indexCatalog() {
    const d = (CAT && CAT.data) || { products: [], gifts: [], settings: {} };
    d.products = (d.products || []).map(prodNorm).filter(p => p.id && p.name).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
    byId = {}; d.products.forEach(p => { byId[p.id] = p; });
    d.categories = (d.categories || []).filter(c => c && c.id).map(c => ({ ...c, id: String(c.id), sort: Number(c.sort) || 99 })).sort((a, b) => a.sort - b.sort);
    return d;
  }
  let D = indexCatalog();
  const settings = () => Object.assign({ pointsPer100: 1, welcomePoints: 0 }, D.settings || {});

  async function fetchCatalog(force) {
    if (!force && CAT && Date.now() - CAT.t < (S.cacheMinutes || 10) * 60000) return false;
    const have = CAT && CAT.data && CAT.data.v && D.products.length ? CAT.data.v : '';
    const url = S.apiUrl + '?action=catalog' + (have && !force ? '&v=' + encodeURIComponent(have) : '');
    // Google sometimes fails a request when the script is waking up; one quiet retry fixes most of these
    let j;
    try { j = await (await fetch(url, { cache: 'no-store' })).json(); }
    catch (e) { await new Promise(r => setTimeout(r, 1500)); j = await (await fetch(url, { cache: 'no-store' })).json(); }
    if (j && j.same) { CAT.t = Date.now(); store.set('st_catalog', CAT); return false; }   // nothing changed on the server
    if (!j || !Array.isArray(j.products)) throw new Error('bad');
    const changed = !CAT || CAT.data.v !== j.v || !CAT.data.v;
    CAT = { t: Date.now(), data: j }; store.set('st_catalog', CAT);
    D = indexCatalog();
    pruneCart();
    warmImages();
    return changed;
  }
  /* An item without its own photo shows the photo of its first option */
  const imgUrl = p => { const v = p.image || (p.opts && p.opts[0] && p.opts[0].img) || ''; if (!v) return ''; return /^(https?:|images\/)/i.test(v) ? v : 'images/' + v; };
  const media = (p, ic) => icon(ic || catOf(p.category).icon) +
    (imgUrl(p) ? `<img src="${esc(imgUrl(p))}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">` : '');
  const catList = () => (D.categories && D.categories.length ? D.categories : CATS);
  const catOf = id => { const c = catList().find(x => x.id === id); return c ? { ...c, icon: c.icon || 'other', label: loc(c, 'name') } : { id, icon: 'other', label: id || '—' }; };
  /* All categories from the sheet (even empty ones), then any category used by an item but not listed */
  const catsInUse = () => { const ids = new Set(D.products.map(p => p.category)); const listed = catList().map(c => c.id);
    return [...listed, ...[...ids].filter(id => id && !listed.includes(id))]; };
  const catPhoto = id => { const c = catList().find(x => x.id === id); if (c && c.image) return { image: c.image, category: id };
    const ps = D.products.filter(p => p.category === id && imgUrl(p)); return ps[0] || null; };

  /* Points one unit earns: the item's own points, otherwise the ₹100 rate */
  const priceOf = (p, o) => (o >= 0 && p.opts[o]) ? p.opts[o].p : p.price;
  const unitPts = (p, o = -1) => { const pr = priceOf(p, o); return p.points !== '' ? Number(p.points) || 0 : (pr ? pr / 100 * settings().pointsPer100 : 0); };
  const optName = (p, o) => (o >= 0 && p.opts[o]) ? (HI() && p.opts[o].nh ? p.opts[o].nh : p.opts[o].n) : '';
  const minPrice = p => { const v = p.opts.map(o => o.p).filter(Boolean); return v.length ? Math.min(...v) : p.price; };
  /* Items sold by length, area or weight can be ordered in parts (e.g. 12.5 metre) */
  const MEASURE = ['metre', 'meter', 'm', 'ft', 'feet', 'sq ft', 'sqft', 'sq m', 'kg', 'litre', 'cft', 'tonne', 'quintal'];
  const isMeasure = p => MEASURE.includes(String(p.unit).toLowerCase());

  /* ---------- Cart ---------- */
  /* A cart line is one item, or one option of an item: key "item-code" or "item-code#2" */
  const keyOf = (id, o) => id + (o >= 0 ? '#' + o : '');
  const splitKey = k => { const [id, o] = String(k).split('#'); return { id, opt: o === undefined ? -1 : Number(o) }; };
  let cart = store.get('st_cart', []).map(x => ({ ...x, k: x.k || keyOf(x.id, x.opt ?? -1), opt: x.opt ?? -1 }));
  const qtyOf = k => (cart.find(x => x.k === k) || {}).qty || 0;
  function setQty(k, q) {
    const { id, opt } = splitKey(k), p = byId[id];
    q = Math.max(0, Math.min(99999, Math.round((Number(q) || 0) * (p && isMeasure(p) ? 100 : 1)) / (p && isMeasure(p) ? 100 : 1)));
    const f = cart.find(x => x.k === k);
    if (!q) cart = cart.filter(x => x.k !== k);
    else if (f) f.qty = q; else cart.push({ k, id, opt, qty: q });
    store.set('st_cart', cart);
    paintBuy(k); paintChrome();
    if (curRoute === 'cart') route();
  }
  /* Why a cart line cannot be ordered right now: '' (fine), 'gone', 'out' or 'opt' (a size must be chosen) */
  const lineProblem = x => { const p = byId[x.id]; if (!p) return 'gone'; if (!p.inStock) return 'out';
    if (p.opts.length ? !(x.opt >= 0 && p.opts[x.opt]) : x.opt >= 0) return 'opt'; return ''; };
  const badLines = () => cart.filter(x => lineProblem(x));
  function removeLines(keys) { cart = cart.filter(x => !keys.includes(x.k)); store.set('st_cart', cart); paintChrome(); }
  /* Items the shop has deleted or hidden are taken out of the cart once the new catalogue arrives */
  function pruneCart() {
    if (!D.products.length) return;
    const gone = cart.filter(x => !byId[x.id]);
    if (gone.length) { removeLines(gone.map(x => x.k)); toast(t('cart.goneRemoved', { n: gone.length })); }
  }
  function cartSummary() {
    let total = 0, pts = 0, unpriced = 0, n = 0;
    cart.forEach(x => { const p = byId[x.id]; if (!p || lineProblem(x)) return; n++; const pr = priceOf(p, x.opt); if (pr) total += pr * x.qty; else unpriced++; pts += unitPts(p, x.opt) * x.qty; });
    return { total, pts: Math.floor(pts), unpriced, n };
  }

  /* ---------- Account ---------- */
  let auth = store.get('st_auth', null);   // { phone, token, name }
  let ME = store.get('st_me', null);
  function logout() { auth = null; ME = null; store.del('st_auth'); store.del('st_me'); }

  // Calls that change nothing (or are safe to repeat) are retried once if Google does not answer properly
  const SAFE = ['check_phone', 'me'];
  async function api(action, body = {}) {
    if (!S.apiUrl) throw new Error(t('app.err'));
    let j = null;
    for (let tries = SAFE.includes(action) ? 2 : 1; tries > 0 && !j; tries--) {
      try {
        const r = await fetch(S.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, ...body }) });
        j = await r.json();
      } catch (e) { j = null; if (tries > 1) await new Promise(r => setTimeout(r, 1500)); }
    }
    if (!j) throw new Error(t('app.err'));
    if (!j.ok) {
      // The server sends a code (translated here into Hindi or English) and English text as a fallback
      const code = String(j.code || j.error || '');
      if (code === 'LOGIN_AGAIN') { logout(); paintChrome(); }
      const e = new Error(DICT.en['l.' + code] ? t('l.' + code) : (j.error || t('app.err'))); e.code = code; throw e;
    }
    return j;
  }
  const authed = (action, body) => api(action, { ...body, phone: auth && auth.phone, token: auth && auth.token });
  async function loadMe() {
    if (!auth) return null;
    const j = await authed('me');
    const sig = x => x ? JSON.stringify([x.profile, x.pending, x.orders, x.redemptions, x.claimed, x.ledger]) : '';
    const before = sig(ME);
    ME = { profile: j.profile, pending: j.pending, orders: j.orders, redemptions: j.redemptions, claimed: j.claimed || null, ledger: j.ledger, t: Date.now() };
    ME.changed = sig(ME) !== before;
    store.set('st_me', ME);
    if (j.profile && j.profile.name && auth.name !== j.profile.name) { auth.name = j.profile.name; store.set('st_auth', auth); }
    paintChrome();
    return ME;
  }
  /* Refresh orders and points in the background; redraw only if something changed */
  function refreshMe(screen) {
    if (!auth || (ME && Date.now() - (ME.t || 0) < 4000)) return;
    loadMe().then(m => { if (m && m.changed && curRoute === screen) route(); }).catch(() => { });
  }

  /* ---------- UI pieces ---------- */
  function buyHTML(p, lg, o = -1) {
    if (!p.inStock) return `<button class="add${lg ? ' lg' : ''}" disabled>${esc(t('p.out'))}</button>`;
    if (p.opts.length && o < 0) return `<a class="add opts-btn" href="#/p/${encodeURIComponent(p.id)}">${esc(t('p.choose'))}</a>`;
    const k = keyOf(p.id, o), q = qtyOf(k);
    if (!q) return `<button class="add${lg ? ' lg' : ''}" data-add="${esc(k)}" aria-label="${esc(t('p.addCart'))}: ${esc(pName(p))}">${esc(lg ? t('p.addCart') : t('p.add'))}</button>`;
    const dec = isMeasure(p);
    return `<span class="step${lg ? ' lg' : ''}"><button data-dec="${esc(k)}" aria-label="−">−</button><input type="number" inputmode="${dec ? 'decimal' : 'numeric'}" min="0" step="${dec ? '0.5' : '1'}" value="${q}" data-qty="${esc(k)}" aria-label="${esc(pName(p))}"><button data-inc="${esc(k)}" aria-label="+">+</button></span>`;
  }
  function priceHTML(p) {
    const pr = minPrice(p);
    if (!pr) return `<span class="price ask">${esc(t('p.ask'))}</span>`;
    return `<span class="price">${p.opts.length > 1 ? `<small class="from">${esc(t('p.from'))} </small>` : ''}${inr(pr)}<small>${esc(t('p.per', { unit: unitT(p.unit) }))}</small></span>`;
  }
  const ptsBadge = (p, o = -1) => { const u = unitPts(p, o >= 0 ? o : (p.opts.length ? p.opts.findIndex(x => x.p === minPrice(p)) : -1)); return u >= 1 ? `<span class="pts">${coin}${esc(t('p.pts', { n: fmt(Math.floor(u)) }))}</span>` : ''; };
  function card(p) {
    const url = '#/p/' + encodeURIComponent(p.id);
    return `<article class="pcard${p.inStock ? '' : ' out'}">
      <a href="${url}"><div class="pimg">${ptsBadge(p)}${p.inStock ? '' : `<span class="oos">${esc(t('p.out'))}</span>`}${media(p)}</div></a>
      <div class="pbody"><a href="${url}"><span class="pname">${esc(pName(p))}</span></a>
        <span class="punit">${esc(p.opts.length ? t('p.nOpts', { n: p.opts.length }) : (p.brand ? p.brand + ' · ' : '') + unitT(p.unit))}</span>
        <div class="prow">${priceHTML(p)}<span data-buy="${esc(p.id)}">${buyHTML(p)}</span></div></div></article>`;
  }
  function paintBuy(k) {
    const { id, opt } = splitKey(k), p = byId[id]; if (!p) return;
    $$(`[data-buy="${CSS.escape(k)}"]`).forEach(el => { el.innerHTML = buyHTML(p, el.dataset.lg === '1', opt); });
  }
  let toastT;
  function toast(msg, link) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = `<span>${esc(msg)}</span>${link || ''}`;
    requestAnimationFrame(() => el.classList.add('show'));
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2600);
  }
  const wa = text => `https://wa.me/${S.whatsapp}?text=${encodeURIComponent(text)}`;
  const tel = () => 'tel:' + String(S.phone).replace(/[^\d+]/g, '');
  const emptyHTML = (ic, h, p, btn) => `<div class="empty"><div class="eico">${svg(ic)}</div><h2>${esc(h)}</h2><p>${esc(p)}</p>${btn || ''}</div>`;
  const when = iso => { try { return new Date(iso).toLocaleDateString(HI() ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };

  /* ---------- Chrome: top bar, nav, cart bar ---------- */
  let curRoute = '';
  function topHome() {
    const pts = auth && ME && ME.profile ? ME.profile.points : null;
    return `<div class="top-row">
      <button class="brand" data-about aria-label="${esc(t('about.open'))}"><img src="images/mark.png" alt=""><span><b>${esc(shop())}</b><small>${svg('pin')}${esc(t('top.where'))}</small></span></button>
      <button class="tbtn" data-lang>${esc(t('lang.switch'))}</button>
      ${pts !== null ? `<a class="tbtn coin" href="#/rewards">${coin}${fmt(pts)}</a>` : ''}
      <a class="tbtn round" href="#/account" aria-label="${esc(t('nav.account'))}">${svg('user')}</a>
    </div>
    <a class="search-fake" href="#/search">${svg('search')}<span>${esc(t('top.search'))}</span></a>`;
  }
  const topTitle = (title, extra = '') => `<div class="top-row"><button class="back" data-back aria-label="${esc(t('top.back'))}">${svg('back')}</button>
    <h1 class="top-title">${esc(title)}</h1>${extra}</div>`;
  function paintChrome() {
    const tabs = [['home', '#/', 'home', 'nav.home'], ['cats', '#/cats', 'grid', 'nav.cats'], ['cart', '#/cart', 'cart', 'nav.cart'],
                  ['orders', '#/orders', 'box', 'nav.orders'], ['rewards', '#/rewards', 'gift', 'nav.rewards']];
    const active = { home: 'home', cats: 'cats', cat: 'cats', cart: 'cart', checkout: 'cart', orders: 'orders', order: 'orders', rewards: 'rewards' }[curRoute];
    const n = cart.length;
    $('#nav').innerHTML = tabs.map(([k, h, ic, lk]) => `<a href="${h}"${k === active ? ' aria-current="page"' : ''}>${svg(ic)}<span>${esc(t(lk))}</span>${k === 'cart' && n ? `<span class="dot">${n}</span>` : ''}</a>`).join('');
    const showBar = n > 0 && ['home', 'cats', 'cat', 'p', 'search', 'calc'].includes(curRoute);
    const cb = $('#cartbar');
    cb.hidden = !showBar; $('#app').classList.toggle('has-cartbar', showBar);
    if (showBar) {
      const s = cartSummary();
      cb.innerHTML = `<a href="#/cart"><span class="cb-ico">${svg('cart')}</span><span><b>${esc(itemsN(s.n))}${s.total ? ' · ' + inr(s.total) : ''}</b>
        ${s.pts ? `<small>+${fmt(s.pts)} ${esc(HI() ? 'पॉइंट' : 'points')}</small>` : ''}</span><span class="go">${esc(t('cart.barView'))}${svg('chev')}</span></a>`;
    }
    if (curRoute === 'home') $('#top').innerHTML = topHome();
  }

  /* ---------- Screens ---------- */
  const SCREENS = {};

  SCREENS.home = () => {
    const st = settings(), ps = D.products;
    if (!ps.length) return { top: topHome(), body: loadingOrError() };
    const cats = catsInUse();
    const notice = loc(st, 'notice');
    const pts = auth && ME && ME.profile ? ME.profile.points : null;
    const banner = auth
      ? `<a class="rbanner" href="#/rewards"><span class="coinbig">${coin}</span><span><b>${esc(t('home.pointsIn', { n: fmt(pts || 0) }))}</b><small>${esc(t('home.pointsInS'))}</small></span>${svg('chev', 'chev')}</a>`
      : `<a class="rbanner" href="#/login?next=/rewards"><span class="coinbig">${coin}</span><span><b>${esc(st.welcomePoints > 0 ? t('home.welcome', { n: st.welcomePoints }) : t('home.pointsOut'))}</b><small>${esc(t('home.pointsOutS'))}</small></span>${svg('chev', 'chev')}</a>`;
    return { top: topHome(), body: `<div class="screen" style="padding-top:0">
      ${newVersion ? `<button class="updbar" data-update>${svg('download')}<span><b>${esc(t('upd.banner'))}</b><small>${esc(t('upd.btn'))}</small></span></button>` : ''}
      ${notice ? `<div class="notice">${esc(notice)}</div>` : ''}
      ${offersHTML()}
      <section class="sec"><div class="sec-h"><h2>${esc(t('home.cats'))}</h2><span class="muted">${esc(t('home.nItems', { n: ps.length }))}</span></div>
        <div class="cgrid">${cats.map(id => { const c = catOf(id), ph = catPhoto(id);
          return `<a class="ctile" href="#/cat/${encodeURIComponent(id)}"><span class="cimg">${ph ? media(ph, c.icon) : icon(c.icon)}</span><span>${esc(c.label)}</span></a>`; }).join('')}</div></section>
      <a class="promo" href="#/calc"><span class="fig"><span>L</span><span>×</span><span>H</span></span><span><b>${esc(t('home.calcT'))}</b><small>${esc(t('home.calcS'))}</small></span></a>
      ${banner}
      <div class="help"><div><b>${esc(t('home.help'))}</b><small>${esc(t('home.helpS'))}</small></div>
        <a class="btn sm ghost" href="${tel()}">${svg('phone')}${esc(t('a.call'))}</a><a class="btn sm wa" href="${wa(t('p.waMsg', { shop: shop(), item: '' }))}" target="_blank" rel="noopener">${svg('wa')}${esc(t('a.wa'))}</a></div>
      <p class="foot-note">${esc(loc(S, 'address'))}</p>
    </div>` };
  };

  /* Offer banners: shown between their start and end dates, newest order first; they slide by themselves */
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const liveOffers = () => (D.offers || []).filter(o => o && o.id && (!o.start || o.start <= today()) && (!o.end || o.end >= today()))
    .sort((a, b) => (Number(a.sort) || 99) - (Number(b.sort) || 99));
  const offerHref = l => { const m = String(l || '').match(/^(cat|p):(.+)$/); return m ? (m[1] === 'cat' ? '#/cat/' : '#/p/') + encodeURIComponent(m[2]) : ''; };
  function offersHTML() {
    const os = liveOffers(); if (!os.length) return '';
    return `<section class="offers" aria-label="${esc(t('home.offers'))}"><div class="otrack" id="offers">${os.map(o => { const h = offerHref(o.link), tag = h ? 'a' : 'div', title = loc(o, 'title');
      return `<${tag} class="offer${o.image ? '' : ' txt'}"${h ? ` href="${h}"` : ''}>${o.image ? `<img src="${esc(imgUrl(o))}" alt="${esc(title)}" referrerpolicy="no-referrer" onerror="this.parentNode.classList.add('txt');this.remove()">` : ''}
        <span class="ot"><b>${esc(title)}</b>${h ? `<small>${esc(t('home.offerGo'))} ›</small>` : ''}</span></${tag}>`; }).join('')}</div>
      ${os.length > 1 ? `<div class="odots">${os.map((o, i) => `<i${i ? '' : ' class="on"'}></i>`).join('')}</div>` : ''}</section>`;
  }
  let offerPause = 0;
  document.addEventListener('touchstart', e => { if (e.target.closest('#offers')) offerPause = Date.now() + 8000; }, { passive: true });
  document.addEventListener('scroll', e => {
    const tr = e.target && e.target.id === 'offers' ? e.target : null; if (!tr) return;
    const i = Math.round(tr.scrollLeft / tr.clientWidth); $$('.odots i').forEach((d, k) => d.classList.toggle('on', k === i));
  }, true);
  setInterval(() => {
    const tr = $('#offers'); if (!tr || document.hidden || Date.now() < offerPause || tr.children.length < 2) return;
    const n = tr.children.length, i = Math.round(tr.scrollLeft / tr.clientWidth);
    tr.scrollTo({ left: ((i + 1) % n) * tr.clientWidth, behavior: 'smooth' });
  }, 4500);

  function loadingOrError() {
    if (catalogError) return `<div class="empty"><div class="eico">${svg('refresh')}</div><h2>${esc(t('app.err'))}</h2><p></p><button class="btn" data-retry>${esc(t('app.retry'))}</button></div>`;
    return `<div class="screen"><div class="sec"><div class="sk" style="height:70px"></div></div><div class="sec"><div class="cgrid">${'<div class="sk" style="aspect-ratio:1"></div>'.repeat(8)}</div></div></div>`;
  }

  SCREENS.cats = (id) => {
    const cats = catsInUse();
    if (!cats.length) return { top: topTitle(t('cats.title')), body: loadingOrError() };
    const cur = id && cats.includes(id) ? id : cats[0];
    const list = D.products.filter(p => p.category === cur);
    return { top: topTitle(t('cats.title'), `<a class="tbtn round" href="#/search" aria-label="${esc(t('s.title'))}">${svg('search')}</a>`), body: `<div class="rail-wrap">
      <nav class="rail" aria-label="${esc(t('cats.title'))}">${cats.map(c => { const k = catOf(c), ph = catPhoto(c);
        return `<a href="#/cat/${encodeURIComponent(c)}"${c === cur ? ' aria-current="true"' : ''}><span class="rimg">${ph ? media(ph, k.icon) : icon(k.icon)}</span>${esc(k.label)}</a>`; }).join('')}</nav>
      <div class="rail-main"><h2>${esc(catOf(cur).label)}</h2><p class="muted">${esc(itemsN(list.length))}</p>
        ${list.length ? `<div class="pgrid">${list.map(card).join('')}</div>` : `<p class="muted">${esc(t('cats.empty'))}</p>`}</div></div>`,
      after() { const a = $('.rail [aria-current="true"]'); if (a) a.scrollIntoView({ block: 'nearest' }); } };
  };
  SCREENS.cat = id => SCREENS.cats(id);

  const pOpt = {};   // chosen option for each item page
  SCREENS.p = id => {
    const p = byId[id];
    if (!p) return { top: topTitle(''), body: D.products.length ? emptyHTML('box', t('p.missing'), '', `<a class="btn" href="#/">${esc(t('ok.home'))}</a>`) : loadingOrError() };
    const o = p.opts.length ? Math.min(pOpt[id] ?? 0, p.opts.length - 1) : -1;
    const ch = o >= 0 ? p.opts[o] : null, pr = priceOf(p, o), k = keyOf(p.id, o);
    const view = ch && ch.img ? { ...p, image: ch.img } : p;
    const c = catOf(p.category), u = unitPts(p, o), desc = loc(p, 'description');
    const sim = D.products.filter(x => x.category === p.category && x.id !== p.id).slice(0, 10);
    const unit = String(p.unit).toLowerCase(), area = ['sq ft', 'sqft', 'sq m'].includes(unit), len = ['metre', 'meter', 'm', 'ft', 'feet'].includes(unit);
    const measure = isMeasure(p) && p.inStock ? `<div class="measure">
        <b>${esc(area ? t('p.areaT', { unit: unitT(p.unit) }) : len ? t('p.lenT', { unit: unitT(p.unit) }) : t('p.qtyT', { unit: unitT(p.unit) }))}</b>
        <div class="mrow">${area ? `<input id="mL" type="number" inputmode="decimal" min="0" step="0.5" placeholder="${esc(t('calc.length'))}"><span>×</span><input id="mH" type="number" inputmode="decimal" min="0" step="0.5" placeholder="${esc(t('calc.height'))}">`
          : `<input id="mQ" type="number" inputmode="decimal" min="0" step="0.5" value="${qtyOf(k) || ''}" placeholder="0">`}<span>${esc(unitT(p.unit))}</span>
        <button class="btn sm" data-measure="${esc(k)}">${esc(t('p.setQty'))}</button></div><p class="muted" id="mOut"></p></div>` : '';
    return { top: topTitle(c.label, `<a class="tbtn round" href="#/search" aria-label="${esc(t('s.title'))}">${svg('search')}</a>`), body: `
      <div class="pd-img">${ptsBadge(p, o)}${media(view)}</div>
      <div class="pd-body">
        <h1>${esc(pName(p))}${ch ? `<small class="optname">${esc(optName(p, o))}</small>` : ''}</h1>
        <div class="pd-price">${pr ? `<span class="amt">${inr(pr)}</span><span class="muted">${esc(t('p.per', { unit: unitT(p.unit) }))}</span>` : `<span class="price ask" style="font-size:1.1rem">${esc(t('p.ask'))}</span>`}</div>
        ${!pr ? `<p class="muted">${esc(t('p.askNote'))}</p>` : ''}
        ${u >= 1 ? `<p class="chip-pts">${coin}${esc(t('p.ptsPer', { n: fmt(Math.floor(u)), unit: unitT(p.unit) }))}</p>` : ''}
        ${p.opts.length ? `<div class="optbox"><b>${esc(t('p.chooseT', { n: p.opts.length }))}</b><div class="opts-list">${p.opts.map((x, i) => `<button class="opt${i === o ? ' on' : ''}" data-popt="${i}" aria-pressed="${i === o}">
          ${x.img ? `<img src="${esc(x.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<span>${esc(HI() && x.nh ? x.nh : x.n)}</span>${x.p ? `<small>${inr(x.p)}</small>` : ''}${qtyOf(keyOf(p.id, i)) ? `<i>${fmt(qtyOf(keyOf(p.id, i)), 2)}</i>` : ''}</button>`).join('')}</div></div>` : ''}
        ${measure}
        <div class="pd-buy"><span data-buy="${esc(k)}" data-lg="1">${buyHTML(p, true, o)}</span>
          <a class="btn wa" href="${wa(t('p.waMsg', { shop: shop(), item: p.name + (ch ? ' — ' + ch.n : '') + (p.brand ? ' (' + p.brand + ')' : '') }))}" target="_blank" rel="noopener" aria-label="${esc(t('p.wa'))}">${svg('wa')}</a></div>
        ${desc ? `<p>${esc(desc)}</p>` : ''}
        <dl class="facts">${p.brand ? `<dt>${esc(t('p.brand'))}</dt><dd>${esc(p.brand)}</dd>` : ''}<dt>${esc(t('p.unit'))}</dt><dd>${esc(unitT(p.unit))}</dd><dt>${esc(t('p.cat'))}</dt><dd><a href="#/cat/${encodeURIComponent(c.id)}">${esc(c.label)}</a></dd></dl>
      </div>
      ${sim.length ? `<section class="sec" style="margin-top:12px"><div class="sec-h"><h2>${esc(t('p.similar'))}</h2></div><div class="hscroll">${sim.map(card).join('')}</div></section>` : ''}`,
      after() {
        const out = $('#mOut'); if (!out) return;
        const calc = () => { const L = parseFloat(($('#mL') || {}).value) || 0, H = parseFloat(($('#mH') || {}).value) || 0, Q = parseFloat(($('#mQ') || {}).value) || 0;
          const q = $('#mL') ? L * H : Q; out.textContent = q && pr ? t('p.measureOut', { q: fmt(q, 2), unit: unitT(p.unit), amt: inr(q * pr) }) : ''; return q; };
        $$('#mL,#mH,#mQ').forEach(el => el.addEventListener('input', calc));
        $('[data-measure]').addEventListener('click', () => { const q = calc(); if (q > 0) { setQty(k, q); toast(t('p.added', { name: pName(p) }), `<a href="#/cart">${esc(t('p.viewCart'))}</a>`); route(); } });
        calc();
      } };
  };

  /* Search: every word must match the name, Hindi name, brand, tags or category */
  const norm = s => String(s || '').toLowerCase().normalize('NFC');
  function searchProducts(q) {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const out = [];
    D.products.forEach(p => {
      const c = catList().find(x => x.id === p.category) || {};
      const name = norm(p.name + ' ' + p.nameHi), hay = norm([p.name, p.nameHi, p.brand, p.tags, c.name, c.nameHi, ...p.opts.map(o => o.n + ' ' + o.nh)].join(' '));
      let score = 0;
      for (const w of words) {
        if (!hay.includes(w)) return;
        if (name.startsWith(w)) score += 6; else if (new RegExp('(^|\\s)' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(name)) score += 4; else if (name.includes(w)) score += 2; else score += 1;
      }
      if (!p.inStock) score -= 3;
      out.push({ p, score });
    });
    return out.sort((a, b) => b.score - a.score || a.p.sort - b.p.sort).map(x => x.p);
  }
  let sState = { q: '', cat: '' };
  SCREENS.search = () => ({
    top: `<div class="top-row"><button class="back" data-back aria-label="${esc(t('top.back'))}">${svg('back')}</button>
      <label class="search-real" style="margin:0">${svg('search')}<span class="sr">${esc(t('s.title'))}</span>
      <input id="sq" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(t('top.search'))}" value="${esc(sState.q)}">
      <button class="x" data-sclear aria-label="${esc(t('s.clear'))}"${sState.q ? '' : ' hidden'}>${svg('x')}</button></label></div>`,
    body: '<div id="sres" class="screen"></div>',
    after() { renderSearch(); const i = $('#sq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  });
  function renderSearch() {
    const box = $('#sres'); if (!box) return;
    const q = sState.q.trim();
    if (!q) {
      const rec = store.get('st_recent', []);
      box.innerHTML = (rec.length ? `<section class="sec"><div class="sec-h"><h2>${esc(t('s.recent'))}</h2><a href="#" data-recclear>${esc(t('s.clear'))}</a></div>
        <div class="opts">${rec.map(r => `<button class="chip recent" data-sq="${esc(r)}">${svg('clock')}${esc(r)}</button>`).join('')}</div></section>` : '') +
        `<section class="sec"><div class="sec-h"><h2>${esc(t('s.popular'))}</h2></div><div class="cgrid">${catsInUse().map(id => { const c = catOf(id), ph = catPhoto(id);
          return `<a class="ctile" href="#/cat/${encodeURIComponent(id)}"><span class="cimg">${ph ? media(ph, c.icon) : icon(c.icon)}</span><span>${esc(c.label)}</span></a>`; }).join('')}</div></section>`;
      return;
    }
    let res = searchProducts(q);
    const cats = [...new Set(res.map(p => p.category))];
    if (sState.cat && !cats.includes(sState.cat)) sState.cat = '';
    const shown = sState.cat ? res.filter(p => p.category === sState.cat) : res;
    box.innerHTML = res.length ? `${cats.length > 1 ? `<div class="chips"><button class="chip" data-scat="" aria-pressed="${!sState.cat}">${esc(t('s.all'))} ${res.length}</button>${cats.map(c => `<button class="chip" data-scat="${esc(c)}" aria-pressed="${sState.cat === c}">${esc(catOf(c).label)}</button>`).join('')}</div>` : ''}
      <section class="sec" style="padding-top:4px"><p class="muted" style="margin-bottom:8px">${esc(t('s.count', { n: shown.length }))}</p><div class="pgrid">${shown.slice(0, 60).map(card).join('')}</div></section>`
      : emptyHTML('search', t('s.none', { q }), t('s.noneS'), `<a class="btn wa" href="${wa(t('s.noneWa', { shop: shop(), q }))}" target="_blank" rel="noopener">${svg('wa')}${esc(t('p.wa'))}</a>`);
  }
  function rememberSearch(q) {
    q = q.trim(); if (q.length < 2) return;
    const rec = store.get('st_recent', []).filter(r => r.toLowerCase() !== q.toLowerCase());
    rec.unshift(q); store.set('st_recent', rec.slice(0, 8));
  }

  SCREENS.cart = () => {
    const lines = cart.map(x => ({ x, p: byId[x.id], bad: lineProblem(x) })).filter(l => l.p || D.products.length);
    if (!lines.length) return { top: topTitle(t('cart.title')), body: emptyHTML('cart', t('cart.empty'), t('cart.emptyS'), `<a class="btn" href="#/">${esc(t('cart.shop'))}</a>`) };
    const s = cartSummary(), st = settings(), nBad = lines.filter(l => l.bad).length;
    const rm = k => `<button class="crm" data-rm="${esc(k)}" aria-label="${esc(t('cart.remove'))}">${svg('x')}</button>`;
    return { top: topTitle(t('cart.title'), `<button class="tbtn" data-cartclear>${esc(t('cart.clear'))}</button>`), body: `<div class="screen" style="padding-top:0">
      ${nBad ? `<div class="msg err cwarn"><span>${esc(t('cart.badNote', { n: nBad }))}</span><button class="btn sm danger" data-rmbad>${esc(t('cart.rmBad'))}</button></div>` : ''}
      <div class="panel">${lines.map(({ x, p, bad }) => {
        if (!p) return `<div class="cline bad"><span class="cimg">${icon('box')}</span><div class="nm">${esc(x.id)}<small class="red">${esc(t('cart.gone'))}</small></div><span class="cact">${rm(x.k)}</span></div>`;
        const pr = priceOf(p, x.opt), oi = x.opt >= 0 && p.opts[x.opt] && p.opts[x.opt].img;
        const why = bad === 'out' ? t('p.out') : bad === 'opt' ? t('cart.needOpt') : '';
        return `<div class="cline${bad ? ' bad' : ''}"><a class="cimg" href="#/p/${encodeURIComponent(p.id)}" data-popt-go="${x.opt}">${media(oi ? { ...p, image: oi } : p)}</a>
        <div class="nm">${esc(pName(p))}${x.opt >= 0 && p.opts[x.opt] ? `<small class="ol">${esc(optName(p, x.opt))}</small>` : ''}<small>${why ? `<span class="red">${esc(why)}</span>` : pr ? inr(pr) + ' ' + esc(t('p.per', { unit: unitT(p.unit) })) + ' · <b>' + inr(pr * x.qty) + '</b>' : esc(t('p.ask'))}</small></div>
        <span class="cact">${bad === 'opt' ? `<a class="add opts-btn" href="#/p/${encodeURIComponent(p.id)}">${esc(t('p.choose'))}</a>` : bad ? `<span class="muted">${fmt(x.qty, 2)}</span>` : `<span data-buy="${esc(x.k)}">${buyHTML(p, false, x.opt)}</span>`}${rm(x.k)}</span></div>`; }).join('')}</div>
      <div class="panel"><h3>${esc(t('cart.bill'))}</h3>
        <div class="row"><span>${esc(t('cart.items'))}</span><b>${inr(s.total)}</b></div>
        ${s.unpriced ? `<div class="row muted"><span>${esc(t('cart.unpriced', { n: s.unpriced }))}</span></div>` : ''}
        <div class="row"><span>${esc(t('cart.points'))}</span><span class="chip-pts">${coin}${fmt(s.pts)}</span></div>
        <div class="row total"><span>${esc(t('cart.est'))}</span><b>${inr(s.total)}${s.unpriced ? '+' : ''}</b></div>
        <p class="muted" style="margin-top:6px">${esc(t('cart.pay'))}${loc(st, 'deliveryNote') ? '. ' + esc(loc(st, 'deliveryNote')) : ''}</p></div>
      <div class="sec"><a class="btn gold block" href="#/checkout">${esc(t('cart.next'))}${svg('chev')}</a></div></div>` };
  };

  SCREENS.checkout = () => {
    if (!cart.length) { location.replace('#/cart'); return null; }
    if (!auth) { location.replace('#/login?next=/checkout'); return null; }
    const pr = (ME && ME.profile) || {}, s = cartSummary();
    const draft = store.get('st_draft', {});
    const v = k => esc(draft[k] ?? pr[k] ?? '');
    const whens = ['co.w1', 'co.w2', 'co.w3', 'co.w4'], wSel = draft.needBy || 'co.w1';
    return { top: topTitle(t('co.title')), body: `<form id="cof" class="screen" style="padding-top:0" novalidate>
      <div class="panel"><div id="comsg"></div>
        <div class="field"><label for="co-name">${esc(t('co.name'))}</label><input id="co-name" name="name" value="${esc(draft.name ?? auth.name ?? '')}" autocomplete="name" maxlength="60"></div>
        <div class="field"><label for="co-village">${esc(t('co.village'))}</label><input id="co-village" name="village" value="${v('village')}" maxlength="60"></div>
        <div class="field"><label for="co-address">${esc(t('co.address'))}</label><input id="co-address" name="address" value="${v('address')}" autocomplete="street-address" maxlength="200"></div>
        <div class="field"><label for="co-landmark">${esc(t('co.landmark'))}</label><input id="co-landmark" name="landmark" value="${v('landmark')}" maxlength="100"></div>
        <div class="field"><span style="font-weight:600;font-size:.92rem">${esc(t('co.when'))}</span><div class="opts">${whens.map(k => `<label><input type="radio" name="needBy" value="${k}"${k === wSel ? ' checked' : ''}><span>${esc(t(k))}</span></label>`).join('')}</div></div>
        <div class="field"><label for="co-note">${esc(t('co.note'))}</label><textarea id="co-note" name="note" maxlength="600" placeholder="${esc(t('co.notePh'))}">${esc(draft.note ?? store.get('st_calcnote', ''))}</textarea></div>
      </div>
      <div class="panel"><h3>${esc(t('co.pay'))}</h3><p class="muted">${esc(t('co.payS'))}</p>
        <div class="row total"><span>${esc(t('cart.est'))} · ${esc(itemsN(s.n))}</span><b>${inr(s.total)}${s.unpriced ? '+' : ''}</b></div>
        <div class="row"><span>${esc(t('cart.points'))}</span><span class="chip-pts">${coin}${fmt(s.pts)}</span></div></div>
      <div class="sec"><button class="btn gold block" id="coplace">${esc(t('co.place'))}</button></div></form>` ,
      after() {
        const f = $('#cof');
        f.addEventListener('input', () => { const d = Object.fromEntries(new FormData(f)); store.set('st_draft', d); });
        f.addEventListener('submit', placeOrder);
        if (auth && (!ME || Date.now() - (ME.t || 0) > 60000)) loadMe().then(() => { const pr2 = ME.profile || {}; ['village', 'address', 'landmark'].forEach(k => { const el = $('#co-' + k); if (el && !el.value) el.value = pr2[k] || ''; }); }).catch(() => { });
      } };
  };
  async function placeOrder(e) {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f)), msg = $('#comsg'), b = $('#coplace');
    // Items that cannot be ordered are shown with a button to remove them, before anything is sent
    const bad = badLines();
    if (bad.length) {
      msg.innerHTML = `<div class="msg err cwarn"><span>${esc(t('co.badItems', { list: bad.map(x => byId[x.id] ? pName(byId[x.id]) : x.id).join(', ') }))}</span><button type="button" class="btn sm danger" data-rmbad>${esc(t('cart.rmBad'))}</button></div>`;
      msg.scrollIntoView({ block: 'center' }); return;
    }
    if (!d.village.trim() && !d.address.trim()) { msg.innerHTML = `<p class="msg err">${esc(t('co.errAddr'))}</p>`; $('#co-village').focus(); return; }
    b.disabled = true; b.textContent = t('co.placing'); msg.innerHTML = '';
    try {
      const needBy = DICT.en[d.needBy] || d.needBy;
      const note = (d.name && d.name !== (auth.name || '') ? 'Name: ' + d.name + '. ' : '') + d.note;
      // One reference per checkout: if the network drops and we send again, the shop still gets only one order.
      // The reference belongs to this exact cart; if the cart changes, a new reference is made.
      const items = cart.map(x => ({ id: x.id, opt: x.opt >= 0 ? x.opt : '', qty: x.qty })), sig = JSON.stringify(items);
      let saved = store.get('st_ref', null), ref = saved && typeof saved === 'object' && saved.sig === sig ? saved.ref : '';
      if (!ref) { ref = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); store.set('st_ref', { ref, sig }); }
      const body = { items, village: d.village, address: d.address, landmark: d.landmark, needBy, note, clientRef: ref };
      let j;
      try { j = await authed('place_order', body); }
      catch (e1) { if (e1.code && e1.code !== 'BUSY') throw e1; await new Promise(r => setTimeout(r, 2500)); j = await authed('place_order', body); }
      store.del('st_ref');
      cart = []; store.set('st_cart', cart); store.del('st_draft'); store.del('st_calcnote');
      lastOrder = j.order;
      if (ME) { ME.orders = [j.order, ...(ME.orders || [])]; store.set('st_me', ME); }
      location.hash = '#/done';
      loadMe().catch(() => { });
    } catch (err) {
      let m = err.message;
      if (String(err.code || err.message).startsWith('OUT_OF_STOCK:')) { m = t('co.outStock', { list: String(err.code || err.message).slice(13) }); fetchCatalog(true).catch(() => { }); }
      if (err.code === 'LOGIN_AGAIN') { location.hash = '#/login?next=/checkout'; return; }
      if (err.code === 'BUSY') m = t('co.busy');
      msg.innerHTML = `<p class="msg err">${esc(m)}</p>`; msg.scrollIntoView({ block: 'center' });
      b.disabled = false; b.textContent = t('co.place');
    }
  }
  let lastOrder = null;
  SCREENS.done = () => {
    const o = lastOrder;
    if (!o) { location.replace('#/orders'); return null; }
    return { top: topTitle(t('ok.title')), body: `<div class="empty"><div class="eico" style="background:var(--green-soft);color:var(--green)">${svg('box')}</div>
      <h2>${esc(t('ok.title'))}</h2><p>${esc(t('ok.sub', { id: o.orderId }))}</p>
      ${o.estPoints ? `<p style="margin:-8px 0 18px;color:#8A6A00;font-weight:700">${esc(t('ok.pts', { n: fmt(o.estPoints) }))}</p>` : ''}
      <div class="btns" style="justify-content:center;flex-direction:column">
        <a class="btn wa" href="${wa(t('ok.waMsg', { shop: shop(), id: o.orderId }))}" target="_blank" rel="noopener">${svg('wa')}${esc(t('ok.wa'))}</a>
        <a class="btn" href="#/order/${encodeURIComponent(o.orderId)}">${esc(t('ok.view'))}</a>
        <a class="btn ghost" href="#/">${esc(t('ok.home'))}</a></div></div>` };
  };

  const STEPS = ['Placed', 'Delivered'];
  const stNorm = s => (s === 'Delivered' || s === 'Cancelled') ? s : 'Placed';
  const badge = s => { s = stNorm(s); return `<span class="badge b-${esc(s)}">${esc(t('st.' + s))}</span>`; };
  SCREENS.orders = () => {
    if (!auth) return { top: topTitle(t('o.title')), body: emptyHTML('box', t('o.login'), t('r.loginS'), `<a class="btn gold" href="#/login?next=/orders">${esc(t('l.login'))}</a>`) };
    const os = (ME && ME.orders) || [];
    const body = os.length ? os.map(o => {
      const its = o.items || [];
      return `<a class="ocard" href="#/order/${encodeURIComponent(o.orderId)}"><div class="top2"><b>${esc(t('o.order', { id: o.orderId }))}</b>${badge(o.status)}</div>
        <div class="thumbs">${its.slice(0, 5).map(i => { const p = byId[i.id]; return `<span>${p && imgUrl(p) ? `<img src="${esc(imgUrl(p))}" alt="" loading="lazy">` : esc((i.name || '?').slice(0, 2))}</span>`; }).join('')}${its.length > 5 ? `<span>+${its.length - 5}</span>` : ''}</div>
        <div class="top2"><span class="muted">${esc(when(o.createdAt))} · ${esc(itemsN(its.length))}</span><b>${o.finalAmount ? inr(o.finalAmount) : inr(o.estTotal || 0)}</b></div></a>`;
    }).join('') : emptyHTML('box', t('o.empty'), t('o.emptyS'), `<a class="btn" href="#/">${esc(t('cart.shop'))}</a>`);
    return { top: topTitle(t('o.title'), `<button class="tbtn round" data-refresh aria-label="${esc(t('a.refresh'))}">${svg('refresh')}</button>`), body: `<div class="screen" style="padding-top:0">${body}</div>`,
      after() { refreshMe('orders'); } };
  };
  SCREENS.order = id => {
    const o = ((ME && ME.orders) || []).find(x => x.orderId === id) || (lastOrder && lastOrder.orderId === id ? lastOrder : null);
    if (!o) return { top: topTitle(t('o.order', { id })), body: auth ? loadingOrError() : emptyHTML('box', t('o.login'), '', `<a class="btn gold" href="#/login?next=/orders">${esc(t('l.login'))}</a>`),
      after() { refreshMe('order'); } };
    const log = String(o.statusLog || '').split('\n');
    const stamp = s => { const l = log.find(x => x.startsWith(s + ' ')); return l ? l.slice(s.length + 1) : ''; };
    const idx = STEPS.indexOf(stNorm(o.status));
    const its = o.items || [];
    const pts = o.status === 'Delivered' ? t('o.ptsDone', { n: fmt(o.pointsCredited || 0) }) : (o.status === 'Cancelled' ? '' : t('o.ptsPending', { n: fmt(o.finalPoints || o.estPoints || 0) }));
    return { top: topTitle(t('o.order', { id: o.orderId })), body: `<div class="screen" style="padding-top:0">
      <div class="panel"><div class="top2" style="display:flex;justify-content:space-between;align-items:center"><span class="muted">${esc(when(o.createdAt))}</span>${badge(o.status)}</div>
        ${o.status === 'Cancelled' ? '' : `<ul class="tl" style="margin-top:12px">${STEPS.map((s, i) => `<li class="${i <= idx ? 'done' : ''}">${esc(t('st.' + s))}${stamp(s) ? `<small>${esc(stamp(s))}</small>` : ''}</li>`).join('')}</ul>`}
        ${pts ? `<p class="chip-pts">${coin}${esc(pts)}</p>` : ''}</div>
      <div class="panel"><h3>${esc(itemsN(its.length))}</h3>${its.map(i => { const p = byId[i.id];
        return `<div class="cline"><span class="cimg">${p ? media(p) : icon('box')}</span><div class="nm">${esc(HI() && i.nameHi ? i.nameHi : i.name)}<small>${fmt(i.qty, 2)} ${esc(unitT(i.unit))}${i.price ? ' × ' + inr(i.price) : ''}</small></div><b>${i.price ? inr(i.price * i.qty) : ''}</b></div>`; }).join('')}
        <div class="row total"><span>${esc(o.finalAmount ? t('o.final') : t('o.est'))}</span><b>${inr(o.finalAmount || o.estTotal || 0)}</b></div></div>
      <div class="panel"><h3>${esc(t('o.address'))}</h3><p>${esc([o.address, o.landmark, o.village].filter(Boolean).join(', '))}</p>
        ${o.needBy ? `<p class="muted">${esc(t('o.need'))}: ${esc(o.needBy)}</p>` : ''}${o.note ? `<p class="muted">${esc(o.note)}</p>` : ''}</div>
      <div class="sec btns">
        <a class="btn ghost" href="${tel()}">${svg('phone')}${esc(t('o.call'))}</a>
        <a class="btn wa" href="${wa(t('o.waMsg', { shop: shop(), id: o.orderId }))}" target="_blank" rel="noopener">${svg('wa')}${esc(t('o.waAbout'))}</a>
        <button class="btn" data-again="${esc(o.orderId)}">${esc(t('o.again'))}</button>
        ${o.status === 'Placed' ? `<button class="btn danger" data-cancel="${esc(o.orderId)}">${esc(t('o.cancel'))}</button>` : ''}</div></div>`, after() { refreshMe('order'); } };
  };

  SCREENS.rewards = () => {
    const st = settings(), gifts = (D.gifts || []).slice().sort((a, b) => (Number(a.sort) || 99) - (Number(b.sort) || 99) || a.points - b.points);
    const bal = auth && ME && ME.profile ? Number(ME.profile.points) || 0 : 0;
    const how = `<div class="panel"><h3>${esc(t('r.how'))}</h3><ol class="howto"><li>${esc(t('r.how1'))}</li><li>${esc(t('r.how2'))}</li><li>${esc(t('r.how3'))}</li></ol>
      <p class="muted" style="margin-top:6px">${esc(t('r.rate', { n: st.pointsPer100 }))}</p></div>`;
    const giftHTML = gifts.length ? `<div class="ggrid">${gifts.map(g => {
      const out = g.stock !== '' && g.stock != null && Number(g.stock) <= 0, need = g.points - bal;
      // Each gift can be taken once per customer
      const got = auth && ME && (ME.claimed || (ME.redemptions || []).filter(r => r.status !== 'Rejected').map(r => String(r.giftId))).includes(String(g.id));
      const btn = !auth ? `<a class="btn sm ghost" href="#/login?next=/rewards">${esc(t('l.login'))}</a>`
        : got ? `<button class="btn sm ghost" disabled>✓ ${esc(t('r.got'))}</button>`
        : out ? `<button class="btn sm ghost" disabled>${esc(t('r.stock0'))}</button>`
        : need > 0 ? `<button class="btn sm ghost" disabled>${esc(t('r.need', { n: fmt(need) }))}</button>`
        : `<button class="btn sm gold" data-redeem="${esc(g.id)}">${esc(t('r.redeem'))}</button>`;
      return `<div class="gcard"><div class="pimg">${media(g, 'gift')}</div><div class="gb"><b>${esc(loc(g, 'name'))}</b><span class="chip-pts">${coin}${esc(t('r.pts', { n: fmt(g.points) }))}</span>${btn}</div></div>`;
    }).join('')}</div>` : `<p class="muted">${esc(t('r.noGifts'))}</p>`;
    let body;
    if (!auth) {
      body = `<div class="wallet"><small>${esc(t('r.balance'))}</small><div class="big">${coin}0</div><p>${esc(t('r.loginS'))}</p>
        <a class="btn gold" style="margin-top:12px;position:relative;z-index:1" href="#/login?next=/rewards">${esc(t('l.login'))}</a></div>${how}
        <section class="sec"><div class="sec-h"><h2>${esc(t('r.gifts'))}</h2></div><p class="muted" style="margin:-4px 0 10px">${esc(t('r.once'))}</p>${giftHTML}</section>`;
    } else {
      const reds = (ME && ME.redemptions) || [], led = (ME && ME.ledger) || [];
      body = `<div class="wallet"><small>${esc(t('r.balance'))}</small><div class="big">${coin}${fmt(bal)}</div>
        ${ME && ME.pending ? `<p>${esc(t('r.pending', { n: fmt(ME.pending) }))}</p>` : ''}</div>
        <section class="sec"><div class="sec-h"><h2>${esc(t('r.gifts'))}</h2></div><p class="muted" style="margin:-4px 0 10px">${esc(t('r.once'))}</p>${giftHTML}</section>
        ${reds.length ? `<div class="panel"><h3>${esc(t('r.my'))}</h3>${reds.map(r => `<div class="hist"><span>${esc(r.giftName)}<small>${esc(when(r.createdAt))} · ${esc(r.redeemId)}</small></span><span class="badge b-${esc(r.status)}">${esc(t('rs.' + r.status))}</span></div>`).join('')}</div>` : ''}
        ${how}
        ${led.length ? `<div class="panel"><h3>${esc(t('r.hist'))}</h3>${led.map(l => `<div class="hist"><span>${esc(l.reason)}<small>${esc(when(l.date))}</small></span><b class="${Number(l.delta) >= 0 ? 'green' : 'red'}">${Number(l.delta) >= 0 ? '+' : ''}${fmt(l.delta)}</b></div>`).join('')}</div>` : ''}`;
    }
    return { top: topTitle(t('r.title')), body: `<div class="screen" style="padding-top:0">${body}</div>`,
      after() { refreshMe('rewards'); } };
  };

  let installEvt = null;
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  SCREENS.account = () => {
    const pr = (ME && ME.profile) || {};
    const who = auth ? `<div class="who"><span class="av">${esc((auth.name || '?').trim().charAt(0).toUpperCase())}</span><span><b>${esc(t('a.hello', { name: auth.name || '' }))}</b><span class="muted">+91 ${esc(auth.phone)}</span></span></div>`
      : `<div class="panel"><h3>${esc(t('l.title'))}</h3><p class="muted" style="margin-bottom:10px">${esc(t('home.pointsOutS'))}</p><a class="btn gold block" href="#/login?next=/account">${esc(t('l.login'))}</a></div>`;
    return { top: topTitle(t('a.title')), body: `<div class="screen" style="padding-top:0">${who}
      ${auth && (pr.address || pr.village) ? `<div class="panel"><h3>${esc(t('a.address'))}</h3><p>${esc([pr.address, pr.landmark, pr.village].filter(Boolean).join(', '))}</p></div>` : ''}
      <div class="alist">
        <button data-lang>${svg('lang')}<span>${esc(t('a.lang'))}</span><span class="end">${esc(t('lang.name'))} → ${esc(t('lang.switch'))}</span></button>
        ${standalone() ? '' : `<button data-install>${svg('download')}<span>${esc(t('a.install'))}<small>${esc(t('a.installS'))}</small></span></button>`}
        <a href="#/calc">${svg('calc')}<span>${esc(t('a.calc'))}</span></a>
        <a href="#/orders">${svg('box')}<span>${esc(t('o.title'))}</span></a>
        <a href="#/rewards">${svg('gift')}<span>${esc(t('r.title'))}</span></a>
        <button data-refresh>${svg('refresh')}<span>${esc(t('a.refresh'))}</span></button>
      </div>
      <div class="alist">
        <a href="${tel()}">${svg('phone')}<span>${esc(t('a.call'))}<small>${esc(S.phone)}</small></span></a>
        <a href="${wa(t('p.waMsg', { shop: shop(), item: '' }))}" target="_blank" rel="noopener">${svg('wa')}<span>${esc(t('a.wa'))}</span></a>
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(S.mapQuery || S.address)}" target="_blank" rel="noopener">${svg('map')}<span>${esc(t('a.map'))}<small>${esc(loc(S, 'address'))}</small></span></a>
        <div style="display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid #F0EFEB">${svg('clock')}<span>${esc(t('a.hours'))}<small style="display:block;color:var(--muted)">${esc(loc(S, 'hours'))}</small></span></div>
        <button data-update>${svg('download')}<span>${esc(t('a.update'))}<small>${esc(newVersion ? t('a.updateNew', { v: newVersion }) : t('a.updateS', { v: APP_VERSION }))}</small></span>${newVersion ? '<span class="end newv">●</span>' : ''}</button>
        <button data-about>${svg('user')}<span>${esc(t('about.open'))}</span></button>
      </div>
      ${auth ? `<div class="alist"><button data-logout>${svg('logout')}<span>${esc(t('a.logout'))}</span></button></div>` : ''}
      <p class="foot-note">GSTIN ${esc(S.gstin)}${S.credit ? ` · ${esc(t('a.by'))} <a href="${esc(S.credit.url)}" target="_blank" rel="noopener">${esc(S.credit.name)}</a>` : ''}</p></div>` };
  };

  /* Login: phone → PIN (existing) or create account (new / PIN reset) */
  let L = { step: 'phone', phone: '', mode: '' };
  SCREENS.login = () => {
    if (auth) { location.replace('#' + (qs().get('next') || '/account')); return null; }
    let form;
    if (L.step === 'phone') {
      form = `<div class="field"><label for="lphone">${esc(t('l.phone'))}</label><div class="phone-in"><span>+91</span><input id="lphone" type="tel" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="${esc(t('l.phonePh'))}" value="${esc(L.phone)}"></div></div>
        <button class="btn gold block" id="lgo">${esc(t('l.next'))}</button>`;
    } else if (L.step === 'pin') {
      form = `<p class="muted" style="margin-bottom:10px">+91 ${esc(L.phone)} · <a href="#" data-lchange>${esc(t('l.change'))}</a></p>
        <div class="field"><label for="lpin">${esc(t('l.pin'))}</label><input id="lpin" class="pin" type="password" inputmode="numeric" autocomplete="current-password" maxlength="4"></div>
        <button class="btn gold block" id="lgo">${esc(t('l.login'))}</button>
        <p style="text-align:center;margin-top:14px"><a href="${wa(t('l.forgotMsg', { shop: shop(), phone: L.phone }))}" target="_blank" rel="noopener">${esc(t('l.forgot'))}</a></p>`;
    } else {
      form = `<p class="muted" style="margin-bottom:10px">+91 ${esc(L.phone)} · <a href="#" data-lchange>${esc(t('l.change'))}</a></p>
        <div class="field"><label for="lname">${esc(t('l.name'))}</label><input id="lname" autocomplete="name" maxlength="60"></div>
        <div class="field"><label for="lvillage">${esc(t('l.village'))}</label><input id="lvillage" maxlength="60"></div>
        <div class="row2"><div class="field"><label for="lpin">${esc(t('l.newPin'))}</label><input id="lpin" class="pin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="4"></div>
        <div class="field"><label for="lpin2">${esc(t('l.pin2'))}</label><input id="lpin2" class="pin" type="password" inputmode="numeric" autocomplete="new-password" maxlength="4"></div></div>
        <p class="muted" style="margin:-4px 0 12px;font-size:.82rem">${esc(t('l.pinHint'))}</p>
        <button class="btn gold block" id="lgo">${esc(t('l.create'))}</button>`;
    }
    const title = L.step === 'new' ? (L.mode === 'reset' ? t('l.resetT') : t('l.newT')) : t('l.title');
    return { top: topTitle(t('l.login')), body: `<div class="screen" style="padding-top:0"><div class="login-hero"><img src="images/mark.png" alt=""><h1>${esc(title)}</h1><p class="muted">${esc(t('l.sub'))}</p></div>
      <form class="panel" id="lf" novalidate><div id="lmsg">${L.msg ? `<p class="msg ${L.msgOk ? 'ok' : 'err'}">${esc(L.msg)}</p>` : ''}</div>${form}</form></div>`,
      after() { const f = $('#lf'); f.addEventListener('submit', loginSubmit); const first = $('#lf input'); if (first) first.focus(); } };
  };
  async function loginSubmit(e) {
    e.preventDefault();
    const show = (m) => { $('#lmsg').innerHTML = m ? `<p class="msg err">${esc(m)}</p>` : ''; };
    const b = $('#lgo'), label = b.textContent;
    const val = id => ($('#' + id) || {}).value || '';
    L.msg = '';
    try {
      if (L.step === 'phone') {
        const ph = val('lphone').replace(/\D/g, '').slice(-10);
        if (!/^[6-9]\d{9}$/.test(ph)) return show(t('l.ePhone'));
        b.disabled = true; b.textContent = '…';
        const j = await api('check_phone', { phone: ph });
        L = { step: j.pinSet ? 'pin' : 'new', mode: j.exists && !j.pinSet ? 'reset' : '', phone: ph };
        if (L.mode === 'reset') { L.msg = t('l.PIN_RESET'); }
        return route();
      }
      if (L.step === 'pin') {
        const pin = val('lpin');
        if (!/^\d{4}$/.test(pin)) return show(t('l.ePin'));
        b.disabled = true; b.textContent = '…';
        const j = await api('login', { phone: L.phone, pin });
        return finishLogin(j, t('l.hi', { name: j.profile.name }));
      }
      const name = val('lname').trim(), pin = val('lpin'), pin2 = val('lpin2');
      if (!name) return show(t('l.eName'));
      if (!/^\d{4}$/.test(pin)) return show(t('l.ePin'));
      if (pin !== pin2) return show(t('l.ePin2'));
      b.disabled = true; b.textContent = '…';
      const j = await api('register', { phone: L.phone, name, village: val('lvillage'), pin });
      finishLogin(j, j.welcome ? t('l.welcome', { n: j.welcome }) : t('l.hi', { name }));
    } catch (err) {
      if (err.code === 'ALREADY_REGISTERED') { L.step = 'pin'; L.msg = err.message; return route(); }
      if (err.code === 'NOT_REGISTERED' || err.code === 'PIN_RESET') { L.step = 'new'; L.mode = err.code === 'PIN_RESET' ? 'reset' : ''; L.msg = err.message; return route(); }
      show(err.message); b.disabled = false; b.textContent = label;
    }
  }
  function finishLogin(j, msg) {
    auth = { phone: j.profile.phone, token: j.token, name: j.profile.name };
    store.set('st_auth', auth);
    ME = { profile: j.profile, orders: [], redemptions: [], ledger: [], pending: 0, t: 0 }; store.set('st_me', ME);
    L = { step: 'phone', phone: '', mode: '' };
    toast(msg);
    location.replace('#' + (qs().get('next') || '/account'));
    loadMe().then(() => route()).catch(() => { });
  }

  /* ---------- Material calculator ---------- */
  const calcState = { tab: 'brick' };
  function cField(id, lk, val, unit, step = '0.1') {
    const u = unit ? `<select id="${id}-u" aria-label="unit"><option value="ft"${unit === 'ft' ? ' selected' : ''}>${esc(t('calc.ft'))}</option><option value="in"${unit === 'in' ? ' selected' : ''}>${esc(t('calc.in'))}</option></select>` : '';
    return `<div class="field"><label for="${id}">${esc(t(lk))}${unit ? '' : ''}</label>${unit ? `<div class="dim"><input id="${id}" type="number" min="0" step="${step}" inputmode="decimal" value="${val}">${u}</div>` : `<input id="${id}" type="number" min="0" step="${step}" inputmode="decimal" value="${val}">`}</div>`;
  }
  const ftF = (id, lk, val) => `<div class="field"><label for="${id}">${esc(t(lk))} (${esc(t('calc.ft'))})</label><input id="${id}" type="number" min="0" step="0.1" inputmode="decimal" value="${val}"></div>`;
  const sel = (id, lk, opts) => `<div class="field"><label for="${id}">${esc(t(lk))}</label><select id="${id}">${opts.map(([v, k]) => `<option value="${v}">${esc(t(k))}</option>`).join('')}</select></div>`;
  SCREENS.calc = () => {
    const tabs = ['brick', 'concrete', 'plaster', 'tiles', 'paint'];
    const forms = {
      brick: `<div class="row2">${ftF('b-l', 'calc.length', 20)}${ftF('b-h', 'calc.height', 10)}</div>${sel('b-t', 'calc.wallThick', [['0.23', 'calc.wall9'], ['0.115', 'calc.wall4']])}
        ${sel('b-k', 'calc.brickType', [['red', 'calc.red'], ['fly', 'calc.fly']])}<div class="row2">${sel('b-m', 'calc.mortar', [['6', 'calc.mix6'], ['5', 'calc.mix5'], ['4', 'calc.mix4']])}${cField('b-o', 'calc.openings', 0, '', '1')}</div>`,
      concrete: `${sel('c-e', 'calc.element', [['slab', 'calc.slab'], ['beam', 'calc.beam'], ['column', 'calc.column'], ['footing', 'calc.footing']])}
        <div class="row3">${cField('c-l', 'calc.length', 20, 'ft')}${cField('c-w', 'calc.width', 15, 'ft')}${cField('c-d', 'calc.depth', 5, 'in')}</div>
        <div class="row2">${sel('c-m', 'calc.mix', [['m20', 'calc.m20'], ['m15', 'calc.m15'], ['m10', 'calc.m10']])}${cField('c-n', 'calc.count', 1, '', '1')}</div>`,
      plaster: `<div class="row2">${ftF('p-l', 'calc.length', 20)}${ftF('p-h', 'calc.height', 10)}</div><div class="row2">${sel('p-t', 'calc.pThick', [['12', 'calc.p12'], ['15', 'calc.p15'], ['20', 'calc.p20']])}${sel('p-m', 'calc.pMix', [['6', 'calc.mix6'], ['5', 'calc.mix5'], ['4', 'calc.mix4']])}</div>${cField('p-o', 'calc.openings', 0, '', '1')}`,
      tiles: `<div class="row2">${ftF('t-l', 'calc.roomL', 12)}${ftF('t-w', 'calc.roomW', 10)}</div><div class="row2">${sel('t-s', 'calc.tileSize', [['600x600x4', 't.600'], ['800x800x3', 't.800'], ['600x1200x2', 't.1200'], ['300x300x11', 't.300'], ['400x400x6', 't.400']])}${sel('t-x', 'calc.extra', [['1.1', 't.x10'], ['1.05', 't.x5'], ['1.15', 't.x15']])}</div>`,
      paint: `${sel('a-f', 'calc.paintFor', [['in', 'calc.inside'], ['out', 'calc.outside']])}<div class="row3">${ftF('a-l', 'calc.roomL', 12)}${ftF('a-w', 'calc.roomW', 10)}${ftF('a-h', 'calc.wallH', 10)}</div>
        <div class="row2">${cField('a-o', 'calc.openings', 40, '', '1')}${cField('a-n', 'calc.rooms', 1, '', '1')}</div><label class="sw" id="a-c-wrap"><input type="checkbox" id="a-c" checked>${esc(t('calc.ceiling'))}</label>`
    };
    return { top: topTitle(t('calc.title')), body: `<div class="screen" style="padding-top:0">
      <div class="ctabs" role="tablist">${tabs.map(k => `<button role="tab" data-ctab="${k}" aria-selected="${k === calcState.tab}">${esc(t('calc.' + k))}</button>`).join('')}</div>
      <p class="muted" style="padding:4px 14px 0">${esc(t('calc.sub'))}</p>
      <form class="panel" id="cf" novalidate>${tabs.map(k => `<fieldset class="cfs" data-cfs="${k}"${k === calcState.tab ? '' : ' hidden'}>${forms[k]}</fieldset>`).join('')}</form>
      <section class="panel cres" aria-live="polite"><h3>${esc(t('calc.need'))}</h3><p class="muted" id="cmeta"></p><ul class="rl" id="clist"></ul>
        <button class="btn gold block" id="cadd">${svg('cart')}${esc(t('calc.add'))}</button>
        <details><summary>${esc(t('calc.how'))}</summary><p id="cnote"></p></details></section></div>`,
      after() { calcBind(); } };
  };
  let calcResult = null;
  function calcBind() {
    const FT = 0.3048, M3 = 35.3147, SQ = 0.092903, CEM = 1440, BAG = 50, TROL = 100;
    const val = id => Math.max(0, parseFloat(($('#' + id) || {}).value) || 0);
    const feet = id => { const u = $('#' + id + '-u'); return u && u.value === 'in' ? val(id) / 12 : val(id); };
    const up = (n, s = 1) => Math.ceil(n / s - 1e-9) * s;
    const tr = c => fmt(c / TROL, 1);
    const sv = id => ($('#' + id) || {}).value;
    const mortar = (dry, n) => ({ bags: dry / (1 + n) * CEM / BAG, sand: dry * n / (1 + n) * M3 });
    // line: product id in the shop (if any), quantity in that product's unit, text for the note
    const line = (pid, qty, text, opt) => ({ pid, qty, text, opt });
    const sandRow = (cft, k = 'r.sand', pid = 'river-sand') => ({ k, v: tr(cft), u: 'u.trolley', s: t('r.sandSub', { cft: fmt(cft), t: tr(cft) }), ln: line(pid, up(cft / TROL), `${t(k)} ${fmt(cft)} cft`) });
    const C = {
      brick() {
        const area = Math.max(0, val('b-l') * val('b-h') - val('b-o')), vol = area * SQ * +sv('b-t'), red = sv('b-k') === 'red';
        const b = red ? [0.23, 0.115, 0.075] : [0.23, 0.11, 0.075], per = 1 / ((b[0] + .01) * (b[1] + .01) * (b[2] + .01)), n = vol * per;
        const m = mortar(Math.max(0, vol - n * b[0] * b[1] * b[2]) * 1.33, +sv('b-m'));
        const bricks = up(n * 1.05, 10), bags = up(m.bags), sand = up(m.sand);
        return { meta: t('r.vol', { cft: fmt(vol * M3), m3: fmt(vol, 2) }), note: t('n.brick', { n: Math.round(per) }), rows: [
          { k: 'r.bricks', v: fmt(bricks), u: 'u.pcs', ln: line(red ? 'red-brick' : 'fly-ash-brick', bricks, `${t('r.bricks')} ${bricks}`) },
          { k: 'r.cement', v: bags, u: 'u.bags', ln: line('ppc-cement', bags, `${t('r.cement')} ${bags} ${t('u.bags')}`) }, sandRow(sand)] };
      },
      concrete() {
        const n = Math.max(1, Math.round(val('c-n')) || 1), vol = feet('c-l') * feet('c-w') * feet('c-d') * n * FT ** 3;
        const mix = { m20: [1, 1.5, 3], m15: [1, 2, 4], m10: [1, 3, 6] }[sv('c-m')], sum = mix[0] + mix[1] + mix[2], dry = vol * 1.54;
        const bags = up(dry / sum * CEM / BAG), sand = up(dry * mix[1] / sum * M3), agg = up(dry * mix[2] / sum * M3);
        const steel = sv('c-m') === 'm10' ? 0 : up(vol * { slab: .01, beam: .02, column: .025, footing: .008 }[sv('c-e')] * 7850, 10);
        const rows = [{ k: 'r.cement', v: bags, u: 'u.bags', ln: line('ppc-cement', bags, `${t('r.cement')} ${bags} ${t('u.bags')}`) }, sandRow(sand), sandRow(agg, 'r.agg', 'gitti-20mm')];
        if (steel) rows.push({ k: 'r.steel', v: fmt(steel), u: 'u.kg', ln: line('', steel, `${t('r.steel')} ~${fmt(steel)} kg`) });
        return { meta: t('r.vol', { cft: fmt(vol * M3), m3: fmt(vol, 2) }), note: t('n.concrete'), rows };
      },
      plaster() {
        const area = Math.max(0, val('p-l') * val('p-h') - val('p-o')), m = mortar(area * SQ * (+sv('p-t') / 1000) * 1.27 * 1.2, +sv('p-m'));
        const bags = up(m.bags), sand = up(m.sand);
        return { meta: t('r.area', { a: fmt(area) }), note: t('n.plaster'), rows: [{ k: 'r.cement', v: bags, u: 'u.bags', ln: line('ppc-cement', bags, `${t('r.cement')} ${bags} ${t('u.bags')}`) }, sandRow(sand)] };
      },
      tiles() {
        const area = val('t-l') * val('t-w'), [a, b, per] = sv('t-s').split('x').map(Number), tf = a * b / 1e6 / SQ;
        const tiles = area ? up(area / tf * +sv('t-x')) : 0, boxes = up(tiles / per), adh = area ? up(area * 1.05 / 45) : 0;
        return { meta: t('r.area', { a: fmt(area) }), note: t('n.tiles'), rows: [
          { k: 'r.tiles', v: fmt(tiles), u: 'u.pcs', s: t('r.boxSub', { n: boxes, per }), ln: line('floor-tile', boxes, `${t('r.tiles')} ${a}×${b} mm: ${boxes} boxes`) },
          { k: 'r.adhesive', v: adh, u: 'u.bags', ln: line('tile-adhesive', adh, `${t('r.adhesive')} ${adh}`) }] };
      },
      paint() {
        const out = sv('a-f') === 'out', l = val('a-l'), w = val('a-w'), h = val('a-h'), n = out ? 1 : Math.max(1, Math.round(val('a-n')) || 1);
        const area = Math.max(0, (2 * (l + w) * h - val('a-o') + (!out && $('#a-c').checked ? l * w : 0)) * n);
        const paint = area ? up(area / (out ? 45 : 55)) : 0, primer = area ? up(area / 100) : 0, kg = area ? up(area / 10) : 0, pb = up(kg / 40);
        return { meta: t('r.area', { a: fmt(area) }), note: t('n.paint'), rows: [
          { k: 'r.paint', v: paint, u: 'u.litre', ln: line('', paint, `${t('r.paint')} ${paint} L`) },
          { k: 'r.primer', v: primer, u: 'u.litre', ln: line('', primer, `${t('r.primer')} ${primer} L`) },
          { k: 'r.putty', v: pb, u: 'u.bags', s: t('r.puttySub', { kg: fmt(kg), b: pb }), ln: line('wall-putty', pb, `${t('r.putty')} ${pb} × 40 kg`, '40 kg') }] };
      }
    };
    const EL = { slab: [[20, 'ft'], [15, 'ft'], [5, 'in'], 1, 'calc.length'], beam: [[15, 'ft'], [9, 'in'], [12, 'in'], 4, 'calc.length'],
      column: [[10, 'ft'], [9, 'in'], [12, 'in'], 8, 'calc.height'], footing: [[4, 'ft'], [4, 'ft'], [12, 'in'], 8, 'calc.length'] };
    function run() {
      calcResult = C[calcState.tab]();
      const has = calcResult.rows.some(r => parseFloat(String(r.v).replace(/,/g, '')) > 0);
      $('#cmeta').textContent = has ? calcResult.meta : t('calc.enter');
      $('#clist').innerHTML = has ? calcResult.rows.map(r => `<li><span>${esc(t(r.k))}</span><span class="v">${esc(String(r.v))} <small>${esc(t(r.u))}</small></span>${r.s ? `<span class="s">${esc(r.s)}</span>` : ''}${r.ln.pid && byId[r.ln.pid] && (!byId[r.ln.pid].opts.length || r.ln.opt) ? '' : `<span class="s">${esc(t('calc.notInShop'))}</span>`}</li>`).join('') : '';
      $('#cadd').hidden = !has; $('#cnote').textContent = calcResult.note;
    }
    $('#cf').addEventListener('input', run); $('#cf').addEventListener('change', e => {
      if (e.target.id === 'c-e') { const d = EL[e.target.value]; [['c-l', d[0]], ['c-w', d[1]], ['c-d', d[2]]].forEach(([id, [v, u]]) => { $('#' + id).value = v; $('#' + id + '-u').value = u; }); $('#c-n').value = d[3]; $('label[for="c-l"]').textContent = t(d[4]); }
      if (e.target.id === 'a-f') { const out = e.target.value === 'out'; $('#a-c-wrap').hidden = out; $('#a-n').closest('.field').hidden = out;
        $('label[for="a-l"]').textContent = `${t(out ? 'calc.houseL' : 'calc.roomL')} (${t('calc.ft')})`; $('label[for="a-w"]').textContent = `${t(out ? 'calc.houseW' : 'calc.roomW')} (${t('calc.ft')})`; }
      run();
    });
    $('#cf').addEventListener('submit', e => e.preventDefault());
    $('.ctabs').addEventListener('click', e => { const b = e.target.closest('[data-ctab]'); if (!b) return; calcState.tab = b.dataset.ctab;
      $$('.ctabs [data-ctab]').forEach(x => x.setAttribute('aria-selected', x === b)); $$('[data-cfs]').forEach(f => { f.hidden = f.dataset.cfs !== calcState.tab; }); run(); });
    $('#cadd').addEventListener('click', () => {
      let n = 0; const notes = [];
      calcResult.rows.forEach(r => { const p = r.ln.pid && byId[r.ln.pid];
        // Items with options: use the option whose name matches (e.g. putty "40 kg"), otherwise leave it for the note
        const o = p && p.opts.length ? p.opts.findIndex(x => r.ln.opt && x.n.toLowerCase().includes(r.ln.opt)) : -1;
        if (p && p.inStock && r.ln.qty > 0 && (!p.opts.length || o >= 0)) { const k = keyOf(p.id, o); setQty(k, qtyOf(k) + r.ln.qty); n++; } else if (r.ln.qty > 0) notes.push(r.ln.text); });
      if (notes.length) store.set('st_calcnote', [store.get('st_calcnote', ''), 'Calculator: ' + notes.join('; ')].filter(Boolean).join('\n'));
      toast(t('calc.added', { n }), `<a href="#/cart">${esc(t('p.viewCart'))}</a>`);
    });
    run();
  }

  /* ---------- Router ---------- */
  let lastHash = '';
  const qs = () => new URLSearchParams((location.hash.split('?')[1]) || '');
  function route() {
    const h = location.hash.replace(/^#/, '').split('?')[0] || '/';
    const parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    const name = parts[0] || 'home', arg = parts[1];
    const fn = SCREENS[name] || SCREENS.home;
    if (name !== 'login' && L.step !== 'phone' && curRoute !== 'login') L = { step: 'phone', phone: '', mode: '' };
    const prev = curRoute, prevHash = lastHash; lastHash = location.hash; curRoute = SCREENS[name] ? name : 'home';
    const r = fn(arg);
    if (!r) return;
    $('#top').innerHTML = r.top;
    $('#view').innerHTML = r.body;
    document.title = shop();
    paintChrome();
    if (prev !== curRoute || prevHash !== lastHash) window.scrollTo(0, 0);
    if (r.after) r.after();
  }
  window.addEventListener('hashchange', route);

  /* ---------- Events ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('button, a'); if (!el) return;
    const d = el.dataset;
    if (el.hasAttribute('data-about')) { e.preventDefault(); return openAbout(); }
    if (el.hasAttribute('data-update')) { el.disabled = true; return hardUpdate(); }
    if (d.poptGo !== undefined) { pOpt[splitKey(el.getAttribute('href').split('/p/')[1]).id] = Number(d.poptGo); }
    if (d.popt !== undefined) { const id = splitKey(location.hash.split('/p/')[1] || '').id; pOpt[decodeURIComponent(id)] = Number(d.popt); return route(); }
    if (d.add) { setQty(d.add, 1); const p = byId[splitKey(d.add).id]; if (p && curRoute !== 'cart') toast(t('p.added', { name: pName(p) }), `<a href="#/cart">${esc(t('p.viewCart'))}</a>`); return; }
    if (d.inc) return setQty(d.inc, qtyOf(d.inc) + 1);
    if (d.dec) return setQty(d.dec, qtyOf(d.dec) - 1);
    if (el.hasAttribute('data-back')) { if (history.length > 1) history.back(); else location.hash = '#/'; return; }
    if (el.hasAttribute('data-lang')) return setLang(HI() ? 'en' : 'hi');
    if (el.hasAttribute('data-retry')) { catalogError = false; route(); boot(true); return; }
    if (el.hasAttribute('data-cartclear')) { if (confirm(t('cart.clearQ'))) { cart = []; store.set('st_cart', cart); route(); } return; }
    if (d.rm) { removeLines([d.rm]); return route(); }
    if (el.hasAttribute('data-rmbad')) { removeLines(badLines().map(x => x.k)); if (!cart.length) location.hash = '#/cart'; return route(); }
    if (el.hasAttribute('data-logout')) { if (confirm(t('a.logoutQ'))) { logout(); route(); } return; }
    if (el.hasAttribute('data-lchange')) { e.preventDefault(); L = { step: 'phone', phone: L.phone, mode: '' }; return route(); }
    if (el.hasAttribute('data-sclear')) { sState.q = ''; $('#sq').value = ''; el.hidden = true; renderSearch(); $('#sq').focus(); return; }
    if (el.hasAttribute('data-recclear')) { e.preventDefault(); store.del('st_recent'); return renderSearch(); }
    if (d.sq !== undefined) { sState.q = d.sq; $('#sq').value = d.sq; $('[data-sclear]').hidden = false; return renderSearch(); }
    if (d.scat !== undefined) { sState.cat = d.scat; return renderSearch(); }
    if (el.hasAttribute('data-refresh')) {
      el.disabled = true;
      Promise.all([fetchCatalog(true), auth ? loadMe() : null]).then(() => { toast(t('a.refreshed')); route(); }).catch(() => toast(t('app.err'))).finally(() => { el.disabled = false; });
      return;
    }
    if (el.hasAttribute('data-install')) {
      if (installEvt) { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; }); }
      else location.href = 'index.html?install=1';
      return;
    }
    if (d.again) {
      const o = ((ME && ME.orders) || []).find(x => x.orderId === d.again); if (!o) return;
      (o.items || []).forEach(i => { const p = byId[i.id], op = i.opt === '' || i.opt == null ? -1 : Number(i.opt); if (p && p.inStock && (!p.opts.length || p.opts[op])) { const k = keyOf(p.id, op); setQty(k, qtyOf(k) + Number(i.qty || 1)); } });
      toast(t('o.againDone'), `<a href="#/cart">${esc(t('p.viewCart'))}</a>`); return;
    }
    if (d.cancel) {
      if (!confirm(t('o.cancelQ'))) return;
      el.disabled = true;
      authed('cancel_order', { orderId: d.cancel }).then(() => loadMe()).then(() => { toast(t('o.cancelled')); route(); }).catch(err => { alert(err.message); el.disabled = false; });
      return;
    }
    if (d.redeem) {
      const g = (D.gifts || []).find(x => x.id === d.redeem); if (!g) return;
      if (!confirm(t('r.confirm', { n: fmt(g.points), gift: loc(g, 'name') }))) return;
      el.disabled = true;
      authed('redeem', { giftId: g.id }).then(() => loadMe()).then(() => { toast(t('r.done')); fetchCatalog(true).catch(() => { }); route(); }).catch(err => { alert(err.message); el.disabled = false; });
    }
  });
  document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.qty; if (k) setQty(k, parseFloat(e.target.value) || 0); });
  let sTimer;
  document.addEventListener('input', e => {
    if (e.target.id === 'sq') { sState.q = e.target.value; $('[data-sclear]').hidden = !sState.q; clearTimeout(sTimer); sTimer = setTimeout(renderSearch, 90); }
    if (e.target.id === 'lphone' || e.target.classList.contains('pin')) e.target.value = e.target.value.replace(/\D/g, '');
  });
  document.addEventListener('keydown', e => { if (e.target.id === 'sq' && e.key === 'Enter') { rememberSearch(e.target.value); e.target.blur(); } });
  document.addEventListener('click', e => { if (curRoute === 'search' && e.target.closest('.pcard a') && sState.q) rememberSearch(sState.q); }, true);

  /* ---------- Offline photos and install ---------- */
  function warmImages() {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
    const urls = [...new Set([...D.products, ...(D.gifts || []), ...(D.categories || []), ...(D.offers || []), ...D.products.flatMap(p => p.opts.map(o => ({ image: o.img })))].map(imgUrl).filter(Boolean))];
    navigator.serviceWorker.controller.postMessage({ type: 'warm', urls });
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => setTimeout(warmImages, 3000)).catch(() => { });
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });

  /* ---------- Updates ----------
     version.json on GitHub says which version is newest. The update button clears the saved app files
     (photos, cart and login stay) and loads everything fresh. */
  let newVersion = '';
  const newer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
  async function checkVersion() {
    try {
      const j = await (await fetch('version.json?t=' + Date.now(), { cache: 'no-store' })).json();
      if (j && j.version && newer(j.version, APP_VERSION)) { const was = newVersion; newVersion = j.version; if (!was && ['home', 'account'].includes(curRoute)) route(); }
    } catch (e) { /* offline */ }
  }
  async function hardUpdate() {
    toast(t('a.updating'));
    try {
      if ('serviceWorker' in navigator) { const reg = await navigator.serviceWorker.getRegistration(); if (reg) { try { await reg.update(); } catch (e) { } if (reg.waiting) reg.waiting.postMessage({ type: 'skip' }); } }
      if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.filter(k => k.startsWith('st-app')).map(k => caches.delete(k))); }
    } catch (e) { }
    store.del('st_catalog');
    setTimeout(() => location.reload(), 400);
  }

  /* ---------- About the shop (tap the logo) ---------- */
  function openAbout() {
    let d = $('#aboutDlg');
    if (!d) { d = document.createElement('dialog'); d.id = 'aboutDlg'; d.className = 'about'; document.body.appendChild(d);
      d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-aclose]')) d.close(); }); }
    d.innerHTML = `<div class="about-in">
      <button class="about-x" data-aclose aria-label="${esc(t('top.back'))}">${svg('x')}</button>
      <img class="about-ph" src="images/owner.jpg" alt="${esc(t('about.name'))}">
      <div class="about-tx">
        <p class="about-k">${esc(shop())}</p>
        <h2>${esc(t('about.name'))}</h2>
        <p class="about-r">${esc(t('about.role'))}</p>
        <p>${esc(t('about.text'))}</p>
        <div class="btns"><a class="btn sm ghost" href="${tel()}">${svg('phone')}${esc(t('a.call'))}</a>
          <a class="btn sm wa" href="${wa(t('p.waMsg', { shop: shop(), item: '' }))}" target="_blank" rel="noopener">${svg('wa')}${esc(t('a.wa'))}</a></div>
        <p class="muted" style="margin-top:10px;font-size:.82rem">${esc(loc(S, 'address'))}</p>
      </div></div>`;
    d.showModal();
  }

  /* ---------- Start ---------- */
  let catalogError = false;
  async function boot(force) {
    try {
      const changed = await fetchCatalog(force);
      if (!changed) pruneCart();
      if (changed && ['home', 'cats', 'cat', 'p', 'search', 'cart', 'rewards'].includes(curRoute)) {
        const y = window.scrollY; route(); window.scrollTo(0, y);
      }
    } catch (e) {
      if (!D.products.length) { catalogError = true; route(); }
      else if (!navigator.onLine) toast(t('app.offline'));
    }
  }
  route();
  boot(false);
  checkVersion();
  if (auth) loadMe().catch(() => { });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { boot(false); checkVersion(); } });
})();
