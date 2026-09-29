/* Human–AI interaction city.
   An isometric street grid where people (amber) and AI agents (blue) interact:
   a person sends a request (amber→blue arc), an agent answers with a plan (dashed blue route),
   they meet (white ring), travel together or hand over an order, and every exchange is written to a live log. */
(function(){
  const ACL = window.ACL = window.ACL || {};
  ACL.citySim = function(opt){
    const cv = opt.canvas, ctx = cv.getContext('2d'), logEl = opt.log, hud = opt.hud || {};
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rnd = ACL.rng(opt.seed || 2026);
    const C = { ground:'#0B0D12', top:'#1A1E28', left:'#12151D', right:'#0E1017', edge:'rgba(255,255,255,.035)',
      park:'#0D1815', parkDot:'#1E3B32', human:'#FFB23E', agent:'#5C78FF', white:'#F2F3F5', rest:'#E9EBEF', bg:'#07080B' };
    const ROLES = [['Courier agent','delivery'],['Planner agent','walk'],['Ride agent','ride']];
    let W, H, dpr, N, cell, ox, oy, bg, trail, tctx, people = [], agents = [], rests = [], arcs = [], bursts = [], plans = [], labels = [];
    /* speed < 1 slows everything (movement, arcs, requests, fades) without dropping frames */
    const SP = Math.max(.1, Math.min(2, opt.speed || 1));
    let frame = 0, tt = 0, reqAcc = 0, running = false, minute = 17*60 + 40, interactions = 0;

    const iso = (x, y, z) => [ox + (x - y) * cell * 0.866, oy + (x + y) * cell * 0.5 - (z || 0) * cell];
    const rndNode = (m) => [m + Math.floor(rnd() * (N - 2*m + 1)), m + Math.floor(rnd() * (N - 2*m + 1))];
    const node = e => [Math.round(e.x), Math.round(e.y)];
    const route = (a, b) => { const pts = []; if (rnd() < .5) pts.push([b[0], a[1]]); else pts.push([a[0], b[1]]); pts.push([b[0], b[1]]); return pts; };
    const len = (a, pts) => { let d = 0, p = a; pts.forEach(q => { d += Math.abs(q[0]-p[0]) + Math.abs(q[1]-p[1]); p = q; }); return d; };
    const pad = n => String(n).padStart(2, '0');
    const clock = () => { const m = Math.floor(minute) % 1440; return pad(Math.floor(m/60)) + ':' + pad(m % 60); };

    function log(html){
      if (!logEl) return;
      const li = document.createElement('li'); li.innerHTML = `<span class="t num">${clock()}</span><span>${html}</span>`;
      logEl.insertBefore(li, logEl.firstChild);
      while (logEl.children.length > (opt.logLines || 5)) logEl.removeChild(logEl.lastChild);
    }
    const who = p => `<b class="h">Resident ${pad(p.id)}</b>`;
    const ag = a => `<b class="a">${a.role} ${pad(a.id)}</b>`;

    /* ---------- static city ---------- */
    function drawCity(){
      const c = bg.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,W,H);
      const d = [iso(0,0), iso(N,0), iso(N,N), iso(0,N)];
      c.fillStyle = C.ground; c.beginPath(); d.forEach((p,i) => i ? c.lineTo(...p) : c.moveTo(...p)); c.closePath(); c.fill();
      const blocks = []; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) blocks.push([i, j]);
      blocks.sort((a, b) => (a[0]+a[1]) - (b[0]+b[1]));
      const r = ACL.rng(99);
      blocks.forEach(([i, j]) => {
        const x0 = i + .16, x1 = i + .84, y0 = j + .16, y1 = j + .84, t = r();
        const cx = i - N/2 + .5, cy = j - N/2 + .5, centr = Math.max(0, 1 - Math.hypot(cx, cy) / (N*0.62));
        if (t < .11){ // park
          c.fillStyle = C.park; quad(c, [x0,y0,0],[x1,y0,0],[x1,y1,0],[x0,y1,0]); c.fill();
          c.fillStyle = C.parkDot; for (let k = 0; k < 7; k++){ const p = iso(x0 + r()*(x1-x0), y0 + r()*(y1-y0)); c.beginPath(); c.arc(p[0], p[1], cell*0.035 + r()*cell*0.03, 0, 7); c.fill(); }
          return; }
        const z = t < .16 ? 0.02 : (0.12 + Math.pow(r(), 2.2) * 1.05) * (0.45 + centr);
        c.fillStyle = C.left;  quad(c, [x0,y1,0],[x1,y1,0],[x1,y1,z],[x0,y1,z]); c.fill();
        c.fillStyle = C.right; quad(c, [x1,y0,0],[x1,y1,0],[x1,y1,z],[x1,y0,z]); c.fill();
        c.fillStyle = C.top;   quad(c, [x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]); c.fill();
        c.strokeStyle = C.edge; c.lineWidth = 1; quad(c, [x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]); c.stroke();
        if (z > .5 && r() < .5){ c.fillStyle = 'rgba(255,178,62,.55)'; for (let k = 0; k < 3; k++){ const p = iso(x0 + r()*(x1-x0), y1, r()*z*.9); c.fillRect(p[0], p[1], 1.4, 1.4); } }
      });
      rests.forEach(([i, j]) => { const p = iso(i, j); c.fillStyle = C.rest; c.fillRect(p[0]-3, p[1]-3, 6, 6); });
      const g = c.createRadialGradient(W/2, H*0.52, Math.min(W,H)*0.25, W/2, H*0.52, Math.max(W,H)*0.72);
      g.addColorStop(0, 'rgba(7,8,11,0)'); g.addColorStop(1, 'rgba(7,8,11,.94)'); c.fillStyle = g; c.fillRect(0,0,W,H);
    }
    function quad(c, ...pts){ c.beginPath(); pts.forEach((p,i) => { const s = iso(p[0], p[1], p[2]); i ? c.lineTo(...s) : c.moveTo(...s); }); c.closePath(); }

    /* ---------- setup ---------- */
    function setup(){
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height; if (!W || !H) return false;
      dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W*dpr; cv.height = H*dpr;
      N = W < 700 ? 12 : W < 1100 ? 16 : 20;
      cell = Math.max(W * (W < 700 ? 1.5 : 1.12) / (1.732 * N), 20); ox = W/2; oy = H*0.52 - N*cell*0.5;
      bg = document.createElement('canvas'); bg.width = cv.width; bg.height = cv.height;
      trail = document.createElement('canvas'); trail.width = cv.width; trail.height = cv.height; tctx = trail.getContext('2d');
      rests = Array.from({length: Math.round(N*N/34)}, () => rndNode(1));
      people = Array.from({length: Math.round(N*N*0.26)}, (_, k) => { const n = rndNode(0); return {id:k+1, x:n[0], y:n[1], path:[], st:'walk', v:(.012 + rnd()*.008) * SP}; });
      agents = Array.from({length: Math.max(6, Math.round(N*N*0.05))}, (_, k) => { const n = rndNode(0), ro = ROLES[k % 3]; return {id:k+1, x:n[0], y:n[1], path:[], st:'idle', v:(.038 + rnd()*.012) * SP, role:ro[0], kind:ro[1]}; });
      arcs = []; bursts = []; plans = []; labels = []; drawCity();
      for (let i = 0, n = Math.round(420 / SP); i < n; i++) step(true);
      return true;
    }

    /* ---------- interactions ---------- */
    function request(){
      const idleA = agents.filter(a => a.st === 'idle'), free = people.filter(p => p.st === 'walk');
      if (!idleA.length || !free.length) return;
      const p = free[Math.floor(rnd()*free.length)], pn = node(p);
      const kinds = [...new Set(idleA.map(a => a.kind))], kind = kinds[Math.floor(rnd()*kinds.length)];
      let best = null, bd = 1e9; idleA.filter(a => a.kind === kind).forEach(a => { const n = node(a), dd = Math.abs(n[0]-pn[0]) + Math.abs(n[1]-pn[1]); if (dd < bd){ bd = dd; best = a; } });
      const a = best; p.st = 'wait'; p.path = []; p.x = pn[0]; p.y = pn[1]; a.st = 'listening'; a.path = []; a.task = {kind, p, t0: frame};
      arcs.push({from: p, to: a, t: 0, dir: 1, done: () => answer(a)});
      label(p, 'REQUEST');
      if (kind === 'delivery') log(`${who(p)} ordered dinner from ${ag(a)}`);
      else if (kind === 'walk') log(`${who(p)} asked ${ag(a)} for an evening walk`);
      else log(`${who(p)} asked ${ag(a)} for a ride`);
    }
    function answer(a){
      const task = a.task, p = task.p, an = node(a);
      if (task.kind === 'delivery'){
        let rb = rests[0], bd = 1e9; rests.forEach(r => { const dd = Math.abs(r[0]-an[0]) + Math.abs(r[1]-an[1]); if (dd < bd){ bd = dd; rb = r; } });
        a.path = route(an, rb); a.st = 'toRest'; task.rest = rb; plans.push({a, pts: [[a.x,a.y], ...a.path], t: 0});
      } else {
        a.path = route(an, node(p)); a.st = 'toPerson'; plans.push({a, pts: [[a.x,a.y], ...a.path], t: 0});
        task.dest = rndNode(1); task.route = route(node(p), task.dest); const km = Math.max(0.4, len(node(p), task.route) * 0.1).toFixed(1);
        const eta = Math.max(1, Math.round(len(an, a.path) * 1.5));
        log(task.kind === 'walk' ? `${ag(a)} drafted a ${km} km walk for ${who(p)}` : `${ag(a)} accepted · pickup in ${eta} min`);
      }
      arcs.push({from: a, to: p, t: 0, dir: -1});
    }
    function arrive(a){
      const task = a.task, p = task && task.p;
      if (a.st === 'toRest'){ a.st = 'toPerson'; a.path = route(node(a), node(p)); plans.push({a, pts: [[a.x,a.y], ...a.path], t: 0}); burst(a, 'agent', 'PICKUP'); return; }
      if (a.st === 'toPerson'){
        interactions++; burst(p, 'meet', task.kind === 'delivery' ? 'HANDOFF' : 'MEET');
        if (task.kind === 'delivery'){ log(`${ag(a)} handed the order to ${who(p)}`); p.st = 'walk'; release(a); return; }
        const pts = task.route || route(node(a), rndNode(1)), km = Math.max(0.4, len(node(a), pts) * 0.1).toFixed(1);
        a.path = pts.map(q => q.slice()); a.st = 'co'; p.st = 'ride'; plans.push({a, pts: [[a.x,a.y], ...pts], t: 0, co: true});
        log(task.kind === 'walk' ? `${who(p)} and ${ag(a)} are walking ${km} km together` : `${ag(a)} picked up ${who(p)} · ${km} km`);
        return; }
      if (a.st === 'co'){ burst(a, 'meet', 'ARRIVED'); log(`${who(p)} arrived · rated the ${task.kind === 'walk' ? 'plan' : 'ride'} ${4 + Math.round(rnd())}/5`); p.st = 'walk'; p.x = a.x; p.y = a.y; release(a); }
    }
    function release(a){ a.st = 'idle'; a.task = null; a.path = []; }
    function burst(e, kind, text){ bursts.push({x: e.x, y: e.y, t: 0, kind}); if (text) label(e, text); }
    function label(e, text){ labels.push({x: e.x, y: e.y, t: 0, text}); if (labels.length > 4) labels.shift(); }

    /* ---------- step ---------- */
    function move(e){
      if (!e.path.length) return false;
      const [tx, ty] = e.path[0], dx = tx - e.x, dy = ty - e.y, d = Math.abs(dx) + Math.abs(dy);
      if (d <= e.v){ e.x = tx; e.y = ty; e.path.shift(); return !e.path.length; }
      if (Math.abs(dx) > 1e-6) e.x += Math.sign(dx) * Math.min(e.v, Math.abs(dx)); else e.y += Math.sign(dy) * Math.min(e.v, Math.abs(dy));
      return false;
    }
    function step(warm){
      frame++; tt += SP; minute += 0.05 * SP;
      tctx.setTransform(1,0,0,1,0,0); tctx.globalCompositeOperation = 'destination-out'; tctx.fillStyle = `rgba(0,0,0,${(.045 * SP).toFixed(4)})`; tctx.fillRect(0,0,trail.width,trail.height);
      tctx.globalCompositeOperation = 'source-over'; tctx.setTransform(dpr,0,0,dpr,0,0); tctx.lineCap = 'round';
      reqAcc += SP; if (reqAcc >= 34){ reqAcc -= 34; request(); }
      people.forEach(p => {
        const px = p.x, py = p.y;
        if (p.st === 'walk'){ if (!p.path.length) p.path = route(node(p), rndNode(0)); move(p); }
        if (p.st !== 'ride' && (px !== p.x || py !== p.y)){ const a = iso(px, py), b = iso(p.x, p.y); tctx.strokeStyle = 'rgba(255,178,62,.32)'; tctx.lineWidth = 1.4; tctx.beginPath(); tctx.moveTo(...a); tctx.lineTo(...b); tctx.stroke(); }
      });
      agents.forEach(a => {
        const px = a.x, py = a.y;
        if (a.st === 'idle'){ if (!a.path.length && rnd() < .02 * SP){ const n = node(a); a.path = route(n, [Math.max(0, Math.min(N, n[0] + Math.round((rnd()-.5)*6))), Math.max(0, Math.min(N, n[1] + Math.round((rnd()-.5)*6)))]); } move(a); }
        else if (a.st === 'toRest' || a.st === 'toPerson' || a.st === 'co'){ if (move(a)) arrive(a); if (a.st === 'co' && a.task){ a.task.p.x = a.x; a.task.p.y = a.y; } }
        if (px !== a.x || py !== a.y){ const s = iso(px, py), e = iso(a.x, a.y);
          tctx.strokeStyle = a.st === 'co' ? 'rgba(242,243,245,.55)' : a.st === 'idle' ? 'rgba(92,120,255,.28)' : 'rgba(92,120,255,.8)'; tctx.lineWidth = a.st === 'idle' ? 1.4 : 2.2;
          tctx.beginPath(); tctx.moveTo(...s); tctx.lineTo(...e); tctx.stroke(); }
      });
      arcs.forEach(r => { r.t += SP/48; if (r.t >= 1 && !r.fired){ r.fired = true; r.done && r.done(); } }); arcs = arcs.filter(r => r.t < 1.6);
      bursts.forEach(b => b.t += SP); bursts = bursts.filter(b => b.t < 48);
      labels.forEach(l => l.t += SP); labels = labels.filter(l => l.t < 110);
      plans.forEach(p => p.t += SP); plans = plans.filter(p => p.a.path.length > 0 && p.t < 900);
    }

    /* ---------- render ---------- */
    function arcPath(p, q){ const a = iso(p.x, p.y, .05), b = iso(q.x, q.y, .05), m = [(a[0]+b[0])/2, (a[1]+b[1])/2 - 50 - Math.hypot(b[0]-a[0], b[1]-a[1]) * 0.35]; return [a, m, b]; }
    function qpt(a, m, b, t){ const u = 1 - t; return [u*u*a[0] + 2*u*t*m[0] + t*t*b[0], u*u*a[1] + 2*u*t*m[1] + t*t*b[1]]; }
    function render(){
      ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height);
      ctx.drawImage(bg, 0, 0); ctx.drawImage(trail, 0, 0); ctx.setTransform(dpr,0,0,dpr,0,0);
      plans.forEach(pl => { const pts = pl.pts.map(p => iso(p[0], p[1]));
        ctx.save(); ctx.setLineDash(pl.co ? [] : [5, 5]); ctx.lineDashOffset = -tt * .6; ctx.strokeStyle = pl.co ? 'rgba(242,243,245,.5)' : 'rgba(92,120,255,.75)'; ctx.lineWidth = pl.co ? 1.6 : 1.4;
        ctx.beginPath(); pts.forEach((p,i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke(); ctx.restore(); });
      people.forEach(p => { if (p.st === 'ride') return; const s = iso(p.x, p.y);
        if (p.st === 'wait'){ const r = 6 + 2.5*Math.sin(tt/7); ctx.strokeStyle = 'rgba(255,178,62,.8)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, 7); ctx.stroke(); }
        ctx.fillStyle = C.human; ctx.beginPath(); ctx.arc(s[0], s[1], 2.3, 0, 7); ctx.fill(); });
      agents.forEach(a => { const s = iso(a.x, a.y);
        ctx.fillStyle = 'rgba(92,120,255,.22)'; ctx.beginPath(); ctx.arc(s[0], s[1], 7, 0, 7); ctx.fill();
        ctx.fillStyle = C.agent; ctx.beginPath(); ctx.arc(s[0], s[1], 3.4, 0, 7); ctx.fill();
        if (a.st === 'co'){ ctx.fillStyle = C.human; ctx.beginPath(); ctx.arc(s[0] + 4.2, s[1] - 2.2, 2.3, 0, 7); ctx.fill(); } });
      arcs.forEach(r => { const [a, m, b] = r.dir > 0 ? arcPath(r.from, r.to) : arcPath(r.from, r.to), fade = r.t < 1 ? 1 : Math.max(0, 1 - (r.t - 1) / .6);
        const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
        if (r.dir > 0){ g.addColorStop(0, `rgba(255,178,62,${.85*fade})`); g.addColorStop(1, `rgba(92,120,255,${.85*fade})`); }
        else { g.addColorStop(0, `rgba(92,120,255,${.85*fade})`); g.addColorStop(1, `rgba(255,178,62,${.85*fade})`); }
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(...a); ctx.quadraticCurveTo(m[0], m[1], b[0], b[1]); ctx.stroke();
        if (r.t < 1){ const p = qpt(a, m, b, r.t); ctx.fillStyle = C.white; ctx.beginPath(); ctx.arc(p[0], p[1], 2.6, 0, 7); ctx.fill(); } });
      bursts.forEach(b => { const s = iso(b.x, b.y), k = b.t / 48;
        ctx.strokeStyle = `rgba(242,243,245,${1-k})`; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(s[0], s[1], 5 + k*22, 0, 7); ctx.stroke();
        if (b.kind === 'meet'){ ctx.strokeStyle = `rgba(255,178,62,${.8*(1-k)})`; ctx.beginPath(); ctx.arc(s[0], s[1], 3 + k*12, 0, 7); ctx.stroke(); } });
      ctx.font = '500 10px "IBM Plex Mono", monospace'; ctx.textBaseline = 'bottom';
      labels.forEach(l => { const s = iso(l.x, l.y, .05), a = l.t < 10 ? l.t/10 : l.t > 80 ? (110 - l.t)/30 : 1;
        ctx.fillStyle = `rgba(242,243,245,${.9*a})`; ctx.fillText(l.text, s[0] + 9, s[1] - 8 - l.t*0.12); });
      if (frame % 6 === 0 || !running){
        if (hud.clock) hud.clock.textContent = clock();
        if (hud.people) hud.people.textContent = people.length;
        if (hud.agents) hud.agents.textContent = agents.length;
        if (hud.inter) hud.inter.textContent = interactions.toLocaleString('en-US');
      }
    }
    function loop(){ if (!running) return; step(); render(); requestAnimationFrame(loop); }
    function start(){ if (reduce || running) return; running = true; requestAnimationFrame(loop); }
    function stop(){ running = false; }
    if (setup()) render();
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting && !document.hidden ? start() : stop())).observe(cv); else start();
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { const was = running; stop(); if (setup()) render(); if (was) start(); }, 220); });
    return { start, stop };
  };
})();
