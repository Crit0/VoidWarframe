export function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || !els.length) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
  );
  els.forEach((el) => io.observe(el));
}

export function initHeroCanvas() {
  const canvas = document.querySelector(".hero__canvas");
  if (!canvas) return;
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  const ctx = canvas.getContext("2d");
  let particles = [];
  let raf;
  let running = true;

  const COLORS = { dot: "rgba(0, 240, 255, 0.85)", line: "rgba(255, 43, 214, " };
  const MAX_DIST = 130;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const area = canvas.clientWidth * canvas.clientHeight;
    const count = Math.max(30, Math.min(110, Math.floor(area / 14000)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.6 + 0.4,
    }));
  }

  function step() {
    if (!running) return;
    const W = canvas.clientWidth;
    const H = canvas.clientHeight;
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.dot;
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MAX_DIST * MAX_DIST) {
          const alpha = (1 - Math.sqrt(d2) / MAX_DIST) * 0.45;
          ctx.strokeStyle = COLORS.line + alpha.toFixed(3) + ")";
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
    raf = requestAnimationFrame(step);
  }

  resize();
  step();

  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    resize();
    step();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else {
      running = true;
      step();
    }
  });
}
