/**
 * Shani Traders app — backend (Google Apps Script, bound to the Google Sheet)
 * Catalogue, customer accounts (mobile + PIN), orders, reward points, gifts, photos.
 *
 * First time / after every update:
 *   1. Paste this whole file into Extensions > Apps Script, save.
 *   2. Run setup() once (creates the tabs, admin key and permissions). Read the log.
 *   3. Deploy > Manage deployments > Edit > Version: New version > Deploy.
 *      (First time: Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone.)
 * This file does NOT go on GitHub.
 */

const TZ = 'Asia/Kolkata';
const SHEETS = {
  Products: ['id', 'name', 'nameHi', 'category', 'brand', 'unit', 'price', 'mrp', 'points', 'description', 'descriptionHi', 'image', 'tags',
             'inStock', 'visible', 'featured', 'sort', 'updatedAt', 'photoCredit', 'photoLink', 'options'],
  Customers: ['phone', 'name', 'village', 'address', 'landmark', 'pinHash', 'salt', 'points', 'createdAt', 'lastLogin', 'orders', 'notes', 'updatedAt'],
  Categories: ['id', 'name', 'nameHi', 'icon', 'image', 'sort', 'visible'],
  Orders: ['orderId', 'createdAt', 'phone', 'name', 'village', 'address', 'landmark', 'needBy', 'note', 'items', 'itemsText', 'estTotal',
           'estPoints', 'status', 'finalAmount', 'finalPoints', 'pointsCredited', 'updatedAt', 'statusLog'],
  Ledger: ['date', 'phone', 'delta', 'balance', 'reason', 'ref'],
  Gifts: ['id', 'name', 'nameHi', 'points', 'image', 'description', 'descriptionHi', 'active', 'stock', 'sort', 'photoCredit', 'photoLink'],
  Redemptions: ['redeemId', 'createdAt', 'phone', 'name', 'giftId', 'giftName', 'points', 'status', 'updatedAt', 'note'],
  Settings: ['key', 'value', 'about']
};
const TEXT_COLS = { Customers: ['phone', 'pinHash', 'salt'], Orders: ['phone', 'orderId'], Ledger: ['phone'], Redemptions: ['phone'] };
const DEFAULT_SETTINGS = [
  ['pointsPer100', 1, 'Points for every ₹100 of an item that has no points of its own'],
  ['welcomePoints', 50, 'Points given once when a customer creates an account'],
  ['notice', '', 'Short message shown at the top of the app (leave empty for none)'],
  ['noticeHi', '', 'Same message in Hindi'],
  ['deliveryNote', 'Free delivery in Saraipali town. Villages: charge as per distance.', 'Shown at checkout'],
  ['deliveryNoteHi', 'सरायपाली शहर में फ़्री डिलीवरी। गाँव: दूरी के हिसाब से चार्ज।', 'Shown at checkout (Hindi)'],
  ['emailOrders', 'yes', 'Email every new order to the shop (yes / no). Gmail allows about 100 emails a day.']
];
const ORDER_STATUS = ['Placed', 'Delivered', 'Cancelled'];
const SEED_CATEGORIES = [
  ['cement', 'Cement', 'सीमेंट', 'cement'],
  ['steel', 'Sariya & binding wire', 'सरिया और बाइंडिंग तार', 'steel'],
  ['sand', 'Sand, gitti & bricks', 'रेत, गिट्टी और ईंट', 'sand'],
  ['ms', 'MS pipes, angles & sheets', 'MS पाइप, एंगल और चादर', 'ms'],
  ['garden', 'Garden pipes, pots & fencing', 'गार्डन पाइप, गमले और तार-बाड़', 'garden'],
  ['sanitary', 'Sanitary & plumbing', 'सैनिटरी और प्लंबिंग', 'sanitary'],
  ['bathroom', 'Bathroom fittings', 'बाथरूम फ़िटिंग', 'bathroom'],
  ['kitchen', 'Kitchen fittings', 'किचन फ़िटिंग', 'kitchen'],
  ['doors', 'Doors, windows & curtains', 'दरवाज़े, खिड़की और पर्दे', 'doors'],
  ['power', 'Power tools & machines', 'मशीन और पावर टूल', 'power'],
  ['paints', 'Paint, wallpaper & brushes', 'पेंट, वॉलपेपर और ब्रश', 'paints'],
  ['electrical', 'Electrical fittings & wires', 'बिजली की फ़िटिंग और तार', 'electrical'],
  ['fasteners', 'Screws, nails & fasteners', 'स्क्रू, कील और फ़ास्टनर', 'fasteners'],
  ['tiles', 'Tiles & flooring', 'टाइल्स और फ़्लोरिंग', 'tiles'],
  ['site', 'Mason tools & site supplies', 'मिस्त्री औज़ार और साइट का सामान', 'site'],
  ['other', 'Other items', 'अन्य सामान', 'other']
];
const SAMPLE_GIFTS = [
  ['g-tape', 'Measuring tape 5 m', 'नापने का टेप 5 मीटर', 200], ['g-bucket', 'Steel bucket', 'स्टील की बाल्टी', 500],
  ['g-clock', 'Wall clock', 'दीवार घड़ी', 800], ['g-toolkit', 'Mason tool kit', 'मिस्त्री औज़ार किट', 1500]
];

