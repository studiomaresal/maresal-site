/* MARESAL · Briefmarke: neigen, umdrehen, Stempel mit Tagesdatum, Uhr Heilbronn */
(function () {
  const stamp = document.getElementById('stamp');
  const scene = document.getElementById('scene');
  const body = document.body;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Uhr + Stempeldatum (Europe/Berlin)
  const tz = 'Europe/Berlin';
  function tick() {
    const d = new Date();
    document.getElementById('clock').textContent = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: tz });
    const z = new Intl.DateTimeFormat('de-DE', { timeZone: tz, timeZoneName: 'short' }).formatToParts(d).find(p => p.type === 'timeZoneName');
    if (z) document.getElementById('tz').textContent = z.value;
    document.getElementById('pmdate').textContent = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: tz });
  }
  tick(); setInterval(tick, 15000);

  // Zustand
  let flip = 0, flipTarget = 0;           // 0 = Vorderseite, 180 = Rückseite
  let tx = 0, ty = 0, cx = 0, cy = 0;     // Neigung (Ziel / aktuell)
  let idle = true;

  function setFlipped(on) {
    flipTarget = on ? 180 : 0;
    body.classList.toggle('flipped', on);
    stamp.setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  stamp.addEventListener('click', () => setFlipped(flipTarget === 0));

  // Neigen mit Maus
  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const r = scene.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
    const ny = (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2);
    tx = Math.max(-1, Math.min(1, nx)) * 14;
    ty = Math.max(-1, Math.min(1, ny)) * -10;
    idle = false;
  }, { passive: true });
  document.addEventListener('mouseleave', () => { idle = true; });

  // Wischen auf dem Handy
  let sx = null, sy = null;
  stamp.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  stamp.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); setFlipped(flipTarget === 0); }
    sx = sy = null;
  });

  // Feder-Animation
  let v = 0, last = performance.now();
  function frame(t) {
    const dt = Math.min(48, t - last) / 16.67; last = t;
    if (idle) { const s = t / 1000; tx = Math.sin(s * .6) * 7 - 4; ty = Math.cos(s * .45) * 4 + 3; }
    // Umdrehen: gedämpfte Feder mit leichtem Nachschwingen
    const k = .055, damp = .80;
    v += (flipTarget - flip) * k * dt; v *= Math.pow(damp, dt); flip += v * dt;
    cx += (tx - cx) * .08 * dt; cy += (ty - cy) * .08 * dt;
    const lift = Math.sin(Math.min(1, Math.abs(flip - flipTarget) / 180) * Math.PI) * 40;
    stamp.style.transform = `translateZ(${lift}px) rotateY(${flip + cx}deg) rotateX(${cy}deg)`;
    requestAnimationFrame(frame);
  }
  if (reduce) {
    stamp.addEventListener('click', () => { stamp.style.transform = `rotateY(${flipTarget}deg)`; });
    stamp.style.transform = 'rotateY(-8deg) rotateX(4deg)';
  } else requestAnimationFrame(frame);
})();
