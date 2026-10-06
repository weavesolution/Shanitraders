/* Shani Traders — master control */
(() => {
  'use strict';
  const { $, $$, esc, inr, CATS, api, toast, num, norm, cat, svg, S, waLink } = ST;
  const KKEY = 'st_admin_key';
  let key = sessionStorage.getItem(KKEY) || '';
  let products = [], dirty = {}, enquiries = [];
  const view = { q: '', cat: 'all', show: 'all' };
  $('#s-ico').outerHTML = svg('search');

  /* ---------- Sign in ---------- */
  const lmsg = t => { $('#lmsg').innerHTML = t ? `<p class="msg err">${t}</p>` : ''; };
  if (!S.apiUrl) lmsg('Paste the Apps Script Web App URL into config.js (apiUrl) to use master control.');
  $('#lf').addEventListener('submit', async e => {
    e.preventDefault();
    const k = $('#key').value.trim(); if (!k) return;
    const b = $('#lf button'); b.disabled = true; b.textContent = 'Signing in…';
    try { await api({ action: 'admin_login', key: k }); key = k; sessionStorage.setItem(KKEY, k); start(); }
    catch (err) { lmsg(esc(err.message)); }
    b.disabled = false; b.textContent = 'Sign in';
  });
  $('#logout').addEventListener('click', () => {
    if (Object.keys(dirty).length && !confirm('You have unsaved changes. Sign out anyway?')) return;
    sessionStorage.removeItem(KKEY); location.reload();
  });
  function start() {
    $('#login').hidden = true; $('#app').hidden = false; $('#logout').hidden = false;
    loadItems(); loadEnq();
  }
  const call = body => api({ ...body, key }).catch(err => {
    if (/admin key/i.test(err.message)) { sessionStorage.removeItem(KKEY); alert('Session ended. Sign in again.'); location.reload(); }
    throw err;
  });

  /* ---------- Tabs ---------- */
  $('.tabs').addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (!t) return;
    $$('.tab').forEach(x => x.setAttribute('aria-selected', x === t));
    $('#tab-items').hidden = t.dataset.tab !== 'items';
    $('#tab-enq').hidden = t.dataset.tab !== 'enq';
  });

  /* ---------- Items ---------- */
  const allCats = () => [...new Set([...CATS.map(c => c.id), ...products.map(p => p.category).filter(Boolean)])];
  function fillCats() {
    $('#acat').innerHTML = '<option value="all">All categories</option>' + allCats().map(id => `<option value="${esc(id)}">${esc(cat(id).name)}</option>`).join('');
    $('#acat').value = allCats().includes(view.cat) ? view.cat : 'all';
    $('#p-cat').innerHTML = allCats().map(id => `<option value="${esc(id)}">${esc(cat(id).name)}</option>`).join('') + '<option value="__new">New category…</option>';
  }
  async function loadItems() {
    try {
      const r = await call({ action: 'admin_products' });
      setProducts(r.products);
    } catch (err) { $('#alist').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
  }
  function setProducts(list) {
    products = list.map(norm).filter(p => p.id).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
    dirty = {}; fillCats(); renderItems(); bar();
    try { localStorage.removeItem('st_products_v1'); } catch (e) { }
  }
  const cur = p => ({ ...p, ...(dirty[p.id] || {}) });
  function renderItems() {
    $('#n-items').textContent = products.length;
    if (!products.length) {
      $('#alist').innerHTML = `<div class="empty"><p>No items yet. Add your first item, or load a starter list of common items (no prices) and fill in your rates.</p>
        <button class="btn btn-dark" id="starter">Load starter items</button></div>`;
      $('#starter').onclick = loadStarter; return;
    }
    const w = view.q.toLowerCase().split(/\s+/).filter(Boolean);
    const list = products.map(cur).filter(p =>
      (view.cat === 'all' || p.category === view.cat) &&
      (view.show === 'all' || (view.show === 'in' && p.inStock) || (view.show === 'out' && !p.inStock) ||
        (view.show === 'hidden' && !p.visible) || (view.show === 'noprice' && p.price === '')) &&
      w.every(x => (p.name + ' ' + p.brand + ' ' + p.tags).toLowerCase().includes(x)));
    $('#alist').innerHTML = list.length ? list.map(p => `<div class="arow${dirty[p.id] ? ' dirty' : ''}${p.visible ? '' : ' is-hidden'}" data-id="${esc(p.id)}">
      <div class="nm"><b>${esc(p.name)}</b><small>${esc([p.brand, 'per ' + p.unit, cat(p.category).name].filter(Boolean).join(', '))}</small><small style="display:block">Photo: ${esc(p.id)}.jpg</small></div>
      <label class="pr"><span class="sr">Price of ${esc(p.name)}</span>₹<input type="number" min="0" step="0.01" inputmode="decimal" data-f="price" value="${p.price}" placeholder="Ask"></label>
      <label class="sw"><input type="checkbox" data-f="inStock"${p.inStock ? ' checked' : ''}>In stock</label>
      <label class="sw"><input type="checkbox" data-f="visible"${p.visible ? ' checked' : ''}>On site</label>
      <button class="btn btn-sm btn-ghost" data-edit>Edit</button></div>`).join('')
      : '<div class="empty"><p>No items match these filters.</p></div>';
  }
  $('#alist').addEventListener('input', e => {
    const f = e.target.dataset.f; if (!f) return;
    const row = e.target.closest('.arow'), id = row.dataset.id;
    const orig = products.find(p => p.id === id);
    const val = e.target.type === 'checkbox' ? e.target.checked : num(e.target.value);
    const d = dirty[id] || {};
    if (val === orig[f]) delete d[f]; else d[f] = val;
    if (Object.keys(d).length) dirty[id] = d; else delete dirty[id];
    row.classList.toggle('dirty', !!dirty[id]);
    if (f === 'visible') row.classList.toggle('is-hidden', !val);
    bar();
  });
  $('#alist').addEventListener('click', e => { const b = e.target.closest('[data-edit]'); if (b) openDlg(cur(products.find(p => p.id === b.closest('.arow').dataset.id))); });
  $('#aq').addEventListener('input', e => { view.q = e.target.value; renderItems(); });
  $('#acat').addEventListener('change', e => { view.cat = e.target.value; renderItems(); });
  $('#ashow').addEventListener('change', e => { view.show = e.target.value; renderItems(); });

  function bar() {
    const n = Object.keys(dirty).length;
    $('#dcount').textContent = n + (n === 1 ? ' item changed' : ' items changed');
    $('#savebar').classList.toggle('show', n > 0);
  }
  $('#discard').addEventListener('click', () => { dirty = {}; renderItems(); bar(); });
  $('#save').addEventListener('click', async () => {
    const items = Object.keys(dirty).map(id => ({ ...products.find(p => p.id === id), ...dirty[id] }));
    const b = $('#save'); b.disabled = true; b.textContent = 'Saving…';
    try { const r = await call({ action: 'save_products', items }); setProducts(r.products); toast(`Saved ${items.length} ${items.length === 1 ? 'item' : 'items'}. The site updates within a few minutes.`); }
    catch (err) { alert('Not saved: ' + err.message); }
    b.disabled = false; b.textContent = 'Save changes';
  });
  window.addEventListener('beforeunload', e => { if (Object.keys(dirty).length) { e.preventDefault(); e.returnValue = ''; } });

  async function loadStarter() {
    const b = $('#starter'); b.disabled = true; b.textContent = 'Loading…';
    try {
      const j = await (await fetch('starter-items.json', { cache: 'no-store' })).json();
      const r = await call({ action: 'save_products', items: j.products });
      setProducts(r.products); toast('Starter items added. Fill in your prices and stock.');
    } catch (err) { alert('Could not load starter items: ' + err.message); b.disabled = false; b.textContent = 'Load starter items'; }
  }

  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'item';
  function newId(name) {
    const base = slug(name); let id = base, n = 2;
    while (products.some(p => p.id === id)) id = base + '-' + n++;
    return id;
  }
  /* ---------- Item dialog ---------- */
  const dlg = $('#dlg'), pf = $('#pf');
  function openDlg(p) {
    fillCats();
    const isNew = !p;
    p = p || { id: '', name: '', category: view.cat !== 'all' ? view.cat : CATS[0].id, brand: '', unit: '', price: '', mrp: '', description: '', image: '', tags: '', inStock: true, visible: true, featured: false, sort: '' };
    $('#dtitle').textContent = isNew ? 'Add item' : 'Edit item';
    $('#pdel').hidden = isNew;
    $('#pcode').textContent = isNew ? 'Item code and photo name are set when you save.' : `Item code: ${p.id}. Photo file: images/${p.id}.jpg`;
    ['id', 'name', 'brand', 'unit', 'price', 'mrp', 'description', 'image', 'tags'].forEach(k => { pf.elements[k].value = p[k] ?? ''; });
    pf.elements.sort.value = p.sort === 999 ? '' : p.sort;
    pf.elements.category.value = p.category;
    ['inStock', 'visible', 'featured'].forEach(k => { pf.elements[k].checked = !!p[k]; });
    dlg.showModal(); pf.elements.name.focus();
  }
  $('#add').addEventListener('click', () => openDlg(null));
  $$('[data-close]', dlg).forEach(b => b.addEventListener('click', () => dlg.close()));
  $('#p-cat').addEventListener('change', e => {
    if (e.target.value !== '__new') return;
    const n = (prompt('New category code (one word, e.g. glass)') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!n) { e.target.value = CATS[0].id; return; }
    const o = document.createElement('option'); o.value = n; o.textContent = n;
    e.target.insertBefore(o, e.target.lastElementChild); e.target.value = n;
  });
  pf.addEventListener('submit', async e => {
    e.preventDefault();
    const el = pf.elements;
    if (!el.name.value.trim() || !el.unit.value.trim()) { alert('Item name and "Sold per" are required.'); return; }
    const item = {
      id: el.id.value || newId(el.name.value), name: el.name.value.trim(), category: el.category.value, brand: el.brand.value.trim(), unit: el.unit.value.trim(),
      price: num(el.price.value), mrp: num(el.mrp.value), description: el.description.value.trim(), image: el.image.value.trim(),
      tags: el.tags.value.trim(), inStock: el.inStock.checked, visible: el.visible.checked, featured: el.featured.checked,
      sort: el.sort.value === '' ? 999 : Number(el.sort.value)
    };
    const b = $('#psave'); b.disabled = true; b.textContent = 'Saving…';
    try {
      const keep = { ...dirty }; delete keep[item.id];
      const r = await call({ action: 'save_products', items: [item] });
      setProducts(r.products); dirty = keep; renderItems(); bar();
      dlg.close(); toast(`${item.name} saved. Photo name: ${item.id}.jpg`);
    } catch (err) { alert('Not saved: ' + err.message); }
    b.disabled = false; b.textContent = 'Save item';
  });
  $('#pdel').addEventListener('click', async () => {
    const id = pf.elements.id.value, name = pf.elements.name.value;
    if (!confirm(`Delete "${name}" permanently?\nTip: switch off "Show on site" instead if you may sell it again.`)) return;
    try {
      await call({ action: 'delete_product', id });
      products = products.filter(p => p.id !== id); delete dirty[id];
      renderItems(); bar(); dlg.close(); toast(`${name} deleted`);
      try { localStorage.removeItem('st_products_v1'); } catch (e) { }
    } catch (err) { alert('Not deleted: ' + err.message); }
  });

  /* ---------- Enquiries ---------- */
  async function loadEnq() {
    $('#elist').innerHTML = '<p>Loading enquiries…</p>';
    try { const r = await call({ action: 'list_enquiries' }); enquiries = r.enquiries; renderEnq(); }
    catch (err) { $('#elist').innerHTML = `<p class="msg err">${esc(err.message)}</p>`; }
  }
  function renderEnq() {
    $('#n-new').textContent = enquiries.filter(x => x.status === 'New').length;
    const f = $('#estat').value;
    const list = enquiries.filter(x => f === 'all' || x.status === f);
    $('#elist').innerHTML = list.length ? list.map(x => {
      const d = x.timestamp ? new Date(x.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
      const ph = String(x.phone || '');
      return `<article class="ecard${x.status === 'New' ? ' new' : ''}" data-eid="${esc(x.enquiryId)}">
        <div class="ecard-top"><div><b>${esc(x.name)}</b><div class="muted">${esc([x.place, x.delivery, d].filter(Boolean).join(', '))}</div></div>
          <span class="muted">${esc(x.enquiryId)}</span></div>
        ${x.items ? `<pre>${esc(x.items)}</pre>` : ''}${x.message ? `<p>${esc(x.message)}</p>` : ''}
        <div class="acts">
          <a class="btn btn-sm btn-dark" href="tel:+91${esc(ph)}">Call ${esc(ph)}</a>
          <a class="btn btn-sm btn-wa" target="_blank" rel="noopener" href="https://wa.me/91${esc(ph)}?text=${encodeURIComponent('Namaste ' + x.name + ', this is ' + S.name + ' about your enquiry ' + x.enquiryId + '.')}">WhatsApp</a>
          <label class="sr" for="st-${esc(x.enquiryId)}">Status</label>
          <select id="st-${esc(x.enquiryId)}" data-status>${['New', 'Contacted', 'Quoted', 'Closed'].map(s => `<option${s === x.status ? ' selected' : ''}>${s}</option>`).join('')}</select>
        </div></article>`;
    }).join('') : '<div class="empty"><p>No enquiries here yet.</p></div>';
  }
  $('#estat').addEventListener('change', renderEnq);
  $('#ereload').addEventListener('click', loadEnq);
  $('#elist').addEventListener('change', async e => {
    if (!e.target.matches('[data-status]')) return;
    const id = e.target.closest('[data-eid]').dataset.eid, status = e.target.value;
    try { await call({ action: 'set_enquiry_status', enquiryId: id, status }); const x = enquiries.find(q => q.enquiryId === id); if (x) x.status = status; renderEnq(); toast('Status updated'); }
    catch (err) { alert('Not updated: ' + err.message); }
  });

  if (key && S.apiUrl) start();
})();