/* ======================= Setup ======================= */
function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SHEETS).forEach(n => ensureSheet_(ss, n, true));
  const st = ss.getSheetByName('Settings');
  const have = st.getLastRow() > 1 ? st.getRange(2, 1, st.getLastRow() - 1, 1).getValues().map(r => String(r[0])) : [];
  DEFAULT_SETTINGS.filter(r => have.indexOf(r[0]) < 0).forEach(r => st.appendRow(r));
  const g = ss.getSheetByName('Gifts');
  const cs = ss.getSheetByName('Categories');
  if (cs.getLastRow() < 2) SEED_CATEGORIES.forEach((c, i) => appendObj_(cs, { id: c[0], name: c[1], nameHi: c[2], icon: c[3], sort: i + 1, visible: true }));
  if (g.getLastRow() < 2) SAMPLE_GIFTS.forEach((x, i) => appendObj_(g, { id: x[0], name: x[1], nameHi: x[2], points: x[3], active: false, sort: i + 1 }));
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('ADMIN_KEY')) p.setProperty('ADMIN_KEY', 'ST-' + Utilities.getUuid().replace(/-/g, '').slice(0, 10));
  if (!p.getProperty('SECRET')) p.setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());
  if (!p.getProperty('OWNER_EMAIL')) p.setProperty('OWNER_EMAIL', Session.getEffectiveUser().getEmail());
  Logger.log('Photos folder: ' + photoFolder_().getUrl());
  try { UrlFetchApp.fetch('https://commons.wikimedia.org/w/api.php?action=query&meta=siteinfo&format=json', { muteHttpExceptions: true }); } catch (e) { }
  bump_();
  Logger.log('ADMIN KEY (for admin.html): ' + p.getProperty('ADMIN_KEY'));
  Logger.log('Order emails go to: ' + p.getProperty('OWNER_EMAIL') + '  (change OWNER_EMAIL in Project Settings > Script properties)');
}
/* Kept so older instructions still work */
function authorize() { setup(); }

function ensureSheet_(ss, name, formatText) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  const head = SHEETS[name];
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight('bold');
    sh.setFrozenRows(1);
  } else {
    const lastCol = Math.max(1, sh.getLastColumn());
    const have = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
    const miss = head.filter(h => have.indexOf(h) < 0);
    if (miss.length) sh.getRange(1, lastCol + 1, 1, miss.length).setValues([miss]).setFontWeight('bold');
  }
  if (!formatText) return sh;
  const h2 = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  (TEXT_COLS[name] || []).forEach(c => { const i = h2.indexOf(c); if (i > -1) sh.getRange(1, i + 1, sh.getMaxRows(), 1).setNumberFormat('@'); });
  return sh;
}

