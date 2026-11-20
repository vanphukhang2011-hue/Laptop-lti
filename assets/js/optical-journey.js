/* Wandering light routes: braided strands drift in the margins, swoop across the
   gaps between sections, and a comet of light rides the main route with scroll.
   A second, dimmer route weaves the opposite way behind it for depth. */
(() => {
  const main = document.querySelector("main"),
    reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const stops = [...main.children].filter((e) => e.matches("header,section"));
  const canvas = document.createElement("canvas");
  canvas.className = "optical-ribbon";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  document.body.append(canvas);
  document.documentElement.classList.add("journey-ready", "optical-ready");
  stops.forEach((e) => e.classList.add("journey-stop"));

  const STEP = 6; // px between resampled route points
  // Tuning knobs per route: seed picks the path, side the starting margin.
  const ROUTES = [
    {
      seed: 11, side: -1, alpha: 1, spread: 26, core: 2, glow: 18,
      colors: ["#4f6bff", "#5d7cff", "#7b6cff", "#9a6cff", "#b77bff", "#7f8cff", "#6aa0ff"],
    },
    {
      seed: 29, side: 1, alpha: 0.45, spread: 16, core: 1.4, glow: 26,
      colors: ["#3f4fd8", "#6a4fe0", "#8a5cf0", "#4f78e8"],
    },
  ];
  let width, height, routes = [], timer, raf = 0, comet = -1, lastTime = 0,
    scale = 1, tiles = [], stations = [];
  const TILE = 1024; // strands are painted once into tiles; scrolling only blits them

  function rng(seed) {
    return () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function anchors(cfg) {
    const rand = rng(cfg.seed), desktop = width > 1100, pts = [], scroll = scrollY;
    let side = desktop ? cfg.side : -1;
    stops.forEach((e, i) => {
      const r = e.getBoundingClientRect(), st = getComputedStyle(e),
        top = r.top + scroll, bottom = r.bottom + scroll,
        start = top + (parseFloat(st.paddingTop) || 0),
        cl = r.left + (parseFloat(st.paddingLeft) || 0),
        cr = r.right - (parseFloat(st.paddingRight) || 0),
        lx = Math.max(14, cl * 0.5), rx = Math.min(width - 14, (cr + width) / 2);
      const prevX = pts.length ? pts.at(-1).x : null;
      if (i > 0 && desktop && rand() < 0.75) side = -side;
      const x = side < 0 ? lx : rx, gap = start - top;
      if (i === 0) pts.push({ x: x - side * 60, y: top - 220 }, { x, y: start });
      else if (gap > 140) {
        if (Math.abs(prevX - x) > width * 0.3) {
          const k = 0.15 + rand() * 0.15;
          pts.push(
            { x: prevX + (x - prevX) * (0.5 - k), y: top + gap * 0.38 },
            { x: prevX + (x - prevX) * (0.5 + k), y: top + gap * 0.62 },
          );
        } else pts.push({ x: prevX + (width * 0.5 - prevX) * (0.3 + rand() * 0.2), y: top + gap * 0.5 });
        pts.push({ x, y: start });
      }
      const runs = Math.max(1, Math.round((bottom - start) / 340));
      for (let k = 1; k <= runs; k++)
        pts.push({
          x: x + (rand() - 0.5) * (desktop ? 40 : 10),
          y: start + ((bottom - start) * k) / runs,
        });
    });
    pts.push({ x: width * 0.5, y: pts.at(-1).y + 260 });
    return pts;
  }

  function route(cfg) {
    // Catmull-Rom through anchors, then resample to even arc length.
    const p = anchors(cfg), dense = [];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[Math.max(0, i - 1)], b = p[i], c = p[i + 1], d = p[Math.min(p.length - 1, i + 2)];
      for (let s = 0; s < 1; s += 1 / 32) {
        const s2 = s * s, s3 = s2 * s;
        const f = (q0, q1, q2, q3) =>
          0.5 * (2 * q1 + (q2 - q0) * s + (2 * q0 - 5 * q1 + 4 * q2 - q3) * s2 +
            (3 * q1 - q0 - 3 * q2 + q3) * s3);
        dense.push([f(a.x, b.x, c.x, d.x), f(a.y, b.y, c.y, d.y)]);
      }
    }
    dense.push([p.at(-1).x, p.at(-1).y]);
    const xs = [dense[0][0]], ys = [dense[0][1]];
    let carry = 0;
    for (let i = 1; i < dense.length; i++) {
      const [x0, y0] = dense[i - 1], [x1, y1] = dense[i], len = Math.hypot(x1 - x0, y1 - y0);
      let at = STEP - carry;
      while (at <= len) {
        xs.push(x0 + ((x1 - x0) * at) / len);
        ys.push(y0 + ((y1 - y0) * at) / len);
        at += STEP;
      }
      carry = len - (at - STEP);
    }
    // Moving-average passes iron out any kink where gap swoops meet margin runs.
    for (let pass = 0; pass < 4; pass++)
      for (const arr of [xs, ys]) {
        const src = arr.slice();
        for (let i = 6; i < src.length - 6; i++) {
          let sum = 0;
          for (let j = -6; j <= 6; j++) sum += src[i + j];
          arr[i] = sum / 13;
        }
      }
    const total = xs.length, nx = new Float32Array(total), ny = new Float32Array(total);
    for (let i = 0; i < total; i++) {
      const a = Math.max(0, i - 2), b = Math.min(total - 1, i + 2),
        dx = xs[b] - xs[a], dy = ys[b] - ys[a], l = Math.hypot(dx, dy) || 1;
      nx[i] = dy / l;
      ny[i] = -dx / l;
    }
    return { cfg, xs, ys, nx, ny, total };
  }

  function build() {
    width = innerWidth;
    height = innerHeight;
    const dpr = (scale = Math.min(devicePixelRatio || 1, 1.25));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    routes = ROUTES.map(route);
    tiles = [];
    // One station per chapter, where the main route enters the section.
    const ys0 = routes[0].ys;
    stations = stops.map((e) => {
      const y = e.getBoundingClientRect().top + scrollY +
        (parseFloat(getComputedStyle(e).paddingTop) || 0);
      let idx = 0;
      while (idx < ys0.length - 1 && ys0[idx] < y) idx++;
      const old = stations.find((s) => s.e === e);
      return { e, idx, lit: old ? old.lit : 0 };
    });
    comet = -1;
    // Warm the cache in idle time so scrolling never has to paint.
    const pageH = Math.max(...routes.map((R) => R.ys.at(-1))), n = Math.ceil(pageH / TILE);
    let k = 0;
    const warm = () => { if (k < n && tiles.length <= n) { tile(k++); (window.requestIdleCallback || setTimeout)(warm); } };
    (window.requestIdleCallback || setTimeout)(warm);
    tick();
  }

  // Organic drift of the whole bundle: layered slow sines.
  const drift = (i, t, k) =>
    Math.sin(i * 0.0126 + t * 0.00031 + k) * 11 + Math.sin(i * 0.029 - t * 0.00019 + k) * 6;
  // Strands braid around the centre line: each one's offset rotates over time.
  function offset(R, i, n, t) {
    const count = R.cfg.colors.length, k = R.cfg.seed,
      phase = (n / count) * Math.PI * 2,
      spread = R.cfg.spread * (0.6 + 0.4 * Math.sin(i * 0.008 + t * 0.00022 + k)),
      mobile = width <= 1100 ? 0.45 : 1;
    return (drift(i, t, k) +
      Math.cos(phase + i * 0.02 + t * 0.00045) * spread +
      Math.sin(i * 0.018 + t * 0.0005 * (1 + n * 0.25) + n * 2) * 3) * mobile;
  }
  const at = (R, i, o) => [R.xs[i] + R.nx[i] * o, R.ys[i] + R.ny[i] * o];

  function stroke(g, R, from, to, n, t, step) {
    g.beginPath();
    for (let i = from; i <= to; i += i + step > to && i < to ? to - i : step) {
      const [x, y] = at(R, i, offset(R, i, n, t));
      i === from ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }

  function tile(k) {
    if (tiles[k]) return tiles[k];
    const c = document.createElement("canvas");
    c.width = Math.round(width * scale);
    c.height = Math.round(TILE * scale);
    const g = c.getContext("2d");
    g.setTransform(scale, 0, 0, scale, 0, -k * TILE * scale);
    g.globalCompositeOperation = "lighter";
    g.lineCap = g.lineJoin = "round";
    const y0 = k * TILE - 140, y1 = (k + 1) * TILE + 140;
    for (const R of [...routes].reverse()) {
      const { cfg, ys, total } = R;
      let first = 0, last = total - 1;
      while (first < total && ys[first] < y0) first++;
      while (last > 0 && ys[last] > y1) last--;
      if (last <= first) continue;
      for (const pass of [
        { w: cfg.glow, a: 0.03 },
        { w: cfg.core * 2.4, a: 0.08 },
        { w: cfg.core, a: 0.5 },
      ])
        cfg.colors.forEach((col, n) => {
          g.strokeStyle = col;
          g.lineWidth = pass.w * (width <= 1100 ? 0.7 : 1);
          g.globalAlpha = pass.a * cfg.alpha * (0.65 + 0.35 * Math.sin(n * 1.7) ** 2);
          stroke(g, R, first, last, n, 0, 1);
        });
    }
    return (tiles[k] = c);
  }

  function frame(time) {
    raf = 0;
    const still = reduced.matches,
      dt = lastTime ? Math.min(64, time - lastTime) : 16, scroll = scrollY;
    lastTime = time;
    ctx.clearRect(0, 0, width, height);
    for (let k = Math.max(0, Math.floor(scroll / TILE)); k * TILE < scroll + height; k++) {
      const img = tile(k);
      ctx.drawImage(img, 0, k * TILE - scroll, width, TILE);
    }
    ctx.save();
    ctx.translate(0, -scroll);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = ctx.lineJoin = "round";
    let target = 0;
    for (const R of [...routes].reverse()) {
      const { cfg, ys, total } = R;
      let first = 0, last = total - 1;
      while (first < total && ys[first] < scroll - 120) first++;
      while (last > 0 && ys[last] > scroll + height + 120) last--;
      if (last <= first) continue;
      if (!still)
        for (let k = 0; k < 4; k++) {
          const span = last - first,
            head = first + ((time * (0.008 + k * 0.002) + k * span * 0.29) % span);
          light(R, head, 16, k % cfg.colors.length, 0, 0.4 * cfg.alpha, 1.6);
        }
      if (R === routes[0]) {
        target = first;
        const focal = scroll + height * 0.45;
        while (target < total - 1 && ys[target] < focal) target++;
      }
    }
    const R = routes[0];
    if (comet < 0 || still) comet = target;
    else comet += (target - comet) * (1 - Math.exp(-dt / 260));
    const speed = Math.abs(target - comet);
    light(R, comet, 22 + Math.min(90, speed * 0.5), -1, 0, 1, 3.4);

    // Stations: dim rings until the pen arrives, then a burst and a lit core.
    const m = width <= 1100 ? 0.45 : 1;
    let bursting = false;
    for (const s of stations) {
      if (!s.lit && comet >= s.idx - 2) {
        s.lit = time || 1;
        s.e.classList.add("is-lit");
      }
      const [x, y] = at(R, s.idx, drift(s.idx, 0, R.cfg.seed) * m);
      if (y < scroll - 80 || y > scroll + height + 80) continue;
      ctx.globalAlpha = s.lit ? 0.9 : 0.35;
      ctx.strokeStyle = s.lit ? "#e4e8ff" : "#8e96ff";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(x, y, 8 * m + 3, 0, Math.PI * 2);
      ctx.stroke();
      if (s.lit) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, 16);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.3, "#b8c0ff88");
        g.addColorStop(1, "#6a5cff00");
        ctx.fillStyle = g;
        ctx.fillRect(x - 16, y - 16, 32, 32);
        const p = still ? 1 : (time - s.lit) / 1400;
        if (p < 1) {
          bursting = true;
          const e = 1 - (1 - p) ** 3;
          ctx.globalAlpha = 0.8 * (1 - p);
          ctx.lineWidth = 2 * (1 - p) + 0.3;
          ctx.beginPath();
          ctx.arc(x, y, 10 + 70 * e, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 0.4 * (1 - p);
          ctx.beginPath();
          ctx.arc(x, y, 10 + 130 * e, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    if (bursting) tick();
    ctx.restore();
    if (!still || speed > 0.5) tick();
  }

  // A glowing head with a tapered tail behind it along strand n (-1 = centre).
  function light(R, head, len, n, t, alpha, w) {
    const h = Math.floor(head), fr = head - h;
    if (h < 1 || h >= R.total - 1) return;
    const o = (i) => (n < 0 ? drift(i, t, R.cfg.seed) * (width <= 1100 ? 0.45 : 1) : offset(R, i, n, t));
    const tail = Math.max(1, h - Math.round(len));
    // Sub-point interpolation so the head glides instead of stepping 6px.
    const [ax, ay] = at(R, h, o(h)), [bx, by] = at(R, h + 1, o(h + 1)),
      hx = ax + (bx - ax) * fr, hy = ay + (by - ay) * fr;
    for (let i = tail; i <= h; i++) {
      const k = (i - tail + fr) / (h - tail + fr), [x0, y0] = at(R, i, o(i)),
        [x1, y1] = i < h ? at(R, i + 1, o(i + 1)) : [hx, hy];
      ctx.strokeStyle = "#cfd8ff";
      ctx.globalAlpha = alpha * k * k * 0.9;
      ctx.lineWidth = w * (0.3 + 0.7 * k);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    const x = hx, y = hy, r = 9 * w, g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.15, "#dfe4ff");
    g.addColorStop(0.45, "#8a7bff66");
    g.addColorStop(1, "#6a5cff00");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  function tick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      build();
      window.ScrollTrigger?.refresh();
    }, 180); // wait for layout to settle (accordions, fonts) before re-routing
  }
  addEventListener("scroll", tick, { passive: true });
  addEventListener("resize", schedule);
  reduced.addEventListener("change", build);
  const observer = new ResizeObserver(schedule);
  stops.forEach((e) => observer.observe(e));
  observer.observe(main);
  document.fonts.ready.then(schedule);
  addEventListener("load", schedule, { once: true });
  build();
})();
