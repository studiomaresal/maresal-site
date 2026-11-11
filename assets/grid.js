/* MARESAL · Chaos in Ordnung — lebendiges Punktraster.
   Ordnung: Punkte im 24-px-Raster. Chaos: Zeiger/Finger stößt sie weg, Federn ziehen sie zurück.
   Keine externen Anfragen, keine Cookies. */
(function () {
  const c = document.getElementById('grid');
  if (!c || !c.getContext) return;
  const ctx = c.getContext('2d');
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PAPER = [241, 242, 233], ORCHID = [215, 149, 186];
  let W = 0, H = 0, DPR = 1, GAP = 24, dots = [];
  const ptr = { x: -9999, y: -9999, active: false, last: 0 };

  const cfg = c.dataset.cx ? { cx: +c.dataset.cx, cy: +c.dataset.cy, rx: +c.dataset.rx, ry: +c.dataset.ry } : null;
  function mask(x, y) {
    if (cfg) { // um die Mitte (Briefmarke) herum, nach außen ausblendend
      const dx = (x - cfg.cx * W) / (cfg.rx * W), dy = (y - cfg.cy * H) / (cfg.ry * H);
      return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy)) * 0.8;
    }
    // dicht rechts, nach links ausblendend (wie die statische Variante)
    // auf schmalen Bildschirmen liegt der Text links/mittig, das Raster sitzt unten rechts
    const mob = W < 600;
    const dx = (x - 0.85 * W) / ((mob ? 0.80 : 0.70) * W), dy = (y - (mob ? 0.80 : 0.40) * H) / ((mob ? 0.45 : 0.90) * H);
    return Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / 0.75);
  }

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    c.width = Math.round(W * DPR); c.height = Math.round(H * DPR);
    c.style.width = W + 'px'; c.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    GAP = W < 600 ? 22 : 24;
    dots = [];
    for (let y = GAP / 2; y < H + GAP; y += GAP)
      for (let x = GAP / 2; x < W + GAP; x += GAP)
        dots.push({ hx: x, hy: y, x: x, y: y, vx: 0, vy: 0, m: mask(x, y), heat: 0 });
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    const R = W < 600 ? 110 : 150, R2 = R * R;
    // Leerlauf: ein unsichtbarer "Gast" wandert langsam, damit das Raster auch ohne Maus lebt
    let px = ptr.x, py = ptr.y, force = 1;
    if (!ptr.active || t - ptr.last > 2500) {
      const s = t / 1000;
      if (cfg) { px = W * (cfg.cx + 0.28 * Math.sin(s * 0.31)); py = H * (cfg.cy + 0.30 * Math.sin(s * 0.21 + 1.3)); force = 0.4; }
      else if (W < 600) { px = W * (0.72 + 0.20 * Math.sin(s * 0.37)); py = H * (0.80 + 0.10 * Math.sin(s * 0.23 + 1.3)); }
      else { px = W * (0.74 + 0.16 * Math.sin(s * 0.37)); py = H * (0.45 + 0.28 * Math.sin(s * 0.23 + 1.3)); }
      force = 0.55;
    }
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const dx = d.x - px, dy = d.y - py, dist2 = dx * dx + dy * dy;
      if (dist2 < R2 && !reduce) {
        const dist = Math.sqrt(dist2) || 1, k = 1 - dist / R;
        const push = k * k * 2.6 * force;
        d.vx += (dx / dist) * push; d.vy += (dy / dist) * push;
        d.heat = Math.min(1, d.heat + k * 0.25 * force);
      }
      // Feder zurück zur Ordnung
      d.vx += (d.hx - d.x) * 0.045; d.vy += (d.hy - d.y) * 0.045;
      d.vx *= 0.84; d.vy *= 0.84;
      d.x += d.vx; d.y += d.vy;
      d.heat *= 0.94;
      const a = Math.min(0.85, d.m * 0.30 + d.heat * 0.55);
      if (a < 0.015) continue;
      const h = d.heat;
      const col = PAPER.map((v, j) => Math.round(v + (ORCHID[j] - v) * h));
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${a.toFixed(3)})`;
      const r = 1.4 + h * 0.9;
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 6.2832); ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }

  function move(e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.active = true; ptr.last = performance.now(); }
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', move, { passive: true });
  window.addEventListener('pointerleave', () => { ptr.active = false; });
  document.addEventListener('mouseleave', () => { ptr.active = false; });
  let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 150); });

  build();
  if (reduce) draw(0); else requestAnimationFrame(draw);
})();