/* ======================= Sheet helpers ======================= */
function sheet_(name) {
  const sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" not found. Run setup() in Apps Script.');
  return sh;
}
function table_(name) {
  const sh = sheet_(name);
  const v = sh.getDataRange().getValues();
  const head = v.shift().map(String);
  return { sh, head, rows: v };
}
function toObj_(head, r) {
  const o = {};
  head.forEach((k, i) => { if (k) o[k] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
  return o;
}
function objs_(name) {
  const t = table_(name);
  return t.rows.filter(r => String(r[0]).trim() !== '').map(r => toObj_(t.head, r));
}
function appendObj_(sh, o) {
  const head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  sh.appendRow(head.map(k => o[k] !== undefined ? o[k] : ''));
}
/* Finds the row (1-based) whose column `col` equals `val` */
function findRow_(sh, head, col, val) {
  const c = head.indexOf(col);
  if (c < 0 || sh.getLastRow() < 2) return 0;
  const f = sh.getRange(2, c + 1, sh.getLastRow() - 1, 1).createTextFinder(String(val)).matchEntireCell(true).findNext();
  return f ? f.getRow() : 0;
}
function setCells_(sh, head, row, o) {
  Object.keys(o).forEach(k => { const c = head.indexOf(k); if (c > -1) sh.getRange(row, c + 1).setValue(o[k]); });
}
function headOf_(sh) { return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String); }
function withLock_(fn) {
  const l = LockService.getScriptLock();
  if (!l.tryLock(28000)) throw new Error('BUSY');
  try { return fn(); } finally { l.releaseLock(); }
}
function truthy_(v, d) {
  if (v === true || v === false) return v;
  if (v === '' || v === null || v === undefined) return d;
  return ['TRUE', '1', 'YES', 'Y'].indexOf(String(v).trim().toUpperCase()) > -1;
}
function numOr_(v, d) { if (v === '' || v === null || v === undefined) return d; const n = Number(String(v).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : d; }
function txt_(v, max) {
  let s = String(v === null || v === undefined ? '' : v).trim().slice(0, max || 500);
  if (/^[=+\-@]/.test(s)) s = "'" + s;   // stop formulas being written into the sheet
  return s;
}
function esc_(s) { return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function now_() { return new Date(); }
function stamp_(fmt) { return Utilities.formatDate(new Date(), TZ, fmt); }
function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k); }

function settings_() {
  const o = {};
  DEFAULT_SETTINGS.forEach(r => { o[r[0]] = r[1]; });
  try { objs_('Settings').forEach(r => { o[String(r.key)] = r.value; }); } catch (e) { }
  o.pointsPer100 = numOr_(o.pointsPer100, 1);
  o.welcomePoints = numOr_(o.welcomePoints, 0);
  return o;
}

/* ======================= Web endpoints ======================= */
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'catalog';
  if (action === 'catalog' || action === 'products') {
    // The app sends the version it already has; if nothing changed, answer with a few bytes
    const v = e.parameter.v, cur = prop_('UPDATED') || '';
    if (v && cur && v === cur) return out_({ ok: true, same: true, v: cur });
    return ContentService.createTextOutput(catalog_()).setMimeType(ContentService.MimeType.JSON);
  }
  return out_({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  let b;
  try { b = JSON.parse(e.postData.contents); } catch (x) { return out_({ ok: false, error: 'Bad request' }); }
  try {
    const pub = { check_phone: checkPhone_, register: register_, login: login_, me: me_, place_order: placeOrder_, cancel_order: cancelOrder_, redeem: redeem_ };
    if (pub[b.action]) return out_(pub[b.action](b));
    if (!isAdmin_(b.key)) return adm_({ ok: false, error: 'Wrong admin key.' });
    switch (b.action) {
      case 'admin_login': return adm_({ ok: true });
      case 'admin_products': return adm_({ ok: true, products: objs_('Products') });
      case 'admin_sync': return adm_(adminSync_(b));
      case 'save_categories': saveRows_('Categories', b.items || [], 'c'); return adm_({ ok: true, categories: objs_('Categories') });
      case 'delete_category': deleteRow_('Categories', 'id', String(b.id || '')); return adm_({ ok: true });
      case 'upload_image': return adm_(uploadImage_(b));
      case 'save_products': saveRows_('Products', b.items || [], 'p'); return adm_({ ok: true, products: objs_('Products') });
      case 'delete_product': deleteRow_('Products', 'id', String(b.id || '')); return adm_({ ok: true });
      case 'upload_photo': return adm_(uploadPhoto_(b));
      case 'photo_from_url': return adm_(photoFromUrl_(b));
      case 'photo_folder': return adm_({ ok: true, url: photoFolder_().getUrl() });
      case 'link_drive_photos': return adm_(linkDrivePhotos_());
      case 'remove_photo': return adm_(setPhoto_(kindSheet_(b.kind), String(b.id || ''), null, '', ''));
      case 'list_orders': return adm_({ ok: true, orders: recent_('Orders', 400) });
      case 'set_order': return adm_(setOrder_(b));
      case 'list_customers': return adm_({ ok: true, customers: objs_('Customers').map(publicCustomer_) });
      case 'customer_ledger': return adm_({ ok: true, ledger: ledgerFor_(String(b.phone || ''), 100) });
      case 'adjust_points': return adm_(adjustPointsAdmin_(b));
      case 'reset_pin': return adm_(resetPin_(String(b.phone || '')));
      case 'list_gifts': return adm_({ ok: true, gifts: objs_('Gifts') });
      case 'save_gifts': saveRows_('Gifts', b.items || [], 'g'); return adm_({ ok: true, gifts: objs_('Gifts') });
      case 'delete_gift': deleteRow_('Gifts', 'id', String(b.id || '')); return adm_({ ok: true });
      case 'list_redemptions': return adm_({ ok: true, redemptions: recent_('Redemptions', 300) });
      case 'set_redemption': return adm_(setRedemption_(b));
      case 'get_settings': return adm_({ ok: true, settings: objs_('Settings') });
      case 'save_settings': return adm_(saveSettings_(b.settings || {}));
    }
    return out_({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return out_({ ok: false, error: String(err && err.message || err) });
  }
}
/* Admin replies carry the catalogue version, so the admin app knows when it is already up to date */
function adm_(o) { o.v = prop_('UPDATED') || ''; return out_(o); }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function isAdmin_(key) {
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('admin_fails') || 0);
  if (fails >= 10) throw new Error('Too many wrong attempts. Try again in 15 minutes.');
  const ok = key && key === prop_('ADMIN_KEY');
  if (!ok) cache.put('admin_fails', String(fails + 1), 900);
  return !!ok;
}

/* ======================= Catalogue (public) ======================= */
function catalog_() {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('pub');
  if (hit) return hit;
  const products = objs_('Products').filter(p => truthy_(p.visible, true)).map(p => ({
    id: String(p.id), name: p.name, nameHi: p.nameHi || '', category: p.category, brand: p.brand || '', unit: p.unit,
    price: p.price, mrp: p.mrp, points: p.points, description: p.description || '', descriptionHi: p.descriptionHi || '',
    image: p.image || '', tags: p.tags || '', inStock: truthy_(p.inStock, true), featured: truthy_(p.featured, false),
    sort: p.sort, photoCredit: p.photoCredit || '', photoLink: p.photoLink || '', options: p.options || ''
  }));
  let categories = [];
  try { categories = objs_('Categories').filter(c => truthy_(c.visible, true)).map(c => ({ id: String(c.id), name: c.name, nameHi: c.nameHi || '', icon: c.icon || '', image: c.image || '', sort: numOr_(c.sort, 99) })); } catch (e) { }
  const gifts = objs_('Gifts').filter(g => truthy_(g.active, false)).map(g => ({
    id: String(g.id), name: g.name, nameHi: g.nameHi || '', points: numOr_(g.points, 0), image: g.image || '',
    description: g.description || '', descriptionHi: g.descriptionHi || '', stock: g.stock, sort: g.sort
  }));
  const s = settings_();
  const json = JSON.stringify({ ok: true, v: prop_('UPDATED') || '', products, gifts, categories,
    settings: { pointsPer100: s.pointsPer100, welcomePoints: s.welcomePoints, notice: s.notice, noticeHi: s.noticeHi,
      deliveryNote: s.deliveryNote, deliveryNoteHi: s.deliveryNoteHi } });
  try { cache.put('pub', json, 21600); } catch (e) { /* too large to cache */ }
  return json;
}
function bump_() {
  CacheService.getScriptCache().remove('pub');
  PropertiesService.getScriptProperties().setProperty('UPDATED', new Date().toISOString());
}
/* Run after editing the Products or Gifts sheet by hand, so the app shows the change at once */
function refreshSite() { bump_(); }

/* Points an item earns: its own points per unit, otherwise the ₹100 rate */
function opts_(p) { try { const o = JSON.parse(p.options || '[]'); return Array.isArray(o) ? o : []; } catch (e) { return []; } }
function itemPoints_(p, qty, rate, price) {
  const own = numOr_(p.points, null);
  if (own !== null) return own * qty;
  price = price === undefined ? numOr_(p.price, 0) : price;
  return price ? price * qty / 100 * rate : 0;
}

/* ======================= Admin: save / delete rows ======================= */
function cleanVal_(k, v) {
  if (['price', 'mrp', 'points', 'sort', 'stock'].indexOf(k) > -1) { const n = numOr_(v, ''); return n === '' ? '' : n; }
  if (['inStock', 'visible', 'featured', 'active'].indexOf(k) > -1) return truthy_(v, k === 'inStock' || k === 'visible');
  if (k === 'options') {   // list of sizes/designs, kept as JSON text (can be long)
    let o = v; if (typeof o === 'string') { try { o = o.trim() ? JSON.parse(o) : []; } catch (e) { return ''; } }
    if (!Array.isArray(o) || !o.length) return '';
    return JSON.stringify(o.slice(0, 60).map(x => ({ n: txt_(x.n, 80).replace(/^'/, ''), nh: txt_(x.nh, 80).replace(/^'/, ''), p: numOr_(x.p, ''), img: txt_(x.img, 300) })));
  }
  return txt_(v, 1000);
}
function saveRows_(name, items, prefix) {
  withLock_(() => {
    const sh = ensureSheet_(SpreadsheetApp.getActive(), name);
    const v = sh.getDataRange().getValues();
    const h = v[0].map(String), idCol = h.indexOf('id');
    const at = {};
    for (let i = 1; i < v.length; i++) { const id = String(v[i][idCol]).trim(); if (id) at[id] = i; }
    const appends = [];
    items.forEach(it => {
      if (!it || !String(it.name || '').trim()) return;
      const id = String(it.id || '').trim() || (prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 5));
      const old = at[id] !== undefined ? v[at[id]] : null;
      const row = h.map((k, i) => {
        if (k === 'updatedAt') return now_();
        if (k === 'id') return id;
        if (Object.prototype.hasOwnProperty.call(it, k)) return cleanVal_(k, it[k]);
        return old ? old[i] : '';
      });
      if (old) v[at[id]] = row; else { appends.push(row); at[id] = -1; }
    });
    if (v.length > 1) sh.getRange(2, 1, v.length - 1, h.length).setValues(v.slice(1));
    if (appends.length) sh.getRange(sh.getLastRow() + 1, 1, appends.length, h.length).setValues(appends);
    bump_();
  });
}
function deleteRow_(name, col, id) {
  if (!id) throw new Error('Nothing selected.');
  withLock_(() => {
    const sh = sheet_(name), v = sh.getDataRange().getValues(), c = v[0].map(String).indexOf(col);
    for (let i = v.length - 1; i >= 1; i--) if (String(v[i][c]).trim() === id) sh.deleteRow(i + 1);
    bump_();
  });
}
function saveSettings_(o) {
  withLock_(() => {
    const sh = ensureSheet_(SpreadsheetApp.getActive(), 'Settings');
    const h = headOf_(sh);
    Object.keys(o).forEach(k => {
      const r = findRow_(sh, h, 'key', k), val = txt_(o[k], 500);
      if (r) setCells_(sh, h, r, { value: val }); else appendObj_(sh, { key: k, value: val });
    });
    bump_();
  });
  return { ok: true, settings: objs_('Settings') };
}
function recent_(name, n) {
  const all = objs_(name);
  return all.slice(Math.max(0, all.length - n)).reverse();
}

/* ======================= Customers ======================= */
function cleanPhone_(p) {
  const d = String(p || '').replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(d)) throw new Error('Enter a valid 10-digit mobile number.');
  return d;
}
function hashPin_(pin, salt) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + '|' + pin + '|' + prop_('SECRET'), Utilities.Charset.UTF_8);
  return raw.map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('');
}
function token_(phone, pinHash) {
  const sig = Utilities.computeHmacSha256Signature(phone + '|' + pinHash, prop_('SECRET'));
  return Utilities.base64EncodeWebSafe(sig).replace(/=+$/, '').slice(0, 40);
}
function customer_(phone) {
  const sh = sheet_('Customers'), h = headOf_(sh), row = findRow_(sh, h, 'phone', phone);
  if (!row) return null;
  return { sh, h, row, c: toObj_(h, sh.getRange(row, 1, 1, h.length).getValues()[0]) };
}
function publicCustomer_(c) {
  return { phone: String(c.phone), name: c.name, village: c.village, address: c.address, landmark: c.landmark,
    points: numOr_(c.points, 0), createdAt: c.createdAt, lastLogin: c.lastLogin, orders: numOr_(c.orders, 0),
    notes: c.notes || '', pinSet: !!c.pinHash };
}
function auth_(b) {
  const phone = cleanPhone_(b.phone);
  const x = customer_(phone);
  if (!x || !x.c.pinHash || token_(phone, String(x.c.pinHash)) !== String(b.token || '')) throw new Error('LOGIN_AGAIN');
  return x;
}
function checkPin_(pin) { if (!/^\d{4}$/.test(String(pin || ''))) throw new Error('PIN must be 4 digits.'); return String(pin); }

