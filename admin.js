/* Shani Traders — master control */
(() => {
  'use strict';
  const S = window.SHOP || {}, CATS = window.CATEGORIES || [];
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const inr = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  const num = v => { if (v === '' || v == null) return ''; const n = Number(String(v).replace(/[^\d.\-]/g, '')); return isFinite(n) ? n : ''; };
  const bool = (v, d) => v === true || v === false ? v : (v === '' || v == null ? d : ['TRUE', '1', 'YES', 'Y'].includes(String(v).trim().toUpperCase()));
  const when = iso => { try { return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
  const catName = id => (CATS.find(c => c.id === id) || {}).name || id || '—';
  const ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7.5 12 4l8 3.5v9L12 20l-8-3.5z"/><path d="M4 7.5 12 11l8-3.5M12 11v9"/></svg>';
  const imgUrl = v => !v ? '' : (/^(https?:|images\/)/i.test(v) ? v : 'images/' + v);
  const thumb = v => `<span class="ico">${ICON}</span>${imgUrl(v) ? `<img src="${esc(imgUrl(v))}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}`;
  let toastT;
  function toast(m) {
    let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.style.bottom = '84px'; document.body.appendChild(el); }
    el.textContent = m; requestAnimationFrame(() => el.classList.add('show')); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800);
  }

  /* ---------- Sign in ---------- */
  let key = sessionStorage.getItem('st_admin_key') || '';
  async function call(action, body = {}) {
    const r = await fetch(S.apiUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, key, ...body }) });
    const j = await r.json();
    if (!j.ok) {
      if (/admin key/i.test(j.error || '')) { sessionStorage.removeItem('st_admin_key'); alert('Session ended. Sign in again.'); location.reload(); }
      throw new Error(j.error || 'Request failed');
    }
    return j;
  }
  $('#lf').addEventListener('submit', async e => {
    e.preventDefault();
    key = $('#key').value.trim(); if (!key) return;
    const b = $('#lf .btn'); b.disabled = true; b.textContent = 'Signing in…';
    try { await call('admin_login'); sessionStorage.setItem('st_admin_key', key); start(); }
    catch (err) { $('#lmsg').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
    b.disabled = false; b.textContent = 'Sign in';
  });
  $('#logout').addEventListener('click', () => { if (Object.keys(dirty).length && !confirm('Unsaved changes will be lost. Sign out?')) return; sessionStorage.removeItem('st_admin_key'); location.reload(); });
  function start() {
    $('#login').hidden = true; $('#app').hidden = false; $('#logout').hidden = false;
    loadOrders(); loadItems(); loadGiftsAll(); loadCustomers(); loadSettings();
    setInterval(() => { if (document.visibilityState === 'visible' && pane === 'orders') loadOrders(true); }, 60000);
  }

  /* ---------- Tabs ---------- */
  let pane = 'orders';
  $('.atabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    pane = b.dataset.tab;
    $$('.atabs [data-tab]').forEach(x => x.setAttribute('aria-selected', x === b));
    $$('[data-pane]').forEach(p => { p.hidden = p.dataset.pane !== pane; });
    bar();
  });

  /* ================= Orders ================= */
  let orders = [];
  const STAT = ['Placed', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled'];
  const HI_STAT = { Placed: 'प्राप्त हुआ', Confirmed: 'कन्फ़र्म हो गया', 'Out for delivery': 'डिलीवरी के लिए निकल गया', Delivered: 'डिलीवर हो गया', Cancelled: 'रद्द हो गया' };
  async function loadOrders(quiet) {
    if (!quiet) $('#olist').innerHTML = '<p class="muted">Loading orders…</p>';
    try { const before = orders.filter(o => o.status === 'Placed').length; orders = (await call('list_orders')).orders; renderOrders();
      const now = orders.filter(o => o.status === 'Placed').length; if (quiet && now > before) toast('New order received'); }
    catch (err) { if (!quiet) $('#olist').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
  }
  function items(o) { try { return JSON.parse(o.items || '[]'); } catch (e) { return []; } }
  function renderOrders() {
    const newN = orders.filter(o => o.status === 'Placed').length;
    $('#n-orders').textContent = newN || '';
    const f = $('#ofilter').value, q = $('#oq').value.trim().toLowerCase();
    const list = orders.filter(o => (f === 'all' || (f === 'active' ? ['Placed', 'Confirmed', 'Out for delivery'].includes(o.status) : o.status === f)) &&
      (!q || [o.orderId, o.name, o.phone, o.village].join(' ').toLowerCase().includes(q)));
    $('#olist').innerHTML = list.length ? list.map(o => {
      const its = items(o), est = Number(o.estPoints) || 0;
      const msg = `Namaste ${o.name} ji, Shani Traders: your order ${o.orderId} is ${o.status.toLowerCase()}.` + (o.finalAmount ? ` Bill: ₹${o.finalAmount}.` : '') +
        `\nनमस्ते ${o.name} जी, शनि ट्रेडर्स: आपका ऑर्डर ${o.orderId} ${HI_STAT[o.status] || o.status}।` + (o.finalAmount ? ` बिल: ₹${o.finalAmount}।` : '');
      return `<article class="aord${o.status === 'Placed' ? ' new' : ''}" data-oid="${esc(o.orderId)}">
        <div class="hd"><div><b>${esc(o.orderId)}</b> <span class="badge b-${esc(String(o.status).split(' ')[0])}">${esc(o.status)}</span><div class="muted">${esc(when(o.createdAt))}${o.needBy ? ' · needed: ' + esc(o.needBy) : ''}</div></div>
          <div style="text-align:right"><b>${inr(o.finalAmount || o.estTotal)}</b><div class="muted">${o.finalAmount ? 'bill' : 'estimate'} · ${Number(o.pointsCredited) ? o.pointsCredited + ' pts given' : est + ' pts on delivery'}</div></div></div>
        <p class="cust"><b>${esc(o.name)}</b> · ${esc(o.phone)}<br>${esc([o.address, o.landmark, o.village].filter(Boolean).join(', '))}</p>
        <table>${its.map(i => `<tr><td>${esc(i.name)}</td><td class="r">${esc(i.qty)} ${esc(i.unit)}</td><td class="r">${i.price ? inr(i.price * i.qty) : '<span class="red">price?</span>'}</td><td class="r muted">${i.points ? i.points + ' pts' : ''}</td></tr>`).join('')}</table>
        ${o.note ? `<p class="muted">Note: ${esc(o.note)}</p>` : ''}
        <div class="ctl">
          <label>Status<select data-f="status">${STAT.map(s => `<option${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}</select></label>
          <label>Bill amount ₹<input data-f="finalAmount" type="number" inputmode="decimal" min="0" value="${esc(o.finalAmount)}" placeholder="${esc(o.estTotal)}"></label>
          <label>Points to give<input data-f="finalPoints" type="number" inputmode="numeric" min="0" value="${esc(o.finalPoints)}" placeholder="${est}"></label>
          <button class="btn sm" data-osave>Save</button>
        </div>
        <div class="acts">
          <a class="btn sm ghost" href="tel:+91${esc(o.phone)}">Call</a>
          <a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/91${esc(o.phone)}?text=${encodeURIComponent(msg)}">WhatsApp status</a>
        </div></article>`;
    }).join('') : '<div class="empty"><h2>No orders here</h2><p>New orders appear here and are emailed to you.</p></div>';
  }
  $('#ofilter').addEventListener('change', renderOrders);
  $('#oq').addEventListener('input', renderOrders);
  $('#oreload').addEventListener('click', () => loadOrders());
  $('#olist').addEventListener('click', async e => {
    const b = e.target.closest('[data-osave]'); if (!b) return;
    const card = b.closest('[data-oid]'), id = card.dataset.oid, o = orders.find(x => x.orderId === id);
    const body = { orderId: id };
    $$('[data-f]', card).forEach(el => { body[el.dataset.f] = el.value; });
    if (body.status === 'Delivered' && o.status !== 'Delivered') {
      const pts = body.finalPoints !== '' ? body.finalPoints : o.estPoints;
      if (!confirm(`Mark ${id} delivered and give ${pts} points to ${o.name}?`)) return;
    }
    if (body.status === 'Cancelled' && o.status !== 'Cancelled' && !confirm(`Cancel order ${id}?`)) return;
    b.disabled = true; b.textContent = 'Saving…';
    try { const r = await call('set_order', body); Object.assign(o, r.order, { items: JSON.stringify(r.order.items) }); renderOrders(); toast('Saved' + (r.message ? '. ' + r.message : '')); }
    catch (err) { alert('Not saved: ' + err.message); b.disabled = false; b.textContent = 'Save'; }
  });

  /* ================= Items ================= */
  let products = [], dirty = {}, starter = null;
  const norm = p => ({ ...p, id: String(p.id), price: num(p.price), mrp: num(p.mrp), points: num(p.points), sort: Number(p.sort) || 9999,
    inStock: bool(p.inStock, true), visible: bool(p.visible, true), featured: bool(p.featured, false) });
  async function loadItems() {
    $('#ilist').innerHTML = '<p class="muted">Loading items…</p>';
    try { setProducts((await call('admin_products')).products); } catch (err) { $('#ilist').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
    try { starter = (await (await fetch('starter-items.json', { cache: 'no-store' })).json()).products; } catch (e) { starter = []; }
    renderItems();
  }
  function setProducts(list) {
    products = list.map(norm).filter(p => p.id).sort((a, b) => a.sort - b.sort || String(a.name).localeCompare(b.name));
    dirty = {}; renderItems(); bar();
  }
  const cur = p => ({ ...p, ...(dirty[p.id] || {}) });
  function renderItems() {
    const cats = [...new Set([...CATS.map(c => c.id), ...products.map(p => p.category).filter(Boolean)])];
    const sel = $('#icat'), keep = sel.value || 'all';
    sel.innerHTML = '<option value="all">All categories</option>' + cats.map(c => `<option value="${esc(c)}">${esc(catName(c))}</option>`).join('');
    sel.value = cats.includes(keep) ? keep : 'all';
    const miss = (starter || []).filter(s => !products.some(p => p.id === s.id));
    const hiMiss = products.filter(p => !p.nameHi && (starter || []).some(s => s.id === p.id && s.nameHi));
    $('#istarter').hidden = !miss.length && !hiMiss.length;
    $('#istarter').textContent = miss.length ? `Add ${miss.length} catalogue items with photos` : `Fill Hindi names (${hiMiss.length})`;
    $('#iphotos').hidden = !products.some(p => !p.image);
    const q = $('#iq').value.trim().toLowerCase(), c = sel.value, sh = $('#ishow').value;
    const list = products.map(cur).filter(p => (c === 'all' || p.category === c) &&
      (sh === 'all' || (sh === 'out' && !p.inStock) || (sh === 'hidden' && !p.visible) || (sh === 'noprice' && p.price === '') || (sh === 'nophoto' && !p.image)) &&
      (!q || [p.name, p.nameHi, p.brand, p.tags].join(' ').toLowerCase().includes(q)));
    $('#ilist').innerHTML = !products.length ? '<div class="empty"><h2>No items yet</h2><p>Use “Add catalogue items” to load the starter list with photos, then set your prices.</p></div>'
      : list.length ? list.map(p => `<div class="irow${dirty[p.id] ? ' dirty' : ''}${p.visible ? '' : ' off'}" data-id="${esc(p.id)}">
        <button class="th" data-edit aria-label="Edit ${esc(p.name)}">${thumb(p.image)}</button>
        <div class="nm"><b>${esc(p.name)}</b><small>${esc([p.brand, 'per ' + p.unit, catName(p.category)].filter(Boolean).join(' · '))}</small></div>
        <label class="inum price">₹<input type="number" min="0" step="0.01" inputmode="decimal" data-f="price" value="${esc(p.price)}" placeholder="Ask" aria-label="Price"></label>
        <label class="inum" title="Points per unit">pts<input type="number" min="0" step="0.1" inputmode="decimal" data-f="points" value="${esc(p.points)}" placeholder="auto" aria-label="Points per unit"></label>
        <label class="sw sm s1"><input type="checkbox" data-f="inStock"${p.inStock ? ' checked' : ''}>In stock</label>
        <label class="sw sm s2"><input type="checkbox" data-f="visible"${p.visible ? ' checked' : ''}>In app</label>
        <button class="btn sm ghost" data-edit>Edit</button></div>`).join('') : '<p class="muted">No items match.</p>';
  }
  ['#iq', '#icat', '#ishow'].forEach(s => $(s).addEventListener('input', renderItems));
  $('#ilist').addEventListener('input', e => {
    const f = e.target.dataset.f; if (!f) return;
    const row = e.target.closest('.irow'), id = row.dataset.id, orig = products.find(p => p.id === id);
    const v = e.target.type === 'checkbox' ? e.target.checked : num(e.target.value);
    const d = dirty[id] || {};
    if (v === orig[f]) delete d[f]; else d[f] = v;
    if (Object.keys(d).length) dirty[id] = d; else delete dirty[id];
    row.classList.toggle('dirty', !!dirty[id]); if (f === 'visible') row.classList.toggle('off', !v);
    bar();
  });
  $('#ilist').addEventListener('click', e => { const b = e.target.closest('[data-edit]'); if (b) openItem(cur(products.find(p => p.id === b.closest('.irow').dataset.id))); });
  function bar() {
    const n = Object.keys(dirty).length;
    $('#dcount').textContent = n + (n === 1 ? ' item changed' : ' items changed');
    $('#savebar').classList.toggle('show', n > 0 && pane === 'items');
  }
  $('#discard').addEventListener('click', () => { dirty = {}; renderItems(); bar(); });
  $('#save').addEventListener('click', async () => {
    const list = Object.keys(dirty).map(id => ({ ...products.find(p => p.id === id), ...dirty[id] }));
    const b = $('#save'); b.disabled = true; b.textContent = 'Saving…';
    try { setProducts((await call('save_products', { items: list })).products); toast(`Saved ${list.length} items. The app updates within 3 minutes.`); }
    catch (err) { alert('Not saved: ' + err.message); }
    b.disabled = false; b.textContent = 'Save changes';
  });
  window.addEventListener('beforeunload', e => { if (Object.keys(dirty).length) { e.preventDefault(); e.returnValue = ''; } });
  $('#istarter').addEventListener('click', async () => {
    const miss = starter.filter(s => !products.some(p => p.id === s.id));
    const list = miss.length ? miss : products.filter(p => !p.nameHi).map(p => { const s = starter.find(x => x.id === p.id); return s && s.nameHi ? { ...p, nameHi: s.nameHi, descriptionHi: p.descriptionHi || s.descriptionHi || '' } : null; }).filter(Boolean);
    if (!list.length || !confirm(miss.length ? `Add ${miss.length} items to the Products sheet? Prices stay empty for you to fill.` : `Fill Hindi names for ${list.length} items?`)) return;
    const b = $('#istarter'); b.disabled = true; b.textContent = 'Saving…';
    try { setProducts((await call('save_products', { items: list })).products); toast('Done'); } catch (err) { alert(err.message); }
    b.disabled = false; renderItems();
  });

  /* ---------- Edit dialog (items and gifts) ---------- */
  const dlg = $('#dlg'), pf = $('#pf');
  let editing = null, kind = 'item';
  const F = (name, label, val, attrs = '') => `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" value="${esc(val ?? '')}" ${attrs}></div>`;
  const TA = (name, label, val) => `<div class="field"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" maxlength="600">${esc(val ?? '')}</textarea></div>`;
  const photoBox = () => `<div class="field" style="margin-bottom:4px"><span style="font-weight:600;font-size:.92rem">Photo</span></div>
    <div class="photo"><div class="pv" id="pv"></div><div><div class="pa">
      <label class="btn sm" for="pfile">Upload photo</label><input type="file" id="pfile" accept="image/*" class="sr">
      <button type="button" class="btn sm ghost" id="pfind">Find photo online</button><button type="button" class="btn sm ghost" id="prm">Remove</button></div>
      <p class="muted" id="pnote" style="margin-top:6px;font-size:.82rem"></p></div></div>
    <div id="picker" hidden><div style="display:flex;gap:6px"><input id="pkq" class="field" style="flex:1;min-height:40px;border:1.5px solid var(--line);border-radius:8px;padding:0 10px" placeholder="Search free photos"><button type="button" class="btn sm ghost" id="pkgo">Search</button></div><div class="picks" id="picks"></div></div>`;
  function openItem(p) {
    kind = 'item'; editing = p || null;
    p = p || { name: '', nameHi: '', category: $('#icat').value !== 'all' ? $('#icat').value : CATS[0].id, brand: '', unit: 'piece', price: '', mrp: '', points: '', description: '', descriptionHi: '', tags: '', image: '', inStock: true, visible: true, featured: false, sort: '' };
    const cats = [...new Set([...CATS.map(c => c.id), ...products.map(x => x.category).filter(Boolean)])];
    $('#dtitle').textContent = editing ? 'Edit item' : 'Add item';
    $('#pdel').hidden = !editing;
    $('#dbody').innerHTML = `${photoBox()}
      ${F('name', 'Name (English)', p.name, 'required maxlength="120"')}${F('nameHi', 'Name in Hindi', p.nameHi, 'lang="hi" maxlength="120"')}
      <div class="row2"><div class="field"><label for="f-category">Category</label><select id="f-category" name="category">${cats.map(c => `<option value="${esc(c)}"${c === p.category ? ' selected' : ''}>${esc(catName(c))}</option>`).join('')}<option value="__new">New category…</option></select></div>
        ${F('unit', 'Sold per', p.unit, 'list="units" required maxlength="30"')}</div>
      <datalist id="units">${Object.keys(window.UNITS_HI || {}).map(u => `<option>${u}</option>`).join('')}</datalist>
      <div class="row3">${F('price', 'Price ₹', p.price, 'type="number" min="0" step="0.01" placeholder="Ask"')}${F('mrp', 'MRP ₹', p.mrp, 'type="number" min="0" step="0.01"')}${F('points', 'Points per unit', p.points, 'type="number" min="0" step="0.1" placeholder="auto"')}</div>
      <div class="row2">${F('brand', 'Brand', p.brand, 'maxlength="60"')}${F('sort', 'Display order', p.sort === 9999 ? '' : p.sort, 'type="number" placeholder="Smaller shows first"')}</div>
      ${TA('description', 'Description (English)', p.description)}${TA('descriptionHi', 'Description in Hindi', p.descriptionHi)}
      ${F('tags', 'Search words (Hindi or local names)', p.tags, 'maxlength="200" placeholder="e.g. kabja hinge darwaja"')}
      <div class="checks"><label class="sw"><input type="checkbox" name="inStock"${p.inStock ? ' checked' : ''}>In stock</label>
        <label class="sw"><input type="checkbox" name="visible"${p.visible ? ' checked' : ''}>In app</label>
        <label class="sw"><input type="checkbox" name="featured"${p.featured ? ' checked' : ''}>Show in Today's rates</label></div>`;
    $('#f-category').addEventListener('change', e => {
      if (e.target.value !== '__new') return;
      const n = (prompt('New category code (one word, e.g. glass)') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (!n) { e.target.value = CATS[0].id; return; }
      e.target.insertAdjacentHTML('afterbegin', `<option value="${n}">${n}</option>`); e.target.value = n;
    });
    bindPhoto(); dlg.showModal();
  }
  function openGift(g) {
    kind = 'gift'; editing = g || null;
    g = g || { name: '', nameHi: '', points: '', stock: '', description: '', descriptionHi: '', active: true, sort: '', image: '' };
    $('#dtitle').textContent = editing ? 'Edit gift' : 'Add gift';
    $('#pdel').hidden = !editing;
    $('#dbody').innerHTML = `${photoBox()}${F('name', 'Gift name (English)', g.name, 'required maxlength="120"')}${F('nameHi', 'Gift name in Hindi', g.nameHi, 'lang="hi" maxlength="120"')}
      <div class="row3">${F('points', 'Points needed', g.points, 'type="number" min="1" required')}${F('stock', 'Stock (empty = no limit)', g.stock, 'type="number" min="0"')}${F('sort', 'Order', g.sort, 'type="number"')}</div>
      ${TA('description', 'Description', g.description)}${TA('descriptionHi', 'Description in Hindi', g.descriptionHi)}
      <div class="checks"><label class="sw"><input type="checkbox" name="active"${bool(g.active, false) ? ' checked' : ''}>Show in app</label></div>`;
    bindPhoto(); dlg.showModal();
  }
  $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
  pf.addEventListener('submit', async e => {
    e.preventDefault();
    const el = pf.elements, o = { id: editing ? editing.id : '' };
    $$('input[name], select[name], textarea[name]', pf).forEach(i => { o[i.name] = i.type === 'checkbox' ? i.checked : i.value.trim(); });
    if (!o.name) return alert('Enter a name.');
    if (editing) o.image = editing.image || '';
    if (kind === 'item') {
      if (!o.unit) return alert('Enter “Sold per”.');
      if (!o.id) { const base = o.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item'; let id = base, n = 2; while (products.some(p => p.id === id)) id = base + '-' + n++; o.id = id; }
      if (o.sort === '') o.sort = 9999;
    } else if (!(Number(o.points) > 0)) return alert('Enter the points needed.');
    const b = $('#psave'); b.disabled = true; b.textContent = 'Saving…';
    try {
      if (kind === 'item') { const keep = { ...dirty }; delete keep[o.id]; setProducts((await call('save_products', { items: [o] })).products); dirty = keep; renderItems(); bar(); }
      else { gifts = (await call('save_gifts', { items: [o] })).gifts; renderGifts(); }
      const wasNew = !editing; dlg.close(); toast('Saved');
      if (wasNew) { const n = kind === 'item' ? products.find(p => p.id === o.id) : gifts.find(g => g.name === o.name); if (n) { kind === 'item' ? openItem(norm(n)) : openGift(n); $('#pnote').textContent = 'Saved. Now add a photo.'; } }
    } catch (err) { alert('Not saved: ' + err.message); }
    b.disabled = false; b.textContent = 'Save';
  });
  $('#pdel').addEventListener('click', async () => {
    if (!editing) return;
    if (!confirm(`Delete “${editing.name}” for good?${kind === 'item' ? '\nTip: switch off “In app” instead if you may sell it again.' : ''}`)) return;
    try {
      if (kind === 'item') { await call('delete_product', { id: editing.id }); products = products.filter(p => p.id !== editing.id); delete dirty[editing.id]; renderItems(); bar(); }
      else { await call('delete_gift', { id: editing.id }); gifts = gifts.filter(g => g.id !== editing.id); renderGifts(); }
      dlg.close(); toast('Deleted');
    } catch (err) { alert('Not deleted: ' + err.message); }
  });

  /* ---------- Photos: upload to Drive, or pick a free photo online ---------- */
  function showPhoto() {
    const has = editing && editing.image;
    $('#pv').innerHTML = thumb(editing && editing.image);
    $('#prm').hidden = !has;
    $$('.pa .btn, .pa input').forEach(b => { b.disabled = !editing; b.style.opacity = editing ? '' : '.5'; });
    $('#pnote').textContent = !editing ? 'Save first, then add a photo.' : (editing.photoCredit ? 'Photo: ' + editing.photoCredit : 'Photos are stored in your Google Drive and saved on customers’ phones.');
  }
  function patchPhoto(r) {
    Object.assign(editing, { image: r.url, photoCredit: r.photoCredit, photoLink: r.photoLink });
    const list = kind === 'item' ? products : gifts, x = list.find(i => String(i.id) === String(editing.id));
    if (x) Object.assign(x, { image: r.url, photoCredit: r.photoCredit, photoLink: r.photoLink });
    showPhoto(); kind === 'item' ? renderItems() : renderGifts();
  }
  function shrink(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const k = Math.min(1, 800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.8).split(',')[1]);
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('This file could not be read as a photo. Use a JPG or PNG.')); };
      img.src = url;
    });
  }
  const strip = h => { const d = document.createElement('div'); d.innerHTML = h || ''; return d.textContent.replace(/\s+/g, ' ').trim(); };
  async function commons(q) {
    const u = 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ action: 'query', format: 'json', origin: '*', generator: 'search', gsrnamespace: '6', gsrlimit: '16',
      gsrsearch: q + ' filetype:bitmap', prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '960', iiextmetadatafilter: 'Artist|LicenseShortName' });
    const j = await (await fetch(u)).json();
    return Object.values((j.query && j.query.pages) || {}).sort((a, b) => a.index - b.index).map(pg => ({ pg, ii: (pg.imageinfo || [])[0] }))
      .filter(x => x.ii && /jpeg|png/.test(x.ii.mime) && x.ii.thumburl).map(({ pg, ii }) => {
        const m = ii.extmetadata || {};
        return { thumb: ii.thumburl, page: ii.descriptionurl, title: pg.title,
          credit: `${strip(m.Artist && m.Artist.value).slice(0, 80) || 'Unknown author'}, ${strip(m.LicenseShortName && m.LicenseShortName.value) || 'free licence'}, via Wikimedia Commons` };
      });
  }
  const queryFor = p => String(p.name || '').replace(/\(.*?\)|\d+(\.\d+)?\s*(mm|kg|l|litre|m|inch|sq)\b/gi, ' ').replace(/,.*$/, '').trim();
  let found = [];
  async function savePick(x) {
    try { return await call('photo_from_url', { kind, id: editing.id, url: x.thumb, credit: x.credit, link: x.page }); }
    catch (err) { // Drive copy failed: link the photo directly
      const it = { ...editing, image: x.thumb, photoCredit: x.credit, photoLink: x.page };
      await call(kind === 'item' ? 'save_products' : 'save_gifts', { items: [it] });
      return { url: x.thumb, photoCredit: x.credit, photoLink: x.page };
    }
  }
  function bindPhoto() {
    showPhoto();
    const busy = (on, txt) => { $$('.pa .btn, .pa input').forEach(b => { b.disabled = on; }); $('#pnote').textContent = txt || ''; if (!on) showPhoto(); };
    $('#pfile').addEventListener('change', async e => {
      const f = e.target.files[0]; e.target.value = ''; if (!f || !editing) return;
      busy(true, 'Uploading…');
      try { patchPhoto(await call('upload_photo', { kind, id: editing.id, data: await shrink(f), mime: 'image/jpeg' })); toast('Photo saved'); } catch (err) { alert('Photo not saved: ' + err.message); }
      busy(false);
    });
    $('#prm').addEventListener('click', async () => {
      if (!editing || !confirm('Remove this photo?')) return;
      busy(true, 'Removing…');
      try { patchPhoto(await call('remove_photo', { kind, id: editing.id })); } catch (err) { alert(err.message); }
      busy(false);
    });
    const search = async q => { $('#picks').innerHTML = '<p class="muted">Searching…</p>'; try { found = await commons(q); } catch (e) { found = []; }
      $('#picks').innerHTML = found.length ? found.map((x, i) => `<button type="button" data-pick="${i}" title="${esc(x.title)}"><img src="${esc(x.thumb.replace(/\/960px-/, '/330px-'))}" alt="" loading="lazy" referrerpolicy="no-referrer"></button>`).join('') : '<p class="muted">No photos found. Try simple English words.</p>'; };
    $('#pfind').addEventListener('click', () => { const pk = $('#picker'); pk.hidden = !pk.hidden; if (!pk.hidden) { $('#pkq').value = queryFor(editing); search($('#pkq').value); } });
    $('#pkgo').addEventListener('click', () => search($('#pkq').value));
    $('#pkq').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); search($('#pkq').value); } });
    $('#picks').addEventListener('click', async e => {
      const b = e.target.closest('[data-pick]'); if (!b) return;
      $('#picker').hidden = true; busy(true, 'Saving photo…');
      try { patchPhoto(await savePick(found[b.dataset.pick])); toast('Photo saved'); } catch (err) { alert(err.message); }
      busy(false);
    });
  }
  $('#iadd').addEventListener('click', () => openItem(null));
  $('#iphotos').addEventListener('click', async () => {
    const todo = products.filter(p => !p.image);
    if (!confirm(`Find a free photo online for ${todo.length} items without one? Check them afterwards; you can change any photo.`)) return;
    const b = $('#iphotos'); b.disabled = true; let ok = 0, n = 0; const used = new Set();
    for (const p of todo) {
      b.textContent = `Adding photos ${++n}/${todo.length}…`;
      try { const x = (await commons(queryFor(p))).find(c => !used.has(c.page)); if (!x) continue; used.add(x.page);
        editing = p; kind = 'item'; const r = await savePick(x); Object.assign(p, { image: r.url, photoCredit: r.photoCredit, photoLink: r.photoLink }); ok++; renderItems(); } catch (e) { }
    }
    editing = null; b.disabled = false; b.textContent = 'Add missing photos'; renderItems(); toast(`${ok} photos added`);
  });

  /* ================= Customers ================= */
  let customers = [];
  async function loadCustomers() {
    $('#clist').innerHTML = '<p class="muted">Loading customers…</p>';
    try { customers = (await call('list_customers')).customers.sort((a, b) => String(b.lastLogin).localeCompare(String(a.lastLogin))); renderCustomers(); }
    catch (err) { $('#clist').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
  }
  function renderCustomers() {
    const q = $('#cq').value.trim().toLowerCase();
    const list = customers.filter(c => !q || [c.name, c.phone, c.village].join(' ').toLowerCase().includes(q));
    $('#clist').innerHTML = `<p class="muted" style="margin-bottom:8px">${customers.length} customers · ${customers.reduce((s, c) => s + (Number(c.points) || 0), 0).toLocaleString('en-IN')} points held in total</p>` +
      (list.length ? list.map(c => `<div class="acust" data-ph="${esc(c.phone)}"><div class="hd"><div><b>${esc(c.name)}</b> · ${esc(c.phone)}<div class="muted">${esc(c.village || '')}${c.orders ? ' · ' + c.orders + ' orders' : ''} · joined ${esc(when(c.createdAt))}${c.pinSet ? '' : ' · <b class="red">PIN reset, waiting for new PIN</b>'}</div></div>
        <span class="chip-pts">${Number(c.points || 0).toLocaleString('en-IN')} pts</span></div>
        <div class="acts"><button class="btn sm ghost" data-pts>Add / remove points</button><button class="btn sm ghost" data-led>Points history</button>
          <button class="btn sm ghost" data-reset>Reset PIN</button><a class="btn sm ghost" href="tel:+91${esc(c.phone)}">Call</a>
          <a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/91${esc(c.phone)}">WhatsApp</a></div><div class="ledger" hidden></div></div>`).join('') : '<p class="muted">No customers yet.</p>');
  }
  $('#cq').addEventListener('input', renderCustomers);
  $('#creload').addEventListener('click', loadCustomers);
  $('#clist').addEventListener('click', async e => {
    const card = e.target.closest('[data-ph]'); if (!card) return;
    const c = customers.find(x => x.phone === card.dataset.ph);
    if (e.target.closest('[data-pts]')) {
      const d = prompt(`Points to add for ${c.name} (use minus to remove, e.g. -50):`); if (!d || !Number(d)) return;
      const reason = prompt('Reason (shown to the customer):', Number(d) > 0 ? 'Bonus from shop' : 'Adjusted by shop') || '';
      try { const r = await call('adjust_points', { phone: c.phone, delta: Number(d), reason }); c.points = r.balance; renderCustomers(); toast('Points updated'); } catch (err) { alert(err.message); }
    }
    if (e.target.closest('[data-reset]')) {
      if (!confirm(`Reset the PIN for ${c.name}? They will set a new PIN at their next login. Their points stay safe.`)) return;
      try { await call('reset_pin', { phone: c.phone }); c.pinSet = false; renderCustomers(); toast('PIN reset. Tell the customer to log in again.'); } catch (err) { alert(err.message); }
    }
    if (e.target.closest('[data-led]')) {
      const box = $('.ledger', card); box.hidden = !box.hidden; if (box.hidden) return;
      box.innerHTML = '<p class="muted">Loading…</p>';
      try { const l = (await call('customer_ledger', { phone: c.phone })).ledger;
        box.innerHTML = l.length ? l.map(x => `<div class="hist"><span>${esc(x.reason)}<small>${esc(when(x.date))}</small></span><b class="${Number(x.delta) >= 0 ? 'green' : 'red'}">${Number(x.delta) >= 0 ? '+' : ''}${x.delta} → ${x.balance}</b></div>`).join('') : '<p class="muted">No points yet.</p>'; }
      catch (err) { box.innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
    }
  });

  /* ================= Gifts and requests ================= */
  let gifts = [], reds = [];
  async function loadGiftsAll() {
    try { gifts = (await call('list_gifts')).gifts; renderGifts(); } catch (err) { $('#glist').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
    try { reds = (await call('list_redemptions')).redemptions; renderReds(); } catch (err) { $('#rlist').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
  }
  function renderGifts() {
    gifts.sort((a, b) => (Number(a.sort) || 99) - (Number(b.sort) || 99));
    $('#glist').innerHTML = gifts.length ? gifts.map(g => `<div class="agift" data-gid="${esc(g.id)}"><span class="th">${thumb(g.image)}</span>
      <div class="nm"><b>${esc(g.name)}</b><div class="muted">${esc(g.nameHi || '')}</div></div>
      <span class="chip-pts">${esc(g.points)} pts</span><span class="muted">${g.stock === '' || g.stock == null ? 'No limit' : 'Stock ' + esc(g.stock)}</span>
      <label class="sw sm"><input type="checkbox" data-gact${bool(g.active, false) ? ' checked' : ''}>In app</label>
      <button class="btn sm ghost" data-gedit>Edit</button></div>`).join('') : '<p class="muted">No gifts yet. Add the gifts customers can get for points.</p>';
  }
  function renderReds() {
    const open = reds.filter(r => r.status === 'Requested').length;
    $('#n-gifts').textContent = open || '';
    $('#rlist').innerHTML = reds.length ? reds.slice(0, 60).map(r => `<div class="areq${r.status === 'Requested' ? ' req' : ''}" data-rid="${esc(r.redeemId)}">
      <div><b>${esc(r.giftName)}</b> · ${esc(r.points)} pts<div class="muted">${esc(r.name)} · ${esc(r.phone)} · ${esc(when(r.createdAt))} · ${esc(r.redeemId)}</div></div>
      ${r.status === 'Requested' ? `<div class="btns"><button class="btn sm gold" data-rs="Given">Mark given</button><button class="btn sm danger" data-rs="Rejected">Reject and refund</button></div>` : `<span class="badge b-${esc(r.status)}">${r.status === 'Rejected' ? 'Refunded' : esc(r.status)}</span>`}</div>`).join('')
      : '<p class="muted">No gift requests yet.</p>';
  }
  $('#gadd').addEventListener('click', () => openGift(null));
  $('#glist').addEventListener('click', e => { const b = e.target.closest('[data-gedit]'); if (b) openGift(gifts.find(g => String(g.id) === b.closest('[data-gid]').dataset.gid)); });
  $('#glist').addEventListener('change', async e => {
    if (!e.target.matches('[data-gact]')) return;
    const g = gifts.find(x => String(x.id) === e.target.closest('[data-gid]').dataset.gid);
    try { gifts = (await call('save_gifts', { items: [{ ...g, active: e.target.checked }] })).gifts; renderGifts(); toast(e.target.checked ? 'Gift shown in app' : 'Gift hidden'); }
    catch (err) { alert(err.message); e.target.checked = !e.target.checked; }
  });
  $('#rlist').addEventListener('click', async e => {
    const b = e.target.closest('[data-rs]'); if (!b) return;
    const r = reds.find(x => x.redeemId === b.closest('[data-rid]').dataset.rid);
    if (!confirm(b.dataset.rs === 'Given' ? `Mark “${r.giftName}” as given to ${r.name}?` : `Reject and give ${r.points} points back to ${r.name}?`)) return;
    try { await call('set_redemption', { redeemId: r.redeemId, status: b.dataset.rs }); r.status = b.dataset.rs; renderReds(); toast('Updated'); } catch (err) { alert(err.message); }
  });

  /* ================= Settings ================= */
  const SET = [['pointsPer100', 'Points for every ₹100 (items without their own points)', 'number'], ['welcomePoints', 'Welcome points for a new account', 'number'],
    ['notice', 'Message at the top of the app (English)'], ['noticeHi', 'Message at the top of the app (Hindi)'],
    ['deliveryNote', 'Delivery note at checkout (English)'], ['deliveryNoteHi', 'Delivery note at checkout (Hindi)']];
  async function loadSettings() {
    try {
      const rows = (await call('get_settings')).settings, v = {}; rows.forEach(r => { v[r.key] = r.value; });
      $('#sf').innerHTML = SET.map(([k, l, ty]) => `<div class="field"><label for="s-${k}">${esc(l)}</label><input id="s-${k}" name="${k}" ${ty === 'number' ? 'type="number" min="0" step="0.1"' : 'maxlength="300"'} value="${esc(v[k] ?? '')}"></div>`).join('') +
        `<p class="muted" style="margin-bottom:12px">Example: with 1 point per ₹100, a ₹25,000 order gives 250 points. Points are added when you mark the order Delivered.</p><button class="btn">Save settings</button>`;
    } catch (err) { $('#sf').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
  }
  $('#sf').addEventListener('submit', async e => {
    e.preventDefault();
    const b = $('#sf .btn'); b.disabled = true;
    try { await call('save_settings', { settings: Object.fromEntries(new FormData($('#sf'))) }); toast('Settings saved'); } catch (err) { alert(err.message); }
    b.disabled = false;
  });

  if (key) start();
})();
