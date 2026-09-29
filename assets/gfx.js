/* Agentic City Lab — identity marks, route glyphs, project wall + dialog, publication list, UI helpers. */
(function(){
  const ACL = window.ACL = window.ACL || {};
  ACL.rng = function(seed){
    let a = (seed * 2654435761) >>> 0;
    return function(){ a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  };
  ACL.esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  /* ---------- Identity ----------
     people = amber leg, AI agent = blue leg, white = the street they share and the node where they meet. */
  const H = 'var(--human)', A = 'var(--agent)', F = 'var(--fg)', BG = 'var(--bg)', S = 'var(--street)', D = 'var(--gridot)';
  const svg = (b, label, vb) => `<svg viewBox="${vb || '0 0 100 100'}" role="img" aria-label="${label || 'Agentic City Lab'}" xmlns="http://www.w3.org/2000/svg">${b}</svg>`;
  const ln = (p, q, c, w, cap) => `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" style="stroke:${c};stroke-width:${w};stroke-linecap:${cap || 'round'}"/>`;
  const rect = (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" style="fill:${c}"/>`;
  const poly = (pts, c) => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" style="fill:${c}"/>`;
  const dot = (p, r, c) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" style="fill:${c}"/>`;
  const ring = (p, w) => `<circle cx="${p[0]}" cy="${p[1]}" r="${(w*0.9).toFixed(2)}" style="fill:${BG};stroke:${F};stroke-width:${(w*0.3).toFixed(2)}"/>` + dot(p, (w*0.36).toFixed(2), A);

  const MARKS = {
    /* 1 · Compass A — two legs lean into one node, the street is the crossbar. */
    compassA: { name: 'Compass A', kind: 'A', mark: o => svg(ln([18,90],[50,16],H,15,'butt') + ln([50,16],[82,90],A,15,'butt') + rect(31,58,38,9,F) + dot([50,16],9.3,F), o && o.label) },
    /* 2 · Stencil A — two solid legs with a gap at the apex: the space where people and agents meet. */
    stencilA: { name: 'Stencil A', kind: 'A', mark: o => svg(poly([[6,94],[28,94],[47.5,24],[47.5,8],[37.4,8]],H) + poly([[94,94],[72,94],[52.5,24],[52.5,8],[62.6,8]],A) + rect(30,60,40,10,F), o && o.label) },
    /* 3 · Path ACL — the three letters drawn as routes; the A is the compass, the L ends at an agent node. */
    aclPath: { name: 'Path ACL', kind: 'ACL', mark: o => {
      const w = 9, r = 22, c = [76, 32], a1 = -Math.PI*0.28, a2 = Math.PI*0.28;
      return svg(ln([6,56],[24,8],H,w) + ln([24,8],[42,56],A,w) + ln([13.5,38],[34.5,38],F,w*0.55,'butt') + dot([24,8],w*0.55,F)
        + `<path d="M${(c[0]+r*Math.cos(a1)).toFixed(2)} ${(c[1]+r*Math.sin(a1)).toFixed(2)} A${r} ${r} 0 1 0 ${(c[0]+r*Math.cos(a2)).toFixed(2)} ${(c[1]+r*Math.sin(a2)).toFixed(2)}" style="fill:none;stroke:${F};stroke-width:${w};stroke-linecap:round"/>`
        + ln([112,8],[112,56],F,w) + ln([112,56],[138,56],F,w) + dot([138,56],w*0.55,A), o && o.label, '0 0 146 64'); } },
    /* 4 · Stencil ACL (selected, refined in v4) — see STENCIL below. */
    aclStencil: { name: 'Stencil ACL', kind: 'ACL', mark: o => svg(stencilBody(), o && o.label, `0 0 ${ST.w} ${ST.h}`) },
    /* Version 3 of option 4, kept only for the before/after on the identity page. */
    aclStencilV3: { name: 'Stencil ACL v3', kind: 'ACL', hidden: true, mark: o => svg(
        poly([[0,36],[11,36],[15.5,7],[15.5,0],[11,0]],H) + poly([[34,36],[23,36],[18.5,7],[18.5,0],[23,0]],A) + rect(8.5,22,17,5,F)
      + rect(42,0,10,36,F) + rect(54,0,14,10,F) + rect(54,26,14,10,F)
      + rect(76,0,10,24,F) + rect(76,26,26,10,F), o && o.label, '0 0 102 36') }
  };

  /* Stencil ACL construction: one cap height (40), one stroke (10), one vertical stencil cut (3).
     A: split at the apex into a human leg (amber) and an agent leg (blue) with parallel edges; the white bar is where they meet.
     C: a half ring with two arms, cut where the curve meets the arms. L: a stem and a foot, cut the same way. */
  const ST = { h: 40, t: 10, g: 3, aw: 48, ax: 18, ad: 10.5, bar: 24, bh: 9.5, cw: 40, lw: 31, sAC: 4, sCL: 5 };
  ST.cx = ST.aw + ST.sAC; ST.lx = ST.cx + ST.cw + ST.sCL; ST.w = ST.lx + ST.lw;
  const r2 = v => +v.toFixed(2);
  const pp = (pts, c, x0) => poly(pts.map(([x, y]) => [r2(x + (x0 || 0)), r2(y)]), c);
  function stencilA(x0){
    const { h, g, aw, ax, ad, bar, bh } = ST, k = ax / h, hw = ad * Math.hypot(1, k), m = aw / 2 - g / 2;
    const ys = h - (m - hw) / k, ix = y => hw + k * (h - y), y2 = bar + bh;
    const leg = [[0, h], [hw, h], [m, ys], [m, 0], [ax, 0]], mir = leg.map(([x, y]) => [aw - x, y]);
    /* the bar runs 0.8 under each leg so no hairline shows between the colours */
    const b = [[ix(bar) - .8, bar], [aw - ix(bar) + .8, bar], [aw - ix(y2) + .8, y2], [ix(y2) - .8, y2]];
    return pp(b, F, x0) + pp(leg, H, x0) + pp(mir, A, x0);
  }
  function stencilBody(){
    const { h, t, g, cx, cw, lx, lw } = ST, R = h / 2, c = cx + R;
    return stencilA(0)
      + `<path d="M${c} 0A${R} ${R} 0 0 0 ${c} ${h}V${h - t}A${R - t} ${R - t} 0 0 1 ${c} ${t}Z" style="fill:${F}"/>`
      + rect(c + g, 0, cx + cw - c - g, t, F) + rect(c + g, h - t, cx + cw - c - g, t, F)
      + rect(lx, 0, t, h, F) + rect(lx + t + g, h - t, lw - t - g, t, F);
  }
  ACL.STENCIL = ST;
  /* The A alone, for favicons, avatars and anything under about 20 px tall. */
  ACL.monogram = o => svg(stencilA(0), (o && o.label) || 'Agentic City Lab', `0 0 ${ST.aw} ${ST.h}`);

  ACL.MARKS = MARKS;
  ACL.MARK = ACL.MARK || 'aclStencil';
  ACL.mark = o => MARKS[(o && o.concept) || ACL.MARK].mark(o);
  ACL.lockup = function(o){ const k = (o && o.concept) || ACL.MARK, m = MARKS[k];
    return `<span class="lockup-mark${m.kind === 'ACL' ? ' is-acl' : ''}">${m.mark()}</span><span class="wm">agentic<br>city lab.</span>`; };

  /* Route glyphs: drawn on a 5×5 grid of intersections (grey), human path amber, agent path blue, one meeting node. */
  const G = i => 12 + i*19;
  const gridDots = () => { let s = ''; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) s += dot([G(i), G(j)], 1.7, D); return s; };
  const pl = (pts, c, w) => `<polyline points="${pts.map(([i,j]) => [G(i), G(j)].join(',')).join(' ')}" style="fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round"/>`;
  ACL.glyph = function(id, o){ o = o || {}; const w = 11; let s = gridDots();
    if (id === 'mobility') s += ln([G(0),G(2)],[G(4),G(2)],S,w*1.1,'butt') + pl([[1,4],[1,1],[3,1],[3,3]],H,w) + pl([[3,3],[3,4]],A,w) + ring([G(3),G(3)],w);
    else if (id === 'networks') s += ln([G(0),G(1)],[G(4),G(1)],S,w*1.1,'butt') + ln([G(3),G(0)],[G(3),G(4)],S,w*1.1,'butt') + pl([[0,2],[2,2],[2,4]],H,w) + pl([[2,0],[2,2],[4,2]],A,w) + ring([G(2),G(2)],w);
    else s += ln([G(0),G(1)],[G(4),G(1)],S,w*1.1,'butt') + pl([[0,2],[1,3]],H,w) + pl([[0,4],[2,2],[4,0]],A,w) + ring([G(1),G(3)],w);
    return svg(s, o.label || ''); };
  ACL.variant = function(i){ const w = 11, dirs = [[-1,1],[1,1],[1,-1],[-1,-1],[0,1],[1,0],[0,-1],[-1,0]];
    const pairs = [[0,1],[0,2],[3,1],[4,2],[5,0],[6,1],[7,2],[4,6],[5,7],[0,5],[3,4],[1,6]];
    const [a, b] = pairs[(i-1) % pairs.length], P = [2+dirs[a][0]*2, 2+dirs[a][1]*2], Q = [2+dirs[b][0]*2, 2+dirs[b][1]*2];
    let s = gridDots() + (i % 2 ? ln([G(0),G(2)],[G(4),G(2)],S,w*1.1,'butt') : ln([G(2),G(0)],[G(2),G(4)],S,w*1.1,'butt'));
    return svg(s + ln([G(P[0]),G(P[1])],[G(2),G(2)],H,w) + ln([G(2),G(2)],[G(Q[0]),G(Q[1])],A,w) + ring([G(2),G(2)],w), 'Glyph variation'); };

  /* ---------- Project wall + dialog ---------- */
  ACL.FIG = window.ACL_FIG || 'figures/';
  ACL.figBox = (p, D) => {
    const f = p.fig && D.figures[p.fig];
    return f ? `<div class="fig"><img src="${ACL.FIG}${p.fig}.jpg" alt="${ACL.esc(f.cap)}"></div>` : `<div class="fig fig-empty">${ACL.glyph(p.theme)}</div>`;
  };
  ACL.tileHTML = (p, D) => `<button type="button" class="tile" data-id="${p.id}" data-theme="${p.theme}">${ACL.figBox(p, D)}
      <h3>${ACL.esc(p.title)}</h3><span class="yr num">${ACL.esc(p.years)}${p.status ? `<span class="status">${ACL.esc(p.status)}</span>` : ''}</span></button>`;
  ACL.projects = function(opt){
    const D = opt.D, E = ACL.esc, grid = opt.grid, PUB = Object.fromEntries(D.pubs.map(p => [p.id, p])), TH = Object.fromEntries(D.themes.map(t => [t.id, t]));
    const list = opt.filter ? D.projects.filter(opt.filter) : D.projects;
    grid.innerHTML = list.map(p => ACL.tileHTML(p, D)).join('');
    let theme = 'all', q = '';
    const apply = () => grid.querySelectorAll('.tile').forEach(t => { const p = list.find(x => x.id === t.dataset.id);
      const hay = (p.title + ' ' + p.line + ' ' + p.body + ' ' + p.years).toLowerCase();
      t.hidden = !((theme === 'all' || p.theme === theme) && (!q || hay.includes(q))); });
    if (opt.chips){
      opt.chips.innerHTML = `<button type="button" class="chip" data-k="all" aria-pressed="true">All</button>` + D.themes.map((t, i) =>
        `<button type="button" class="chip" data-k="${t.id}" aria-pressed="false"><span class="gl">${ACL.glyph(t.id)}</span>${E(t.step)}</button>`).join('');
      opt.chips.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return; theme = b.dataset.k;
        opt.chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b)); apply(); });
    }
    if (opt.search) opt.search.addEventListener('input', () => { q = opt.search.value.trim().toLowerCase(); apply(); });
    const dlg = opt.dialog, dfig = dlg.querySelector('.proj-fig'), dbody = dlg.querySelector('.proj-body');
    const open = (id, o) => { const p = D.projects.find(x => x.id === id); if (!p) return; const F = p.fig && D.figures[p.fig];
      dfig.innerHTML = F ? `<img src="${ACL.FIG}${p.fig}-full.jpg" alt="${E(F.cap)}">` : ACL.figBox(p, D);
      dbody.innerHTML = `<span class="mono meta num">${E(p.years)} · ${E(TH[p.theme].name)}</span>
        <h3 id="proj-title">${E(p.title)}</h3><p>${E(p.body)}</p>
        ${p.badge ? `<div><span class="tag award">${E(p.badge)}</span></div>` : ''}${p.status ? `<div><span class="status" style="margin:0">${E(p.status)}</span></div>` : ''}
        ${p.links ? `<div class="proj-links">${p.links.map(l => `<a class="btn" href="${l.url}" target="_blank" rel="noopener">${E(l.label)} ↗</a>`).join('')}</div>` : ''}
        ${p.pubs.length ? `<div><span class="mono meta">Publications</span>${p.pubs.map(id => ACL.pubHTML(PUB[id])).join('')}</div>` : ''}
        ${F ? `<p class="proj-cap">${E(F.cap)}. ${E(F.ref)}.</p>` : ''}`;
      ACL.openModal(dlg, Object.assign({ hash: p.id }, o)); };
    grid.addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) open(t.dataset.id); });
    /* a #project-id in the address opens that project; the tile behind is brought into view, so closing leaves the reader beside it */
    const fromHash = () => { const h = location.hash.slice(1); if (!h || !D.projects.some(p => p.id === h) || dlg.open) return;
      const t = grid.querySelector(`.tile[data-id="${h}"]`); if (t && !t.hidden) t.scrollIntoView({ block: 'center' }); open(h, { deep: true }); };
    fromHash(); window.addEventListener('hashchange', fromHash);
    return { open };
  };

  /* ---------- Modal dialogs ----------
     Every detail view (projects, news, people) opens through here. Opening adds one history entry, so the browser's
     Back button closes the dialog; Close or a click on the backdrop returns to the same page at the same scroll position.
     A dialog opened from a link with #id (deep) adds no entry and removes the #id when it closes.
     Switching from one dialog to another reuses the entry. A link inside a dialog to another page of the site replaces the
     dialog's entry, so Back from that page returns here with the dialog closed and the scroll position kept. */
  const MOD = { cur: null, pushed: false, switching: false };
  function wireModal(dlg){
    if (dlg._aclWired) return; dlg._aclWired = true;
    const x = dlg.querySelector('.xbtn'); if (x) x.addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || a.target || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      let u; try { u = new URL(a.getAttribute('href'), location.href); } catch(_){ return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      e.preventDefault();
      const pushed = MOD.cur === dlg && MOD.pushed; MOD.cur = null; MOD.pushed = false; delete dlg.dataset.deep; dlg.close();
      if (pushed) location.replace(u.href);
      else { if (location.hash) history.replaceState(history.state, '', location.pathname + location.search); location.assign(u.href); }
    });
    dlg.addEventListener('close', () => {
      if (MOD.switching || MOD.cur !== dlg) return;
      MOD.cur = null;
      if (MOD.pushed){ MOD.pushed = false; history.back(); }
      else if (dlg.dataset.deep){ delete dlg.dataset.deep; history.replaceState(history.state, '', location.pathname + location.search); }
    });
  }
  ACL.openModal = function(dlg, o){
    o = o || {}; wireModal(dlg);
    const url = o.hash != null ? location.pathname + location.search + '#' + o.hash : location.href;
    if (MOD.cur && MOD.cur.open){ const prev = MOD.cur; MOD.switching = true; prev.close(); MOD.switching = false; if (prev !== dlg) delete prev.dataset.deep;
      history.replaceState(history.state, '', url); if (!MOD.pushed && o.hash != null) dlg.dataset.deep = 1; }
    else if (o.deep){ MOD.pushed = false; dlg.dataset.deep = 1; }
    else { history.pushState({ aclModal: 1 }, '', url); MOD.pushed = true; delete dlg.dataset.deep; }
    MOD.cur = dlg;
    if (!dlg.open){ if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    dlg.querySelectorAll('.proj-in,.proj-body').forEach(b => b.scrollTop = 0);
  };
  if (window.addEventListener) window.addEventListener('popstate', () => { if (MOD.cur && MOD.cur.open){ const d = MOD.cur; MOD.cur = null; MOD.pushed = false; delete d.dataset.deep; d.close(); } });
  /* plain left clicks on matching links run fn instead of navigating; new-tab and modified clicks still follow the link */
  ACL.onPlainClick = (root, sel, fn) => root.addEventListener('click', e => { const a = e.target.closest(sel);
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); fn(a, e); });

  /* ---------- Publications ---------- */
  ACL.authors = a => ACL.esc(a).replace(/Zhang, C\.(\*?)/, '<b>Zhang, C.$1</b>');
  ACL.pubLink = p => p.doi ? 'https://doi.org/' + p.doi : (p.url || '');
  ACL.pubHTML = function(p){
    const link = ACL.pubLink(p), typeLabel = {journal:'Journal', conference:'Conference', preprint:'Preprint'}[p.type];
    return `<article class="pub"><div style="min-width:0">
        <div class="pub-title">${link ? `<a href="${link}" target="_blank" rel="noopener">${ACL.esc(p.title)}</a>` : ACL.esc(p.title)}</div>
        <div class="pub-auth">${ACL.authors(p.authors)} (${p.inpress ? 'in press' : p.year})</div>
        <div class="pub-venue"><i>${ACL.esc(p.venue)}</i>${p.details ? `, ${ACL.esc(p.details)}` : ''}${p.lang ? ` · ${p.lang}` : ''}${p.note ? ` · ${ACL.esc(p.note)}` : ''}</div>
        ${p.award ? `<div class="pub-extra"><span class="tag award">${ACL.esc(p.award)}</span></div>` : ''}</div>
      <div class="pub-side"><span class="tag">${typeLabel}</span>${link ? `<a class="doi" href="${link}" target="_blank" rel="noopener">${p.doi ? 'DOI ↗' : 'Link ↗'}</a>` : ''}</div></article>`;
  };
  ACL.renderPubs = function(el, pubs, filter){
    const list = pubs.filter(filter || (() => true)), years = [...new Set(list.map(p => p.year))].sort((a, b) => b - a);
    el.innerHTML = list.length ? years.map(y => `<div class="pub-year num">${y}</div>` + list.filter(p => p.year === y).map(ACL.pubHTML).join('')).join('')
      : `<p class="meta" style="padding-block:24px">No publications in this category yet.</p>`;
  };

  /* ---------- UI helpers ---------- */
  ACL.copyButtons = function(){
    document.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => {
      const t = b.getAttribute('data-copy'), done = () => { b.textContent = 'Copied'; setTimeout(() => b.textContent = 'Copy', 1600); };
      try { navigator.clipboard.writeText(t).then(done, () => sel(b)); } catch(e){ sel(b); }
    }));
    function sel(b){ const c = b.parentElement.querySelector('code'); if (!c) return; const r = document.createRange(); r.selectNodeContents(c); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected'; }
  };
  ACL.menu = function(){
    const btn = document.querySelector('.menu-btn'), nav = document.querySelector('.site-nav'); if (!btn || !nav) return;
    btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', o); btn.textContent = o ? 'Close' : 'Menu'; });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); btn.setAttribute('aria-expanded', false); btn.textContent = 'Menu'; }));
  };
  ACL.searchIcon = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="5" style="fill:none;stroke:var(--fg-3);stroke-width:1.6"/><line x1="11" y1="11" x2="15" y2="15" style="stroke:var(--fg-3);stroke-width:1.6;stroke-linecap:round"/></svg>';
})();