function checkPhone_(b) {
  const phone = cleanPhone_(b.phone);
  const x = customer_(phone);
  return { ok: true, exists: !!x, pinSet: !!(x && x.c.pinHash) };
}

function register_(b) {
  const phone = cleanPhone_(b.phone), pin = checkPin_(b.pin);
  const name = txt_(b.name, 60);
  if (!name) throw new Error('Enter your name.');
  return withLock_(() => {
    ensureSheet_(SpreadsheetApp.getActive(), 'Customers');
    const x = customer_(phone);
    if (x && x.c.pinHash) throw new Error('ALREADY_REGISTERED');
    const salt = Utilities.getUuid().slice(0, 12), pinHash = hashPin_(pin, salt);
    let isNew = false;
    if (x) {   // PIN was reset by the shop: set the new PIN
      setCells_(x.sh, x.h, x.row, { pinHash, salt, name, village: txt_(b.village, 60) || x.c.village, lastLogin: now_(), updatedAt: now_() });
    } else {
      isNew = true;
      appendObj_(sheet_('Customers'), { phone, name, village: txt_(b.village, 60), pinHash, salt, points: 0, createdAt: now_(), lastLogin: now_(), orders: 0, updatedAt: now_() });
    }
    const wp = settings_().welcomePoints;
    if (isNew && wp > 0) addPoints_(phone, wp, 'Welcome bonus', '');
    return { ok: true, token: token_(phone, pinHash), profile: publicCustomer_(customer_(phone).c), welcome: isNew ? wp : 0 };
  });
}

