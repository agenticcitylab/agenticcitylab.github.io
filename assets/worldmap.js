/* International network map.
   A world overview (land as a dot matrix, arcs from the lab in Montréal) and four regional plates with labelled,
   hoverable markers: co-author institutions (amber dots, sized by number of institutions), conferences and talks
   (white rings) and the lab's home (blue node). Every count and list comes from ACL_DATA.network and ACL_DATA.talks. */
(function(){
  const ACL = window.ACL = window.ACL || {};
  const E = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const bitsOf = m => { const s = atob(m.mask), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i); return i => (b[i >> 3] >> (i & 7)) & 1; };
  const cityOf = place => place.split(',')[0].trim(), countryOf = place => (place.split(',').pop() || '').trim();
  const year = d => (String(d).match(/\d{4}/) || [''])[0];
  const ORDER = ['gba', 'ea', 'na', 'eu'];                       // most specific plate first
  const inBox = (g, m) => g[1] >= m.lon0 && g[1] <= m.lon1 && g[0] <= m.lat0 && g[0] >= m.lat1;

  function dots(m, VW, VH, w){ const on = bitsOf(m), sx = VW / m.cols, sy = VH / m.rows; let d = '';
    for (let r = 0; r < m.rows; r++) for (let c = 0; c < m.cols; c++) if (on(r * m.cols + c)) d += `M${((c + .5) * sx).toFixed(1)} ${((r + .5) * sy).toFixed(1)}h0`;
    return `<path d="${d}" class="wm-land" style="stroke-width:${w}"/>`; }

  /* one entry per city, carrying every institution and event there */
  function places(D){
    const N = D.network, P = {};
    const get = (city, country, geo) => { const k = city + '|' + country; return P[k] = P[k] || { city, country, geo, orgs: [], events: [] }; };
    N.orgs.forEach(o => get(o.city, o.country, o.geo).orgs.push(o));
    D.talks.filter(t => t.geo).forEach(t => get(cityOf(t.place), countryOf(t.place), t.geo).events.push({ date: t.date, venue: t.venue, kind: 'Talk' }));
    (N.papers || []).forEach(p => get(cityOf(p.place), countryOf(p.place), p.geo).events.push({ date: p.date, venue: p.venue, kind: 'Conference paper' }));
    return Object.values(P);
  }

  ACL.worldMap = function(opt){
    const D = opt.D, root = opt.mount, N = D.network, W = window.ACL_WORLD; if (!W || !N || !root) return;
    const PL = places(D), home = N.home, PLATES = W.plates;
    const isHome = p => p.city === home.city && p.country === home.country;
    const kind = p => isHome(p) ? 'home' : p.orgs.length && p.events.length ? 'both' : p.orgs.length ? 'org' : 'talk';
    PL.forEach(p => { p.plate = ORDER.find(k => PLATES[k] && inBox(p.geo, PLATES[k])) || null; });
    const countries = new Set(PL.map(p => p.country)), nOrgs = N.orgs.length, nEvents = PL.reduce((a, p) => a + p.events.length, 0);
    const reg = []; // every interactive marker, looked up by index from the DOM

    /* ---------- world overview ---------- */
    const VW = 1000, VH = +(W.world.rows * W.world.sLat * VW / 360).toFixed(1);
    const wp = g => [(g[1] + 180) / 360 * VW, (W.world.lat0 - g[0]) / (W.world.rows * W.world.sLat) * VH];
    const hp = wp(home.geo);
    let arcs = '', pulses = '', small = '';
    PL.filter(p => !isHome(p)).forEach((p, i) => { const q = wp(p.geo), d = Math.hypot(q[0] - hp[0], q[1] - hp[1]), h = Math.min(d * .32, 118);
      const c = [(hp[0] + q[0]) / 2, (hp[1] + q[1]) / 2 - h], path = `M${hp[0].toFixed(1)} ${hp[1].toFixed(1)}Q${c[0].toFixed(1)} ${c[1].toFixed(1)} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`;
      [['org', p.orgs.length], ['talk', p.events.length]].forEach(([k, n]) => { if (!n) return;
        arcs += `<path class="wm-arc ${k}" d="${path}"/>`;
        /* only conferences carry a moving pulse; co-author ties are drawn as static links */
        if (k === 'talk') pulses += `<circle class="wm-pulse ${k}" r="2.4"><animateMotion dur="${6 + (i % 5)}s" begin="${((i * 1.3) % 6).toFixed(1)}s" repeatCount="indefinite" path="${path}"/></circle>`; });
      const kd = kind(p); small += `<circle class="wm-dot ${kd === 'talk' ? 'talk' : 'org'}${kd === 'both' ? ' both' : ''}" cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${kd === 'talk' ? 3.4 : 2.6}"/>`; });
    const boxes = ['na', 'eu', 'ea'].filter(k => PLATES[k]).map(k => { const m = PLATES[k], a = wp([m.lat0, m.lon0]), b = wp([m.lat1, m.lon1]);
      return { k, x: a[0], y: a[1], w: b[0] - a[0], h: b[1] - a[1] }; });
    const pct = (v, t) => (v / t * 100).toFixed(2) + '%';
    const loose = PL.filter(p => !p.plate);
    const worldHTML = `<div class="wm-world" style="aspect-ratio:${VW}/${VH}">
        <svg viewBox="0 0 ${VW} ${VH}" aria-hidden="true">${dots(W.world, VW, VH, 2)}
          ${boxes.map(b => `<rect class="wm-box" x="${b.x.toFixed(1)}" y="${b.y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" rx="3"/>`).join('')}
          ${arcs}${opt.motion === false ? '' : pulses}${small}
          <circle class="wm-home" cx="${hp[0].toFixed(1)}" cy="${hp[1].toFixed(1)}" r="4.2"/></svg>
        <div class="wm-layer">
          ${boxes.map(b => `<a class="wm-reg" href="#wm-${b.k}" style="left:${pct(b.x, VW)};top:${pct(b.y + b.h, VH)}">${E(PLATES[b.k].name)}</a>`).join('')}
          <span class="wm-hl" style="left:${pct(hp[0], VW)};top:${pct(hp[1], VH)}">${E(home.city)}</span>
          ${loose.map(p => { reg.push(p); return `<button type="button" class="wm-pt k-${kind(p)} sm" style="left:${pct(wp(p.geo)[0], VW)};top:${pct(wp(p.geo)[1], VH)};--s:9px" data-i="${reg.length - 1}" aria-label="${E(p.city + ', ' + p.country)}"><i></i><span class="lb">${E(p.city)}</span></button>`; }).join('')}
        </div></div>`;

    /* ---------- regional plates ---------- */
    const size = n => 10 + 3.6 * Math.sqrt(n);
    function plate(k){
      const m = PLATES[k]; if (!m) return '';
      let items = PL.filter(p => p.plate === k);
      if (k === 'ea'){ const g = PL.filter(p => p.plate === 'gba'); if (g.length) items = items.concat([{ city: PLATES.gba.name, country: 'China', geo: [22.55, 113.95], orgs: g.flatMap(p => p.orgs), events: g.flatMap(p => p.events), cluster: g, link: 'gba' }]); }
      const fx = g => (g[1] - m.lon0) / (m.lon1 - m.lon0), fy = g => (m.lat0 - g[0]) / (m.lat0 - m.lat1);
      /* nominal 280 px plate: nudge markers that sit on top of each other apart, then place labels greedily (right, left, above, below) */
      const S = 280, placed = [];
      const pos = items.map(p => ({ x: fx(p.geo) * S, y: fy(p.geo) * S, s: size(p.orgs.length) }));
      for (let it = 0; it < 12; it++) for (let a = 0; a < pos.length; a++) for (let b = a + 1; b < pos.length; b++){
        const A = pos[a], B = pos[b], dx = B.x - A.x || .01, dy = B.y - A.y, d = Math.hypot(dx, dy), min = (A.s + B.s) / 2 + 5;
        if (d < min){ const push = (min - d) / 2, ux = dx / d, uy = dy / d; A.x -= ux * push; A.y -= uy * push; B.x += ux * push; B.y += uy * push; } }
      const marks = items.map((p, j) => { const { x, y, s } = pos[j], txt = isHome(p) ? p.city + ' · Lab' : p.city, tw = txt.length * 7 + 4, th = 12;
        const opts = [['r', x + s / 2 + 6, y - th / 2], ['l', x - s / 2 - 6 - tw, y - th / 2], ['t', x - tw / 2, y - s / 2 - 4 - th], ['b', x - tw / 2, y + s / 2 + 4]];
        const clash = (lx, ly) => placed.some(q => lx < q[0] + q[2] && lx + tw > q[0] && ly < q[1] + q[3] && ly + th > q[1]) || pos.some((o, k) => k !== j && Math.hypot(o.x - Math.min(Math.max(o.x, lx), lx + tw), o.y - Math.min(Math.max(o.y, ly), ly + th)) < o.s / 2 + 2);
        const pick = opts.find(([, lx, ly]) => lx >= 0 && lx + tw <= S && ly >= 0 && ly + th <= S && !clash(lx, ly)) || opts[x > S * .6 ? 1 : 0];
        placed.push([pick[1], pick[2], tw, th]); reg.push(p);
        return `<button type="button" class="wm-pt k-${kind(p)}${p.cluster ? ' cl' : ''}" style="left:${(x / S * 100).toFixed(2)}%;top:${(y / S * 100).toFixed(2)}%;--s:${s.toFixed(1)}px" data-i="${reg.length - 1}" aria-label="${E(p.city + ', ' + p.country)}"><i></i><span class="lb p-${pick[0]}">${E(txt)}${p.cluster ? ' ↘' : ''}</span></button>`; }).join('');
      const n = items.reduce((a, p) => a + p.orgs.length, 0), ne = items.reduce((a, p) => a + p.events.length, 0);
      return `<figure class="wm-plate" id="wm-${k}"><div class="wm-pb"><svg viewBox="0 0 640 640" aria-hidden="true">${dots(m, 640, 640, 4.4)}</svg><div class="wm-layer">${marks}</div></div>
        <figcaption><b>${E(m.name)}</b><span class="num">${n} institution${n === 1 ? '' : 's'} · ${ne} conference${ne === 1 ? '' : 's'}</span></figcaption></figure>`;
    }

    const tip = p => { const orgs = p.orgs.filter(o => !o.home);
      return `<b>${E(p.city)}</b><span class="c">${E(p.cluster ? p.cluster.map(c => c.city).join(' · ') : p.country)}</span>`
        + (isHome(p) ? `<p class="hm">Home of ${E(home.name)}, at McGill University.</p>` : '')
        + (orgs.length ? `<span class="h">Co-author institutions</span><ul>${orgs.map(o => `<li>${E(o.org)}<em class="num">${o.pubs.length} paper${o.pubs.length > 1 ? 's' : ''}</em></li>`).join('')}</ul>` : '')
        + (p.events.length ? `<span class="h">Conferences and talks</span><ul>${p.events.map(e => `<li>${E(e.venue)}<em class="num">${E(year(e.date))}</em></li>`).join('')}</ul>` : ''); };

    const events = PL.flatMap(p => p.events.map(e => Object.assign({}, e, { where: p.city + ', ' + p.country }))).sort((a, b) => year(b.date) - year(a.date));
    root.innerHTML = `
      <div class="wm-top">
        <div class="wm-stats"><div><b class="num">${countries.size}</b><span>countries and regions</span></div><div><b class="num">${nOrgs}</b><span>co-author institutions</span></div><div><b class="num">${nEvents}</b><span>conferences and talks</span></div></div>
        <div class="chips" role="group" aria-label="Show on map">
          <button type="button" class="chip" data-f="all" aria-pressed="true">All</button>
          <button type="button" class="chip" data-f="org" aria-pressed="false"><i class="sw org"></i>Co-authors</button>
          <button type="button" class="chip" data-f="talk" aria-pressed="false"><i class="sw talk"></i>Conferences</button></div>
      </div>
      <div class="wm" data-f="all">${worldHTML}<div class="wm-plates">${['na', 'eu', 'ea', 'gba'].map(plate).join('')}</div><div class="wm-tip" role="status" hidden></div></div>
      <details class="wm-lists"><summary class="mono">All institutions and conferences</summary><div class="wm-cols">
        <div><h3 class="mono">Co-author institutions</h3>${[...new Set(N.orgs.map(o => o.country))].map(c => `<div class="wm-g"><span class="ctry">${E(c)}</span><ul>${N.orgs.filter(o => o.country === c).map(o => `<li><span>${E(o.org)}</span><em class="num">${o.pubs.length}</em></li>`).join('')}</ul></div>`).join('')}</div>
        <div><h3 class="mono">Conferences and talks</h3><ul class="wm-ev">${events.map(e => `<li><span class="num">${E(e.date)}</span><span><b>${E(e.venue)}</b><i>${E(e.where)} · ${E(e.kind)}</i></span></li>`).join('')}</ul></div></div></details>`;

    /* ---------- interaction ---------- */
    const box = root.querySelector('.wm'), tipEl = root.querySelector('.wm-tip');
    const show = btn => { tipEl.innerHTML = tip(reg[+btn.dataset.i]); tipEl.hidden = false;
      const b = box.getBoundingClientRect(), r = btn.getBoundingClientRect(), tw = tipEl.offsetWidth, th = tipEl.offsetHeight;
      let x = r.left - b.left + r.width / 2 + 16, y = r.top - b.top + r.height / 2 - th / 2;
      if (x + tw > b.width) x = r.left - b.left + r.width / 2 - tw - 16;
      tipEl.style.left = Math.max(0, x) + 'px'; tipEl.style.top = Math.max(0, Math.min(y, b.height - th)) + 'px'; };
    const hide = () => { tipEl.hidden = true; };
    root.querySelectorAll('.wm-pt').forEach(b => { b.addEventListener('mouseenter', () => show(b)); b.addEventListener('focus', () => show(b)); b.addEventListener('mouseleave', hide); b.addEventListener('blur', hide);
      b.addEventListener('click', () => { const p = reg[+b.dataset.i]; if (p.link){ const t = root.querySelector('#wm-' + p.link); if (t){ t.classList.add('flash'); setTimeout(() => t.classList.remove('flash'), 1200); } } show(b); }); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    root.querySelector('.wm-top .chips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c) return;
      root.querySelectorAll('.wm-top .chip').forEach(x => x.setAttribute('aria-pressed', x === c)); box.dataset.f = c.dataset.f; hide(); });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) root.querySelectorAll('.wm-pulse').forEach(c => c.remove());
    return { countries: countries.size, orgs: nOrgs, events: nEvents };
  };
})();
