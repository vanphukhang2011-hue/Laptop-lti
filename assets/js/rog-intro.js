/* ROG eye geometry is retained from the user's original.html. No simulated boot/progress. */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  if (reduced.matches) return;
  const events = ["pointerdown", "keydown", "wheel", "touchstart"];
  let timer;
  function finish() {
    root.classList.remove("has-rog-intro");
    clearTimeout(timer);
    events.forEach((name) => window.removeEventListener(name, finish, true));
    reduced.removeEventListener("change", finish);
    window.removeEventListener("pageshow", onPageShow);
  }
  function onPageShow(event) {
    if (event.persisted) finish();
  }
  root.classList.add("has-rog-intro");
  events.forEach((name) =>
    window.addEventListener(name, finish, { capture: true, passive: true }),
  );
  reduced.addEventListener("change", finish, { once: true });
  window.addEventListener("pageshow", onPageShow);
  // CSS clears the panel independently at 2650ms; this removes its activation and listeners.
  timer = setTimeout(finish, 2700);
})();