function login_(b) {
  const phone = cleanPhone_(b.phone), pin = checkPin_(b.pin);
  const cache = CacheService.getScriptCache(), k = 'pinfail_' + phone;
  const fails = Number(cache.get(k) || 0);
  if (fails >= 5) throw new Error('TOO_MANY');
  const x = customer_(phone);
  if (!x) throw new Error('NOT_REGISTERED');
  if (!x.c.pinHash) throw new Error('PIN_RESET');
  if (hashPin_(pin, String(x.c.salt)) !== String(x.c.pinHash)) { cache.put(k, String(fails + 1), 900); throw new Error('WRONG_PIN'); }
  cache.remove(k);
  setCells_(x.sh, x.h, x.row, { lastLogin: now_() });
  return { ok: true, token: token_(phone, String(x.c.pinHash)), profile: publicCustomer_(x.c) };
}

function resetPin_(phone) {
  phone = cleanPhone_(phone);
  return withLock_(() => {
    const x = customer_(phone);
    if (!x) throw new Error('Customer not found.');
    setCells_(x.sh, x.h, x.row, { pinHash: '', salt: '', updatedAt: now_() });
    return { ok: true };
  });
}

function me_(b) {
  const x = auth_(b), phone = String(x.c.phone);
  const orders = objs_('Orders').filter(o => String(o.phone) === phone).reverse().slice(0, 60).map(publicOrder_);
  const reds = objs_('Redemptions').filter(r => String(r.phone) === phone).reverse().slice(0, 40);
  const pending = orders.filter(o => ['Placed', 'Confirmed', 'Out for delivery'].indexOf(o.status) > -1).reduce((s, o) => s + numOr_(o.estPoints, 0), 0);
  return { ok: true, profile: publicCustomer_(x.c), pending, orders, redemptions: reds, ledger: ledgerFor_(phone, 40) };
}

/* ======================= Points ======================= */
function addPoints_(phone, delta, reason, ref) {   // call inside withLock_
  const x = customer_(phone);
  if (!x) throw new Error('Customer not found.');
  const bal = Math.round(numOr_(x.c.points, 0) + delta);
  setCells_(x.sh, x.h, x.row, { points: bal, updatedAt: now_() });
  appendObj_(ensureSheet_(SpreadsheetApp.getActive(), 'Ledger'), { date: now_(), phone, delta: Math.round(delta), balance: bal, reason, ref: ref || '' });
  return bal;
}
function ledgerFor_(phone, n) {
  return objs_('Ledger').filter(l => String(l.phone) === phone).reverse().slice(0, n);
}
function adjustPointsAdmin_(b) {
  const phone = cleanPhone_(b.phone), d = Math.round(numOr_(b.delta, 0));
  if (!d) throw new Error('Enter points to add or remove.');
  const bal = withLock_(() => addPoints_(phone, d, txt_(b.reason, 100) || 'Adjusted by shop', ''));
  return { ok: true, balance: bal };
}

/* ======================= Orders ======================= */
function publicOrder_(o) {
  let items = [];
  try { items = JSON.parse(o.items || '[]'); } catch (e) { }
  return { orderId: String(o.orderId), createdAt: o.createdAt, status: o.status, items, estTotal: o.estTotal, estPoints: numOr_(o.estPoints, 0),
    finalAmount: o.finalAmount, finalPoints: o.finalPoints, pointsCredited: numOr_(o.pointsCredited, 0), address: o.address,
    village: o.village, landmark: o.landmark, needBy: o.needBy, note: o.note, statusLog: o.statusLog, updatedAt: o.updatedAt };
}

