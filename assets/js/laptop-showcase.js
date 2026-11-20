/* Official ASUS photographs, choreographed as a product study. No invented 3D geometry. */
(() => {
  "use strict";
  const stage = document.getElementById("laptop-stage");
  if (!stage) return;
  const story = document.getElementById("product-story");
  const views = [...stage.querySelectorAll(".product-view")];
  const buttons = [...document.querySelectorAll("[data-part]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const labels = [
    [
      "16:10",
      "Không gian hiển thị",
      "Một không gian làm việc liền mạch giữa mã nguồn và tài liệu.",
    ],
    [
      "Thao tác",
      "Bàn phím & bàn rê",
      "Chất lượng sử dụng cần được kiểm tra trực tiếp, qua từng thao tác.",
    ],
    [
      "Tản nhiệt",
      "Làm việc bền bỉ",
      "Hiệu năng cần đi cùng cách sử dụng thông thoáng và bảo dưỡng định kỳ.",
    ],
    [
      "32GB",
      "Bộ nhớ đề xuất",
      "Đầu tư cho nhu cầu hiện tại, xác nhận khả năng mở rộng trước khi mua.",
    ],
  ];
  let current = 0,
    scrollChapter = -1;
  const g = window.gsap;
  function show(index) {
    if (index === current) return;
    const previous = views[current],
      next = views[index];
    current = index;
    views.forEach((image, i) =>
      image.classList.toggle("is-active", i === index),
    );
    stage.dataset.view = String(index);
    document.getElementById("stage-feature").textContent = labels[index][0];
    document.getElementById("stage-feature-label").textContent =
      labels[index][1];
    document.getElementById("showcase-insight").textContent = labels[index][2];
    if (g && !reduced.matches) {
      g.killTweensOf(views);
      views.forEach((image) => {
        if (image !== previous && image !== next)
          g.set(image, { autoAlpha: 0 });
      });
      g.fromTo(
        previous,
        { autoAlpha: 1 },
        { autoAlpha: 0, scale: 0.96, y: -12, duration: 0.45, ease: "expo.out" },
      );
      g.fromTo(
        next,
        { autoAlpha: 0, scale: 1.06, y: 25 },
        { autoAlpha: 1, scale: 1, y: 0, duration: 0.85, ease: "expo.out" },
      );
      g.fromTo(
        ".stage-marker",
        { y: 12, opacity: 0.3 },
        { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" },
      );
    } else views.forEach((image) => image.removeAttribute("style"));
  }
  buttons.forEach((button) =>
    button.addEventListener("click", () => show(Number(button.dataset.part))),
  );
  // Keyboard traversal remains native; each chosen view receives the same factual copy.
  buttons.forEach((button, index) =>
    button.addEventListener("keydown", (event) => {
      if (
        ![
          "ArrowDown",
          "ArrowUp",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
        ].includes(event.key)
      )
        return;
      event.preventDefault();
      const step = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? 3
            : (index + step + 4) % 4;
      buttons[next].focus();
      buttons[next].click();
    }),
  );
  if (!g || !window.ScrollTrigger) return;
  g.registerPlugin(ScrollTrigger);
  const mm = g.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // The first impression is one composed entrance, with all content visible by default.
    g.fromTo(
      ".hero h1 > span",
      { yPercent: 25, clipPath: "inset(0 0 100% 0)" },
      {
        yPercent: 0,
        clipPath: "inset(0 0 0% 0)",
        duration: 1.15,
        stagger: 0.12,
        ease: "expo.out",
        clearProps: "all",
      },
    );
    g.fromTo(
      ".hero .product-plate",
      { xPercent: -3, opacity: 0.6 },
      {
        xPercent: 0,
        opacity: 1,
        duration: 1.2,
        ease: "expo.out",
        clearProps: "all",
      },
    );
    g.fromTo(
      ".product-plate > img",
      { yPercent: 0, rotation: 0 },
      {
        yPercent: 8,
        rotation: 2,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      },
    );
  });
  mm.add(
    "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
    () => {
      document.documentElement.classList.add("motion-ready");
      const progress = document.createElement("div");
      progress.className = "story-progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML = "<span></span>";
      story.querySelector(".story-sticky").prepend(progress);
      const storyTop = () => story.getBoundingClientRect().top + window.scrollY;
      const trigger = ScrollTrigger.create({
        trigger: story,
        start: storyTop,
        end: () => storyTop() + story.offsetHeight - window.innerHeight,
        onUpdate: (self) => {
          progress.firstElementChild.style.transform = `scaleX(${self.progress})`;
          const index = Math.min(3, Math.floor(self.progress * 4));
          if (index !== scrollChapter) {
            scrollChapter = index;
            buttons[index].click();
          }
        },
      });
      return () => {
        trigger.kill();
        progress.remove();
        document.documentElement.classList.remove("motion-ready");
        scrollChapter = -1;
      };
    },
  );
  // Keep the real product silhouette intact; only a slight camera-like response to the pointer.
  if (!reduced.matches && matchMedia("(pointer: fine)").matches) {
    stage.addEventListener("pointermove", (event) => {
      if (reduced.matches) return;
      const r = stage.getBoundingClientRect();
      g.to(views[current], {
        rotationY: ((event.clientX - r.left) / r.width - 0.5) * 5,
        rotationX: ((event.clientY - r.top) / r.height - 0.5) * -3,
        duration: 0.8,
        ease: "expo.out",
      });
    });
    stage.addEventListener("pointerleave", () =>
      g.to(views, {
        rotationX: 0,
        rotationY: 0,
        duration: reduced.matches ? 0 : 1,
        ease: "expo.out",
      }),
    );
  }
  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh(), {
    once: true,
  });
  // Native disclosures above the product study change its document position.
  let refreshFrame;
  document.addEventListener(
    "toggle",
    (event) => {
      if (!(event.target instanceof HTMLDetailsElement)) return;
      cancelAnimationFrame(refreshFrame);
      refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    true,
  );
})();
