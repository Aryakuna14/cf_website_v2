// Full-width photo slideshow at the top of the home page (format from uandiadheera.vercel.app). Owner: Arya.
// Swiping (and trackpad scrolling) is the browser's own, using CSS scroll snap, so it works without this script.
// This script moves to the next photo every few seconds and runs the Pause button (dots and previous/next
// buttons too, if the page has them). It holds still while a keyboard user is on it, while it is off screen or
// the tab is hidden, and never moves on its own for people whose device asks for reduced motion.
const DELAY_MS = 5000; // how long each photo stays before the next one

const root = document.querySelector("[data-carousel]");
if (root) {
  const track = root.querySelector(".carousel-track");
  const slides = Array.from(track.children);
  const dotsBox = root.querySelector(".carousel-dots");
  const toggle = root.querySelector("[data-toggle]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let index = 0;
  let timer = 0;
  let userPaused = reduceMotion;
  let keyboardFocus = false;
  let onScreen = false;

  const dots = !dotsBox ? [] : slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "carousel-dot";
    dot.setAttribute("aria-label", `Show photo ${i + 1} of ${slides.length}`);
    dot.addEventListener("click", () => go(i));
    dotsBox.appendChild(dot);
    return dot;
  });

  function show() {
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === index)));
    toggle.textContent = userPaused ? "Play" : "Pause";
    toggle.setAttribute("aria-label", userPaused ? "Play slideshow" : "Pause slideshow");
  }

  // Photos after the first load lazily; fetch the next one early so it never slides in blank
  function preloadNext() {
    const img = slides[(index + 1) % slides.length].querySelector("img");
    if (img) img.loading = "eager";
  }

  function schedule() {
    clearTimeout(timer);
    preloadNext();
    if (userPaused || keyboardFocus || !onScreen || document.hidden) return;
    timer = setTimeout(() => go(index + 1), DELAY_MS);
  }

  function go(i) {
    index = (i + slides.length) % slides.length;
    track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
    show();
    schedule();
  }

  // Keep the dots in step when someone swipes, then restart the countdown
  let settle = 0;
  track.addEventListener("scroll", () => {
    clearTimeout(settle);
    settle = setTimeout(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== index) { index = i; show(); }
      schedule();
    }, 120);
  }, { passive: true });
  track.addEventListener("touchstart", () => clearTimeout(timer), { passive: true });

  root.querySelector("[data-prev]")?.addEventListener("click", () => go(index - 1));
  root.querySelector("[data-next]")?.addEventListener("click", () => go(index + 1));
  toggle.addEventListener("click", () => { userPaused = !userPaused; show(); schedule(); });
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
  });

  // Hold still while a keyboard user is inside (the Pause button is there for everyone else)
  root.addEventListener("focusin", (e) => { keyboardFocus = e.target.matches(":focus-visible"); schedule(); });
  root.addEventListener("focusout", (e) => { if (!root.contains(e.relatedTarget)) { keyboardFocus = false; schedule(); } });
  document.addEventListener("visibilitychange", schedule);
  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; schedule(); }, { threshold: 0.3 }).observe(root);
  window.addEventListener("resize", () => track.scrollTo({ left: index * track.clientWidth, behavior: "auto" }));

  root.querySelector("[data-controls]").hidden = false;
  show();
  schedule();
}