function placeOrder_(b) {
  const x = auth_(b), phone = String(x.c.phone);
  const ref = String(b.clientRef || '').slice(0, 40);
  const cache = CacheService.getScriptCache();
  // Same order sent twice (weak network, double tap): return the first one instead of making a copy
  if (ref) { const done = cache.get('ref_' + ref); if (done) return { ok: true, order: JSON.parse(done), repeat: true }; }
  const want = (b.items || []).filter(i => i && i.id && numOr_(i.qty, 0) > 0).slice(0, 80);
  if (!want.length) throw new Error('Your cart is empty.');
  if (!ref && cache.get('ord_' + phone)) throw new Error('Please wait a moment before placing another order.');
  const rate = settings_().pointsPer100;
  const prods = {}; objs_('Products').forEach(p => { prods[String(p.id)] = p; });
  const lines = [], missing = [];
  let total = 0, pts = 0, unpriced = 0;
  want.forEach(i => {
    const p = prods[String(i.id)];
    if (!p || !truthy_(p.visible, true) || !truthy_(p.inStock, true)) { missing.push(p ? p.name : i.id); return; }
    const op = opts_(p), oi = i.opt === undefined || i.opt === null || i.opt === '' ? -1 : Number(i.opt);
    if (op.length && !(oi >= 0 && oi < op.length)) { missing.push(p.name); return; }
    const o = oi >= 0 ? op[oi] : null;
    const qty = Math.min(100000, Math.round(numOr_(i.qty, 1) * 100) / 100);
    const price = o ? numOr_(o.p, 0) : numOr_(p.price, 0), ip = itemPoints_(p, qty, rate, price);
    if (price) total += price * qty; else unpriced++;
    pts += ip;
    lines.push({ id: String(p.id), opt: o ? oi : '', name: p.name + (o ? ' — ' + o.n : ''), nameHi: p.nameHi ? p.nameHi + (o ? ' — ' + (o.nh || o.n) : '') : '',
      unit: p.unit, qty, price: price || '', points: Math.floor(ip) });
  });
  if (missing.length) throw new Error('OUT_OF_STOCK:' + missing.join(', '));
  const village = txt_(b.village, 60), address = txt_(b.address, 200), landmark = txt_(b.landmark, 100);
  if (!address && !village) throw new Error('Enter the delivery address.');
  const itemsText = lines.map((l, n) => `${n + 1}. ${l.name} — ${l.qty} ${l.unit}${l.price ? ' × ₹' + l.price : ' (rate to confirm)'}`).join('\n');
  let order;
  withLock_(() => {
    // Order numbers count up per day inside the lock, so two customers can never get the same number
    const day = stamp_('yyMMdd'), props = PropertiesService.getScriptProperties();
    const seq = Number(props.getProperty('SEQ_' + day) || 0) + 1;
    props.setProperty('SEQ_' + day, String(seq));
    order = {
      orderId: 'ST' + day + '-' + ('00' + seq).slice(-3), createdAt: now_(), phone, name: x.c.name, village, address, landmark,
      needBy: txt_(b.needBy, 40), note: txt_(b.note, 600), items: JSON.stringify(lines), itemsText, estTotal: Math.round(total),
      estPoints: Math.floor(pts), status: 'Placed', finalAmount: '', finalPoints: '', pointsCredited: 0, updatedAt: now_(),
      statusLog: 'Placed ' + stamp_('dd MMM, h:mm a')
    };
    appendObj_(ensureSheet_(SpreadsheetApp.getActive(), 'Orders'), order);
    const y = customer_(phone);
    setCells_(y.sh, y.h, y.row, { village: village || y.c.village, address: address || y.c.address, landmark: landmark || y.c.landmark, orders: numOr_(y.c.orders, 0) + 1, updatedAt: now_() });
  });
  const pub = publicOrder_(order);
  if (ref) cache.put('ref_' + ref, JSON.stringify(pub), 21600);
  cache.put('ord_' + phone, '1', 20);
  if (String(settings_().emailOrders).toLowerCase() !== 'no') { try { mailOrder_(order, unpriced); } catch (e) { console.error('Order mail failed: ' + e); } }
  return { ok: true, order: pub };
}

function cancelOrder_(b) {
  const x = auth_(b), id = String(b.orderId || '');
  return withLock_(() => {
    const sh = sheet_('Orders'), h = headOf_(sh), row = findRow_(sh, h, 'orderId', id);
    if (!row) throw new Error('Order not found.');
    const o = toObj_(h, sh.getRange(row, 1, 1, h.length).getValues()[0]);
    if (String(o.phone) !== String(x.c.phone)) throw new Error('Order not found.');
    if (o.status !== 'Placed') throw new Error('This order cannot be cancelled now. Call the shop.');
    setCells_(sh, h, row, { status: 'Cancelled', updatedAt: now_(), statusLog: (o.statusLog ? o.statusLog + '\n' : '') + 'Cancelled by customer ' + stamp_('dd MMM, h:mm a') });
    return { ok: true };
  });
}

function setOrder_(b) {
  const id = String(b.orderId || '');
  return withLock_(() => {
    const sh = sheet_('Orders'), h = headOf_(sh), row = findRow_(sh, h, 'orderId', id);
    if (!row) throw new Error('Order not found.');
    const o = toObj_(h, sh.getRange(row, 1, 1, h.length).getValues()[0]);
    const upd = { updatedAt: now_() };
    if (b.finalAmount !== undefined) upd.finalAmount = numOr_(b.finalAmount, '');
    if (b.finalPoints !== undefined) upd.finalPoints = numOr_(b.finalPoints, '');
    if (b.note !== undefined) upd.note = txt_(b.note, 600);
    let msg = '';
    if (b.status && b.status !== o.status) {
      if (ORDER_STATUS.indexOf(b.status) < 0) throw new Error('Unknown status.');
      upd.status = b.status;
      upd.statusLog = (o.statusLog ? o.statusLog + '\n' : '') + b.status + ' ' + stamp_('dd MMM, h:mm a');
    }
    const status = upd.status || o.status, credited = numOr_(o.pointsCredited, 0);
    const fp = upd.finalPoints !== undefined ? upd.finalPoints : o.finalPoints;
    const due = Math.floor(numOr_(fp, numOr_(o.estPoints, 0)));
    if (status === 'Delivered' && due !== credited) {          // credit, or correct an earlier credit
      addPoints_(String(o.phone), due - credited, 'Order ' + id + ' delivered', id);
      upd.pointsCredited = due; msg = (due - credited) + ' points credited';
    } else if (status !== 'Delivered' && credited) {            // order moved back or cancelled: take points back
      addPoints_(String(o.phone), -credited, 'Order ' + id + ' ' + status.toLowerCase(), id);
      upd.pointsCredited = 0; msg = credited + ' points taken back';
    }
    setCells_(sh, h, row, upd);
    return { ok: true, order: publicOrder_(Object.assign(o, upd)), message: msg };
  });
}

