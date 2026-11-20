/* First-screen boot sequence after the ROG intro: the headline types itself,
   specs decode from scrambled glyphs, the laptop scans in, photos sharpen on load. */
(() => {
  const root = document.documentElement;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  // Every photo below the fold sharpens in when it has actually loaded.
  document.querySelectorAll("main img:not(.hero img):not(.product-view):not(.scenario-image)").forEach((img) => {
    if (img.complete && img.naturalWidth) return;
    img.classList.add("img-pending");
    const done = () => img.classList.add("img-ready");
    img.addEventListener("load", done, { once: true });
    img.addEventListener("error", done, { once: true });
  });

  const hero = document.querySelector(".hero"),
    h1 = hero?.querySelector("h1"),
    plate = hero?.querySelector(".product-plate");
  if (!h1) return;
  const lines = h1.innerHTML.split(/<br\s*\/?>/i).map((s) => s.trim());
  const full = h1.textContent;
  h1.setAttribute("aria-label", lines.join(" "));
  h1.style.minHeight = h1.offsetHeight + "px"; // no layout jump while typing
  hero.classList.add("hero-booting");
  plate?.classList.add("plate-scan");
  h1.innerHTML = '<span class="caret" aria-hidden="true"></span>';

  const start = root.classList.contains("has-rog-intro") ? 2350 : 150;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function type() {
    await sleep(start);
    plate?.classList.add("plate-scan-go");
    let html = "";
    for (let l = 0; l < lines.length; l++) {
      for (const ch of Array.from(lines[l])) {
        html += ch;
        h1.innerHTML = html + '<span class="caret" aria-hidden="true"></span>';
        await sleep(38 + Math.random() * 44);
      }
      if (l < lines.length - 1) {
        html += "<br>";
        await sleep(240);
      }
    }
    h1.innerHTML = html + '<span class="caret done" aria-hidden="true"></span>';
    h1.style.minHeight = "";
    hero.classList.remove("hero-booting");
    ["hero-config", "hero-price"].forEach((id, i) =>
      setTimeout(() => decode(document.getElementById(id)), i * 180));
    void full;
  }

  // Characters resolve left to right out of scrambled glyphs.
  function decode(el) {
    if (!el) return;
    const target = el.textContent, glyphs = "0123456789ABCDEFGHX#%/·";
    const chars = Array.from(target), t0 = performance.now(), dur = 900;
    el.setAttribute("aria-label", target);
    (function step(now) {
      const p = Math.min(1, (now - t0) / dur), fixed = Math.floor(p * chars.length);
      el.textContent = chars
        .map((c, i) => (i < fixed || c === " " ? c : glyphs[(Math.random() * glyphs.length) | 0]))
        .join("");
      if (p < 1) requestAnimationFrame(step);
      else {
        el.textContent = target;
        el.removeAttribute("aria-label");
      }
    })(t0);
  }

  type();
})();
