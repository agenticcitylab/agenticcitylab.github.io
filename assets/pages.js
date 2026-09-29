/* News and People pages: tappable cards that open a detail dialog; #id in the address opens an item directly. */
(function(){
  const ACL = window.ACL = window.ACL || {};
  const E = s => ACL.esc(s);
  ACL.IMG = window.ACL_IMG || 'img/';
  const KIND = { Award: 'award', Paper: 'paper', Preprint: 'paper', Data: 'data', Talk: 'talk' };
  const PLURAL = { Award: 'Awards', Paper: 'Papers', Preprint: 'Preprints', Data: 'Data', Talk: 'Talks' };

  const tid = dlg => (dlg.id || 'dlg') + '-title';
  const copyTo = (b, text, done, back) => { try { navigator.clipboard.writeText(text).then(() => { b.textContent = done; if (back) setTimeout(() => b.textContent = back, 1600); }); } catch(_){ b.textContent = text; } };
  /* on a page that lists the items (News, People) the card behind an item opened from a link is brought into view and marked */
  const reveal = (grid, sel) => { const c = grid && grid.querySelector(sel); if (!c) return; if (c.hidden) c.hidden = false;
    c.scrollIntoView({ block: 'center' }); c.classList.add('seen'); setTimeout(() => c.classList.remove('seen'), 2600); };

  /* ---------- News ---------- */
  function newsVisual(n, D, big){
    const pr = n.project && D.projects.find(p => p.id === n.project), fig = pr && pr.fig && D.figures[pr.fig];
    if (!big && n.photos && n.photos.length) return `<img src="${ACL.IMG}${n.photos[0].src}" alt="${E(n.photos[0].cap)}" loading="lazy">`;
    if (n.geo && ACL.placeCard) return ACL.placeCard(n.geo, { kind: n.kind, label: n.place, sub: big ? n.event : '', aspect: big ? 1 : 4 / 3 });
    if (fig) return `<img src="${ACL.FIG}${pr.fig}${big ? '-full' : ''}.jpg" alt="${E(fig.cap)}" loading="lazy">`;
    return `<div class="fig-empty">${ACL.glyph(pr ? pr.theme : 'agentic')}</div>`;
  }
  /* dialog gallery: every photo, then the map card for events */
  function gallery(n, D, el){
    const items = (n.photos || []).map(p => ({ html: `<img src="${ACL.IMG}${p.src}" alt="${E(p.cap)}">`, cap: p.cap, thumb: `<img src="${ACL.IMG}${p.src}" alt="">` }));
    if (n.geo) items.push({ html: newsVisual(Object.assign({}, n, { photos: [] }), D, true), cap: n.place + (n.event ? ' · ' + n.event : ''), thumb: '<span class="gmap">Map</span>' });
    if (items.length < 2){ el.innerHTML = items.length ? `<div class="gmain">${items[0].html}</div>${n.photos && n.photos.length ? `<p class="gcap">${E(items[0].cap)}</p>` : ''}` : newsVisual(n, D, true); return; }
    el.innerHTML = `<div class="gmain"></div><p class="gcap"></p><div class="gthumbs">${items.map((it, i) => `<button type="button" data-i="${i}" aria-label="Show image ${i + 1}">${it.thumb}</button>`).join('')}</div>`;
    const main = el.querySelector('.gmain'), cap = el.querySelector('.gcap'), th = el.querySelectorAll('.gthumbs button');
    const pick = i => { main.innerHTML = items[i].html; cap.textContent = items[i].cap; th.forEach((b, j) => b.setAttribute('aria-pressed', i === j)); };
    th.forEach(b => b.addEventListener('click', () => pick(+b.dataset.i))); pick(0);
  }
  /* News item dialog. full:true on the News page (facts, publication, share link); elsewhere a short preview whose
     "Full details" button opens the item on the News page, and whose project button opens the project on this page. */
  ACL.newsDialog = function(opt){
    const D = opt.D, dlg = opt.dialog, PUB = Object.fromEntries(D.pubs.map(p => [p.id, p]));
    const fig = dlg.querySelector('.proj-fig'), body = dlg.querySelector('.proj-body');
    dlg.setAttribute('aria-labelledby', tid(dlg));
    const open = (id, o) => { const n = D.news.find(x => x.id === id); if (!n) return false;
      const p = n.pub && PUB[n.pub], pr = n.project && D.projects.find(x => x.id === n.project);
      const proj = pr ? (opt.onProject ? `<button type="button" class="btn" data-proj="${pr.id}">Project: ${E(pr.title)}</button>`
                                       : `<a class="btn" href="${opt.lab}#${pr.id}">Project: ${E(pr.title)} →</a>`) : '';
      gallery(n, D, fig);
      const head = `<span class="nmeta"><span class="kind k-${KIND[n.kind] || 'data'}">${E(n.kind)}</span><span class="mono num">${E(n.date)}</span></span>
        <h3 id="${tid(dlg)}">${E(n.title)}</h3><p>${E(n.brief || n.text)}</p>`;
      body.innerHTML = opt.full
        ? `${head}
          ${n.event || n.rank || n.jury ? `<dl class="facts">${n.event ? `<dt>Event</dt><dd>${E(n.event)}</dd>` : ''}${n.place ? `<dt>Place</dt><dd>${E(n.place)}</dd>` : ''}${n.rank ? `<dt>Result</dt><dd>${E(n.rank)}</dd>` : ''}${n.jury ? `<dt>Jury</dt><dd>${E(n.jury)}</dd>` : ''}</dl>` : ''}
          ${p ? `<div><span class="mono meta">Publication</span>${ACL.pubHTML(p)}</div>` : ''}
          <div class="proj-links">${proj}<button type="button" class="btn" data-share>Copy link</button></div>`
        : `${head}${n.event || n.place ? `<span class="mono meta">${E([n.event, n.place].filter(Boolean).join(' · '))}</span>` : ''}
          <div class="proj-links"><a class="btn solid" href="${opt.newsHref}#${n.id}">Full details →</a>${proj}</div>`;
      const sh = body.querySelector('[data-share]');
      if (sh) sh.addEventListener('click', () => copyTo(sh, new URL(opt.newsHref || location.href, location.href).href.split('#')[0] + '#' + n.id, 'Link copied'));
      const pb = body.querySelector('[data-proj]');
      if (pb) pb.addEventListener('click', () => opt.onProject(pb.dataset.proj));
      ACL.openModal(dlg, o); return true; };
    return { open };
  };

  ACL.newsPage = function(opt){
    const D = opt.D, grid = opt.grid;
    const kinds = [...new Set(D.news.map(n => n.kind))];
    grid.innerHTML = D.news.map(n => `<button type="button" class="ncard" data-id="${n.id}" data-kind="${n.kind}">
        <span class="nimg">${newsVisual(n, D, false)}</span>
        <span class="nmeta"><span class="kind k-${KIND[n.kind] || 'data'}">${E(n.kind)}</span><span class="mono num">${E(n.date)}</span></span>
        <span class="nt">${E(n.title)}</span><span class="nb">${E(n.brief || n.text)}</span></button>`).join('');
    if (opt.chips){
      opt.chips.innerHTML = `<button type="button" class="chip" data-k="all" aria-pressed="true">All <span class="num meta">${D.news.length}</span></button>`
        + kinds.map(k => `<button type="button" class="chip" data-k="${k}" aria-pressed="false"><i class="kdot k-${KIND[k] || 'data'}"></i>${E(PLURAL[k] || k)} <span class="num meta">${D.news.filter(n => n.kind === k).length}</span></button>`).join('');
      opt.chips.addEventListener('click', e => { const b = e.target.closest('.chip'); if (!b) return;
        opt.chips.querySelectorAll('.chip').forEach(c => c.setAttribute('aria-pressed', c === b));
        grid.querySelectorAll('.ncard').forEach(c => c.hidden = !(b.dataset.k === 'all' || c.dataset.kind === b.dataset.k)); });
    }
    const nd = ACL.newsDialog({ D, dialog: opt.dialog, full: true, lab: opt.lab, newsHref: opt.news || location.pathname });
    grid.addEventListener('click', e => { const c = e.target.closest('.ncard'); if (c) nd.open(c.dataset.id, { hash: c.dataset.id }); });
    const fromHash = () => { const h = location.hash.slice(1); if (!h || opt.dialog.open || !D.news.some(n => n.id === h)) return;
      reveal(grid, `.ncard[data-id="${h}"]`); nd.open(h, { hash: h, deep: true }); };
    fromHash(); window.addEventListener('hashchange', fromHash);
    return nd;
  };

  /* ---------- People ---------- */
  /* Person dialog. Outside the People page it also offers a link to that page. */
  ACL.personDialog = function(opt){
    const D = opt.D, dlg = opt.dialog, link = u => u === 'HOME' ? opt.home : u;
    const fig = dlg.querySelector('.proj-fig'), body = dlg.querySelector('.proj-body');
    dlg.setAttribute('aria-labelledby', tid(dlg));
    const open = (id, o) => { const p = D.people.find(x => x.id === id); if (!p) return false;
      fig.innerHTML = `<img class="mphoto" src="${ACL.IMG}${p.photo}" alt="${E(p.name)}">`;
      body.innerHTML = `<span class="mono meta">${E(p.role)}</span><h3 id="${tid(dlg)}">${E(p.name)}</h3><span class="mtitle">${E(p.title)} · ${E(p.place)}</span>
        ${p.bio.map(t => `<p>${E(t)}</p>`).join('')}
        <div><span class="mono meta">Research interests</span><div class="ints">${p.interests.map(t => `<span>${E(t)}</span>`).join('')}</div></div>
        ${p.id === 'chengbo' && D.education ? `<div><span class="mono meta">Education</span><ul class="edu">${D.education.map(e => `<li><span class="mono num">${E(e.years)}</span><span><b>${E(e.degree)}</b>${E(e.school)}</span></li>`).join('')}</ul></div>` : ''}
        <div class="proj-links">${opt.peopleHref ? `<a class="btn solid" href="${opt.peopleHref}">People page →</a>` : ''}${p.links.map(l => `<a class="btn" href="${link(l.url)}"${l.url === 'HOME' ? '' : ' target="_blank" rel="noopener"'}>${E(l.label)}${l.url === 'HOME' ? ' →' : ' ↗'}</a>`).join('')}</div>
        <div class="copy"><code>${E(p.email)}</code><button type="button" data-copy="${E(p.email)}">Copy</button></div>`;
      body.querySelectorAll('[data-copy]').forEach(b => b.addEventListener('click', () => copyTo(b, b.dataset.copy, 'Copied', 'Copy')));
      ACL.openModal(dlg, o); return true; };
    return { open };
  };

  ACL.peoplePage = function(opt){
    const D = opt.D, grid = opt.grid;
    grid.innerHTML = D.people.map(p => `<button type="button" class="member" data-id="${p.id}">
        <span class="mph"><img src="${ACL.IMG}${p.photo}" alt="${E(p.name)}" loading="lazy"></span>
        <span class="mrole mono">${E(p.role)}</span><span class="mname">${E(p.name)}</span><span class="mtitle">${E(p.title)}</span><span class="nb">${E(p.brief)}</span>
        <span class="more">Profile →</span></button>`).join('');
    const pd = ACL.personDialog({ D, dialog: opt.dialog, home: opt.home });
    grid.addEventListener('click', e => { const c = e.target.closest('.member'); if (c) pd.open(c.dataset.id, { hash: c.dataset.id }); });
    const fromHash = () => { const h = location.hash.slice(1); if (!h || opt.dialog.open || !D.people.some(p => p.id === h)) return;
      reveal(grid, `.member[data-id="${h}"]`); pd.open(h, { hash: h, deep: true }); };
    fromHash(); window.addEventListener('hashchange', fromHash);
    return pd;
  };
})();
