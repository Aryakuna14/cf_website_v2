// Mobile menu toggle
const btn = document.getElementById('menu-btn');
const mobileNav = document.getElementById('mobile-nav');
btn.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('hidden') === false;
  mobileNav.classList.toggle('flex', open);
  btn.setAttribute('aria-expanded', String(open));
});
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  mobileNav.classList.add('hidden'); mobileNav.classList.remove('flex');
}));

// Arriving at a section (e.g. the menu's Donate button opens fundraiser.html#give): once everything has loaded, jump
// straight to it, then switch on smooth scrolling for links within the page.
window.addEventListener('load', () => {
  const target = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  if (target) target.scrollIntoView();
  document.documentElement.classList.add('smooth-scroll');
});