function mailOrder_(o, unpriced) {
  const to = prop_('OWNER_EMAIL'); if (!to) return;
  let items = []; try { items = JSON.parse(o.items); } catch (e) { }
  const rows = items.map(l => `<tr><td>${esc_(l.name)}</td><td align="right">${l.qty} ${esc_(l.unit)}</td><td align="right">${l.price ? '₹' + l.price : 'to confirm'}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#111">
    <h2 style="margin:0 0 6px">New order ${esc_(o.orderId)}</h2>
    <p><b>${esc_(o.name)}</b>, <a href="tel:+91${o.phone}">${o.phone}</a> · <a href="https://wa.me/91${o.phone}">WhatsApp</a><br>
    ${esc_([o.address, o.landmark, o.village].filter(String).join(', '))}${o.needBy ? '<br>Needed: ' + esc_(o.needBy) : ''}</p>
    <table cellpadding="6" style="border-collapse:collapse;border:1px solid #ddd">${rows}</table>
    <p>Estimated total: <b>₹${o.estTotal}</b>${unpriced ? ` + ${unpriced} item(s) to price` : ''}<br>Points on delivery: ${o.estPoints}</p>
    ${o.note ? '<p>Note: ' + esc_(o.note) + '</p>' : ''}<p style="color:#666;font-size:13px">Confirm it in the admin page.</p></div>`;
  MailApp.sendEmail({ to, subject: `New order ${o.orderId} from ${o.name} (₹${o.estTotal})`, htmlBody: html, name: 'Shani Traders app' });
}

/* ======================= Gifts ======================= */
function redeem_(b) {
  const x = auth_(b), phone = String(x.c.phone), gid = String(b.giftId || '');
  const r = withLock_(() => {
    const sh = sheet_('Gifts'), h = headOf_(sh), row = findRow_(sh, h, 'id', gid);
    if (!row) throw new Error('Gift not found.');
    const g = toObj_(h, sh.getRange(row, 1, 1, h.length).getValues()[0]);
    if (!truthy_(g.active, false)) throw new Error('This gift is not available now.');
    const stock = numOr_(g.stock, null);
    if (stock !== null && stock <= 0) throw new Error('This gift is out of stock.');
    const cost = numOr_(g.points, 0), bal = numOr_(customer_(phone).c.points, 0);
    if (bal < cost) throw new Error('NOT_ENOUGH');
    const redeemId = 'GR' + stamp_('yyMMdd') + '-' + Math.floor(100 + Math.random() * 900);
    addPoints_(phone, -cost, 'Gift: ' + g.name, redeemId);
    if (stock !== null) { setCells_(sh, h, row, { stock: stock - 1 }); bump_(); }
    const red = { redeemId, createdAt: now_(), phone, name: x.c.name, giftId: gid, giftName: g.name, points: cost, status: 'Requested', updatedAt: now_() };
    appendObj_(ensureSheet_(SpreadsheetApp.getActive(), 'Redemptions'), red);
    return red;
  });
  try {
    MailApp.sendEmail({ to: prop_('OWNER_EMAIL'), name: 'Shani Traders app', subject: `Gift request ${r.redeemId}: ${r.giftName} for ${r.name}`,
      htmlBody: `<p><b>${esc_(r.name)}</b> (${phone}) wants <b>${esc_(r.giftName)}</b> for ${r.points} points.</p><p>Mark it Given in the admin page when handed over.</p>` });
  } catch (e) { }
  return { ok: true, redemption: r };
}
function setRedemption_(b) {
  const id = String(b.redeemId || ''), status = String(b.status || '');
  if (['Requested', 'Given', 'Rejected'].indexOf(status) < 0) throw new Error('Unknown status.');
  return withLock_(() => {
    const sh = sheet_('Redemptions'), h = headOf_(sh), row = findRow_(sh, h, 'redeemId', id);
    if (!row) throw new Error('Request not found.');
    const r = toObj_(h, sh.getRange(row, 1, 1, h.length).getValues()[0]);
    if (r.status === 'Rejected') throw new Error('Already rejected and refunded.');
    if (status === 'Rejected') {
      addPoints_(String(r.phone), numOr_(r.points, 0), 'Gift request ' + id + ' rejected (refund)', id);
      const gs = sheet_('Gifts'), gh = headOf_(gs), gr = findRow_(gs, gh, 'id', String(r.giftId));
      if (gr) { const st = numOr_(gs.getRange(gr, gh.indexOf('stock') + 1).getValue(), null); if (st !== null) { gs.getRange(gr, gh.indexOf('stock') + 1).setValue(st + 1); bump_(); } }
    }
    setCells_(sh, h, row, { status, updatedAt: now_(), note: txt_(b.note, 200) || r.note });
    return { ok: true };
  });
}

/* ======================= Photos (Google Drive) ======================= */
const PHOTO_FOLDER_NAME = 'Shani Traders app photos';
function photoFolder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('PHOTO_FOLDER_ID');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) { } }
  const f = DriveApp.createFolder(PHOTO_FOLDER_NAME);
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
  props.setProperty('PHOTO_FOLDER_ID', f.getId());
  return f;
}
function kindSheet_(k) { return k === 'gift' ? 'Gifts' : k === 'category' ? 'Categories' : 'Products'; }
function driveId_(url) { const m = String(url || '').match(/(?:\/d\/|[?&]id=)([\w-]{20,})/); return m ? m[1] : ''; }
function uploadPhoto_(b) {
  const mime = /^image\/(jpeg|png|webp)$/.test(b.mime) ? b.mime : 'image/jpeg';
  const bytes = Utilities.base64Decode(String(b.data || ''));
  if (!bytes.length) throw new Error('The photo is empty.');
  if (bytes.length > 4 * 1024 * 1024) throw new Error('The photo is larger than 4 MB.');
  return setPhoto_(kindSheet_(b.kind), String(b.id || ''), Utilities.newBlob(bytes, mime, String(b.id) + '.jpg'), '', '');
}
function photoFromUrl_(b) {
  const url = String(b.url || '');
  if (!/^https:\/\/upload\.wikimedia\.org\//.test(url)) throw new Error('Only Wikimedia Commons photos can be copied.');
  const r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'ShaniTradersApp/1.0 (' + (prop_('OWNER_EMAIL') || 'apps-script') + ')' } });
  if (r.getResponseCode() !== 200) throw new Error('Could not download the photo (' + r.getResponseCode() + ').');
  const blob = r.getBlob();
  if (!/^image\//.test(blob.getContentType())) throw new Error('That link is not a photo.');
  return setPhoto_(kindSheet_(b.kind), String(b.id || ''), blob, txt_(b.credit, 300), txt_(b.link, 500));
}
function setPhoto_(name, id, blob, credit, link) {
  if (!id) throw new Error('Save it first, then add a photo.');
  return withLock_(() => {
    const sh = ensureSheet_(SpreadsheetApp.getActive(), name), h = headOf_(sh), row = findRow_(sh, h, 'id', id);
    if (!row) throw new Error('Not found. Save it first.');
    const imgCell = sh.getRange(row, h.indexOf('image') + 1);
    let url = '';
    if (blob) {
      const file = photoFolder_().createFile(blob.setName(id + (/png/.test(blob.getContentType()) ? '.png' : '.jpg')));
      try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
      url = 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w800';
    }
    const oldId = driveId_(imgCell.getValue());
    if (oldId) { try { const old = DriveApp.getFileById(oldId); const par = old.getParents(); if (par.hasNext() && par.next().getId() === photoFolder_().getId()) old.setTrashed(true); } catch (e) { } }
    imgCell.setValue(url);
    setCells_(sh, h, row, { photoCredit: credit || '', photoLink: link || '' });
    if (h.indexOf('updatedAt') > -1) setCells_(sh, h, row, { updatedAt: now_() });
    bump_();
    return { ok: true, url, photoCredit: credit || '', photoLink: link || '' };
  });
}

