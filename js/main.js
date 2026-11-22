// Mobile menu: the menu button opens and closes it; tapping a link or pressing Esc closes it
const btn = document.getElementById('menu-btn');
const mobileNav = document.getElementById('mobile-nav');
const closeMenu = () => {
  mobileNav.classList.add('hidden'); mobileNav.classList.remove('flex');
  btn.setAttribute('aria-expanded', 'false');
};
btn.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('hidden') === false;
  mobileNav.classList.toggle('flex', open);
  btn.setAttribute('aria-expanded', String(open));
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !mobileNav.classList.contains('hidden')) { closeMenu(); btn.focus(); }
});

// Videos of the kids (home page, Student Journeys): no right-click "Save video as". Together with
// controlslist="nodownload" (which hides the player's own Download button) this stops casual saving. It can't stop a
// determined person, so every video must have every kid's face blurred all the way through.
document.querySelectorAll('video').forEach((video) => video.addEventListener('contextmenu', (event) => event.preventDefault()));

// Arriving at a section (e.g. the menu's Donate button opens fundraiser.html#give): once everything has loaded, jump
// straight to it, then switch on smooth scrolling for links within the page.
window.addEventListener('load', () => {
  const target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (target) target.scrollIntoView();
  document.documentElement.classList.add('smooth-scroll');
});
