(() => {
  const bg = document.getElementById("bg");
  const canvas = document.getElementById("stars");
  const ctx = canvas ? canvas.getContext("2d") : null;

  if (!bg) return;

  const root = document.documentElement;

  const stops = [
    { t: 0.00, c: [0, 0, 0],       a: 1.0 },
    { t: 0.50, c: [6, 10, 36],     a: 1.0 },
    { t: 0.75, c: [70, 140, 220],  a: 1.0 },
    { t: 1.00, c: [120, 180, 255],  a: 1.0 },

  ];

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = x => Math.max(0, Math.min(1, x));

  function sample(p) {
    p = clamp01(p);
    let i = 0;
    while (i < stops.length - 2 && p > stops[i + 1].t) i++;
    const s0 = stops[i];
    const s1 = stops[i + 1];
    const local = (p - s0.t) / (s1.t - s0.t || 1);

    return {
      r: Math.round(lerp(s0.c[0], s1.c[0], local)),
      g: Math.round(lerp(s0.c[1], s1.c[1], local)),
      b: Math.round(lerp(s0.c[2], s1.c[2], local)),
      a: lerp(s0.a, s1.a, local),
    };
  }

  function updateBackground() {
    const h = root.scrollHeight - window.innerHeight;
    const p = h > 0 ? window.scrollY / h : 0;
    const col = sample(p);

    bg.style.background =
      `linear-gradient(to bottom,
        rgba(0,0,0,0.45) 0%,
        rgba(0,0,0,0.10) 40%,
        rgba(0,0,0,0.00) 100%),
       rgba(${col.r},${col.g},${col.b},${col.a})`;

    root.style.setProperty("--cloud", Math.max(0, (p - 0.6) / 0.4));
    root.style.setProperty("--veil", Math.max(0, (0.35 - p) / 0.35) * 0.15);
    root.style.setProperty("--stars", Math.max(0, (0.85 - p) / 0.85));
  }

  updateBackground();
  window.addEventListener("scroll", updateBackground, { passive: true });
  window.addEventListener("resize", updateBackground);

  if (!canvas || !ctx) return;

  let dpr = window.devicePixelRatio || 1;
  let starsData = [];
  let rafId = null;

  function createStars(w, h) {
    starsData = [];
    const count = 150;

    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.pow(Math.random(), 1.4) * h;

      const rv = Math.random();
      const r = rv < 0.04 ? 2.2 : rv < 0.15 ? 1.4 : 0.8;

      const t = Math.random();
      let rgb, baseAlpha;

      if (t < 0.7) {
        rgb = "255,255,255";
        baseAlpha = 0.65 + Math.random() * 0.25;
      } else if (t < 0.9) {
        rgb = "200,220,255";
        baseAlpha = 0.55 + Math.random() * 0.25;
      } else {
        rgb = "255,235,200";
        baseAlpha = 0.50 + Math.random() * 0.20;
      }

      starsData.push({
        x,
        y,
        r,
        rgb,
        baseAlpha,
        twinkle: r >= 1.4,
        twinkleSpeed: 1.2 + Math.random() * 1.8,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleDepth: 0.6 + Math.random() * 0.4
      });
    }
  }

  function resizeStars() {
    dpr = window.devicePixelRatio || 1;

    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    createStars(w, h);
  }

  function drawStars(timeSec) {
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    for (const star of starsData) {
      const flicker = star.twinkle
        ? 1 + Math.sin(timeSec * star.twinkleSpeed + star.twinklePhase) * star.twinkleDepth
        : 1;

      const alpha = Math.max(0.08, Math.min(1, star.baseAlpha * flicker));
      const glowR = star.r * 2.2;

      ctx.save();

      const grad = ctx.createRadialGradient(
        star.x, star.y, 0,
        star.x, star.y, glowR
      );

      grad.addColorStop(0.0, `rgba(${star.rgb},${alpha})`);
      grad.addColorStop(0.25, `rgba(${star.rgb},${alpha * 0.55})`);
      grad.addColorStop(0.70, `rgba(${star.rgb},${alpha * 0.18})`);
      grad.addColorStop(1.0, `rgba(${star.rgb},0)`);

      ctx.shadowColor = `rgba(${star.rgb},${alpha})`;
      ctx.shadowBlur = star.r > 2 ? 10 : 4;

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(star.x, star.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${star.rgb},${alpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, Math.max(0.7, star.r * 0.5), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  function animate(t = 0) {
    drawStars(t * 0.001);
    rafId = requestAnimationFrame(animate);
  }

  function restart() {
    if (rafId) cancelAnimationFrame(rafId);
    resizeStars();
    animate();
  }

  restart();
  window.addEventListener("resize", restart);
})();
(() => {
  const canvas = document.getElementById("meteors");
  const ctx = canvas ? canvas.getContext("2d") : null;
  if (!canvas || !ctx) return;

  let dpr = window.devicePixelRatio || 1;
  let meteors = [];
  let nextMeteorTime = 0;

  function resizeMeteorCanvas() {
    dpr = window.devicePixelRatio || 1;

    const w = window.innerWidth;
    const h = window.innerHeight;

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnMeteor() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    meteors.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: 6 + Math.random() * 3,
      vy: 2.8 + Math.random() * 1.8,
      life: 0,
      maxLife: 28 + Math.random() * 18,
      alpha: 0.45 + Math.random() * 0.2,   // 少し薄め
      width: 1.2 + Math.random() * 0.8,
      tail: 10 + Math.random() * 8
    });
  }

  function drawMeteors() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    ctx.clearRect(0, 0, w, h);

    meteors = meteors.filter((m) => {
      const grad = ctx.createLinearGradient(
        m.x,
        m.y,
        m.x - m.vx * m.tail,
        m.y - m.vy * m.tail
      );

      grad.addColorStop(0, `rgba(255,255,255,${m.alpha})`);
      grad.addColorStop(0.3, `rgba(255,255,255,${m.alpha * 0.55})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");

      ctx.save();
      ctx.strokeStyle = grad;
      ctx.lineWidth = m.width;
      ctx.lineCap = "round";
      ctx.shadowColor = `rgba(255,255,255,${m.alpha * 0.35})`;
      ctx.shadowBlur = 6;

      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(m.x - m.vx * m.tail, m.y - m.vy * m.tail);
      ctx.stroke();
      ctx.restore();

      m.x += m.vx;
      m.y += m.vy;
      m.life++;

      return m.life <= m.maxLife;
    });
  }

  function loop() {
    const now = performance.now();

    if (now > nextMeteorTime) {
      // たまに2本まとめて出す
      const burst = Math.random() < 0.28 ? 2 : 1;
      for (let i = 0; i < burst; i++) spawnMeteor();

      // 出現頻度を少し上げる
      nextMeteorTime = now + 800 + Math.random() * 1200;
    }

    drawMeteors();
    requestAnimationFrame(loop);
  }

  resizeMeteorCanvas();
  window.addEventListener("resize", resizeMeteorCanvas);
  loop();
})();