/* Photos put straight into the Drive folder (named item-code.jpg) are linked to items that have no photo yet */
function linkDrivePhotos_() {
  const folder = photoFolder_(), files = folder.getFiles(), byName = {};
  while (files.hasNext()) {
    const f = files.next();
    if (!/^image\//.test(f.getMimeType())) continue;
    byName[f.getName().replace(/\.[^.]+$/, '').trim().toLowerCase()] = f;
  }
  const url = f => { try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { } return 'https://lh3.googleusercontent.com/d/' + f.getId() + '=w800'; };
  let linked = 0, without = 0;
  withLock_(() => {
    // Items: item-code.jpg is the main photo, item-code--2.jpg is the photo of option 2
    const sh = sheet_('Products'), h = headOf_(sh), v = sh.getDataRange().getValues();
    const idc = h.indexOf('id'), imc = h.indexOf('image'), opc = h.indexOf('options');
    for (let i = 1; i < v.length; i++) {
      const id = String(v[i][idc]).trim().toLowerCase(); if (!id) continue;
      if (!String(v[i][imc]).trim()) {
        if (byName[id]) { sh.getRange(i + 1, imc + 1).setValue(url(byName[id])); linked++; } else without++;
      }
      if (opc > -1 && String(v[i][opc]).trim()) {
        let op; try { op = JSON.parse(v[i][opc]); } catch (e) { continue; }
        let ch = false;
        op.forEach((o, k) => { const f = byName[id + '--' + (k + 1)]; if (f && !o.img) { o.img = url(f); ch = true; linked++; } });
        if (ch) sh.getRange(i + 1, opc + 1).setValue(JSON.stringify(op));
      }
    }
    // Categories: cat-<code>.jpg
    const cs = SpreadsheetApp.getActive().getSheetByName('Categories');
    if (cs && cs.getLastRow() > 1) {
      const ch = headOf_(cs), cv = cs.getDataRange().getValues(), ci = ch.indexOf('id'), cm = ch.indexOf('image');
      for (let i = 1; i < cv.length; i++) { const f = byName['cat-' + String(cv[i][ci]).trim().toLowerCase()]; if (f && !String(cv[i][cm]).trim()) { cs.getRange(i + 1, cm + 1).setValue(url(f)); linked++; } }
    }
    if (linked) bump_();
  });
  return { ok: true, linked, withoutPhoto: without, folder: folder.getUrl() };
}

/* ======================= Admin sync: one call brings everything that changed ======================= */
function adminSync_(b) {
  const since = Number(b.since) || 0, cur = prop_('UPDATED') || '';
  const changed = o => { const t = Date.parse(o.updatedAt || o.createdAt || 0) || 0; return !since || t >= since; };
  const res = { ok: true, now: Date.now() - 5000, v: cur };
  res.orders = objs_('Orders').filter(changed);
  res.customers = objs_('Customers').filter(changed).map(publicCustomer_);
  res.redemptions = objs_('Redemptions').filter(changed);
  if (b.v !== cur || !since) {
    res.products = objs_('Products'); res.gifts = objs_('Gifts'); res.settings = objs_('Settings');
    try { res.categories = objs_('Categories'); } catch (e) { res.categories = []; }
  }
  return res;
}
function uploadImage_(b) {
  const mime = /^image\/(jpeg|png|webp)$/.test(b.mime) ? b.mime : 'image/jpeg';
  const bytes = Utilities.base64Decode(String(b.data || ''));
  if (!bytes.length) throw new Error('The photo is empty.');
  if (bytes.length > 4 * 1024 * 1024) throw new Error('The photo is larger than 4 MB.');
  const name = String(b.name || 'photo').replace(/[^\w.-]/g, '_').slice(0, 80);
  const file = photoFolder_().createFile(Utilities.newBlob(bytes, mime, name));
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { }
  return { ok: true, url: 'https://lh3.googleusercontent.com/d/' + file.getId() + '=w800' };
}
