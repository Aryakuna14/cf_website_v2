// Fills site-wide values into HTML pages: the site address (site.config.json) and the volunteer stories
// (stories.json, shown on stories.html). Used by `npm run build` and by the local server, so dev and the live
// site show the same thing. Owner: Arya.
// Fundraising targets, totals and dates are deliberately NOT supported: they stay private to the team.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";

export function loadConfig(root) {
  const cfg = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
  const storiesFile = join(root, "stories.json");
  cfg.stories = existsSync(storiesFile) ? JSON.parse(readFileSync(storiesFile, "utf8")).stories || [] : [];
  const journeysFile = join(root, "journeys.json");
  cfg.journeys = existsSync(journeysFile) ? JSON.parse(readFileSync(journeysFile, "utf8")).journeys || [] : [];
  return cfg;
}

// QR code (SVG) for the printable poster
export function qrSvg(url) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#201e1e", light: "#ffffff" } });
}

// U&I's own donation page: the only place payments happen
export const DONATE_URL = "https://uandi.org.in/donatenow";

// QR code images the build makes (they're not in the repo): file path -> the address it opens
export function qrImages(cfg) {
  return { "images/qr.svg": cfg.siteUrl, "images/qr-donate.svg": DONATE_URL };
}

// ---- Volunteer stories ----
// Layout, per story: the volunteer's photo on the left, their words on the right in a yellow card with a pink block
// behind it (the same look as the "#InThisTogether moment" section on fundraiser.html), on a teal background.
// Everything from stories.json is escaped, so a quote can never add HTML or scripts to the page.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const PHOTO = /^images\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png)$/;
const BADGE = '<span class="inline-block mb-4 rounded-full bg-ink text-white text-xs font-bold uppercase tracking-wider px-3 py-1">Placeholder</span>';

function stars(rating) {
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return "";
  return `<p class="text-ink text-xl tracking-widest mt-3" role="img" aria-label="Rated ${n} out of 5">${"★".repeat(n)}${"☆".repeat(5 - n)}</p>`;
}

// Portrait (3:4), the shape of a normal phone photo, so volunteers' photos need no cropping
function photo(s) {
  if (PHOTO.test(s.photo || "")) {
    return `<div class="photo"><img src="${esc(s.photo)}" width="900" height="1200" loading="lazy" alt="${esc(s.name)}, a volunteer at Maho" class="block w-full h-auto aspect-[3/4] object-cover"></div>`;
  }
  return `<div class="aspect-[3/4] rounded-[0.9rem] border-2 border-dashed border-ink/60 grid place-items-center text-ink font-bold text-lg">Photo coming soon</div>`;
}

// The quote: a short one is big and bold like the fundraiser card; a long one uses a calmer size so it stays easy
// to read. A line break in stories.json starts a new paragraph.
function quote(text) {
  const paras = String(text || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);
  const short = String(text || "").length <= 110;
  const cls = short ? "heading heading-lg" : "text-[clamp(1.05rem,1.35vw,1.2rem)] font-semibold leading-relaxed";
  return paras.map((p, n) => `<p class="${cls} ${n ? "mt-4" : "mt-3"}">${n ? "" : "“"}${esc(p)}${n === paras.length - 1 ? "”" : ""}</p>`).join("");
}

function story(s, i) {
  return `<article class="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center ${i === 0 ? "mt-12 lg:mt-16" : "mt-16 lg:mt-24"}" aria-label="Story ${i + 1}">
        <div class="lg:col-span-5">${photo(s)}</div>
        <figure class="offset-card bg-yellow p-8 sm:p-10 lg:col-span-6 lg:col-start-7 mr-4 lg:mr-4">
          ${s.placeholder ? BADGE : ""}<p class="eyebrow">${esc(s.role)}</p>${stars(s.rating)}
          <blockquote>${quote(s.quote)}</blockquote>
          <figcaption class="mt-5 text-lg font-bold">${esc(s.name)}</figcaption>
        </figure>
      </article>`;
}

export function renderStories(html, stories) {
  if (!html.includes("<!-- stories:")) return html;
  const list = (Array.isArray(stories) ? stories : []).filter((s) => s && typeof s === "object");
  const hidden = list.length === 0 || list.some((s) => s.placeholder); // keep out of search until real stories
  const body = list.length
    ? list.map(story).join("\n      ")
    : '<p class="lede mt-10 mx-auto text-center">Stories from Maho\'s volunteers are coming soon.</p>';
  return html
    .replace("<!-- stories:robots -->", hidden ? '<meta name="robots" content="noindex">' : "")
    .replace("<!-- stories:list -->", body);
}

// ---- Student journeys (journeys.html, from journeys.json) ----
// Anonymous, never a photo: every journey shows the same drawn kid (in rotating site colours), a title, the kid's
// interests as small icons, and one sentence from the volunteer's story. "Read the story" opens the tile in place
// (a <details> element: no script needed, works with a keyboard and screen readers) to show the whole story,
// poster-style. No names, ages or classes, ever: npm run check refuses what it can spot.
export const INTERESTS = {
  running: ["Running", '<circle cx="15" cy="4.5" r="2"/><path d="M7.5 21l3-5 3 2.5V22M10.5 16l1.5-6 4 2.5 3.5-.5M12 10l-3.5 1-2 3.5"/>'],
  football: ["Football", '<circle cx="12" cy="12" r="9"/><path d="M12 7.8l3.6 2.6-1.4 4.2H9.8l-1.4-4.2z"/><path d="M12 7.8V3M15.6 10.4l4.6-1.5M14.2 14.6l2.8 3.9M9.8 14.6 7 18.5M8.4 10.4 3.8 8.9"/>'],
  cricket: ["Cricket", '<path d="M13 5l6 6-9.5 9.5-6-6z"/><path d="M16 8l4.5-4.5"/><circle cx="5.5" cy="5.5" r="2"/>'],
  badminton: ["Badminton", '<circle cx="12" cy="18.5" r="2.5"/><path d="M9.6 17.3 6 4h12l-3.6 13.3M9 4l1.6 12.5M15 4l-1.6 12.5M12 4v12.5"/>'],
  art: ["Colours", '<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-2s-1-1.6-1-2.6.9-1.4 2-1.4h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14.5" cy="7" r="1"/>'],
  reading: ["Reading", '<path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z"/><path d="M12 6v14"/>'],
};
// Doodles for kids whose interests we don't know: learning things, never a made-up hobby
const DOODLES = {
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6l-5.4 2.9 1.2-6-4.5-4.2 6.1-.7z"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  book: INTERESTS.reading[1],
};
const KID_COLOURS = [["fill-yellow", "fill-crimson"], ["fill-teal", "fill-yellow"], ["fill-pink", "fill-teal"]]; // [circle, shirt]
const ICON_COLOURS = ["text-crimson", "text-teal", "text-pink", "text-ink"];
// Where the icons sit around the kid, poster-style (up to six)
const SLOTS = ["top-1 left-1 -rotate-12", "top-1 right-1 rotate-12", "bottom-1 left-1 rotate-6", "bottom-1 right-1 -rotate-6",
  "top-1/2 -translate-y-1/2 left-0", "top-1/2 -translate-y-1/2 right-0"];

// The drawn kid: same for every journey (never a real child), holding a book
function kid(i) {
  const [circle, shirt] = KID_COLOURS[i % KID_COLOURS.length];
  const skin = "#8d5a3b", hair = "#231a16";
  return `<svg viewBox="0 0 120 120" class="relative w-36 h-36 sm:w-40 sm:h-40" aria-hidden="true">
            <defs><clipPath id="kid-${i}"><circle cx="60" cy="60" r="60"/></clipPath></defs>
            <g clip-path="url(#kid-${i})">
              <circle cx="60" cy="60" r="60" class="${circle}"/>
              <path d="M16 124c2-24 20-38 44-38s42 14 44 38z" class="${shirt}"/>
              <path d="M51 74h18v14c0 4-4 7-9 7s-9-3-9-7z" fill="${skin}"/>
              <circle cx="37" cy="56" r="6" fill="${skin}"/><circle cx="83" cy="56" r="6" fill="${skin}"/>
              <circle cx="60" cy="54" r="24" fill="${skin}"/>
              <path d="M36 54C33 36 45 26 60 26S87 36 84 52C79 44 72 40 65 40C58 45 47 46 40 45C38 47 37 50 36 54Z" fill="${hair}"/>
              <circle cx="51" cy="57" r="2.6" class="fill-ink"/><circle cx="69" cy="57" r="2.6" class="fill-ink"/>
              <path d="M51 66c5 6 13 6 18 0" fill="none" class="stroke-ink" stroke-width="3" stroke-linecap="round"/>
              <path d="M40 100c7-3 14-3 20 1 6-4 13-4 20-1v19c-7-3-14-3-20 1-6-4-13-4-20-1z" class="fill-bg stroke-ink" stroke-width="2.5" stroke-linejoin="round"/>
              <path d="M60 101v19" class="stroke-ink" stroke-width="2.5"/>
              <circle cx="40" cy="108" r="5" fill="${skin}"/><circle cx="80" cy="108" r="5" fill="${skin}"/>
            </g>
          </svg>`;
}

// The kid in the middle with icons scattered around: their interests if the volunteer told us, otherwise doodles
function poster(j, i) {
  const known = (Array.isArray(j.interests) ? j.interests : []).filter((k) => INTERESTS[k]).slice(0, SLOTS.length);
  const icons = known.length ? known.map((k) => INTERESTS[k][1]) : [DOODLES.star, DOODLES.book, DOODLES.pencil, DOODLES.star];
  const around = icons.map((svg, n) => `<svg viewBox="0 0 24 24" class="absolute ${SLOTS[n]} w-10 h-10 sm:w-12 sm:h-12 ${ICON_COLOURS[(n + i) % ICON_COLOURS.length]}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svg}</svg>`).join("\n            ");
  return `<div class="relative mx-auto max-w-xs sm:max-w-sm h-44 sm:h-52 flex items-center justify-center">
            ${around}
            ${kid(i)}
          </div>`;
}

const listWords = (words) => (words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`);
function loves(interests) {
  const known = (Array.isArray(interests) ? interests : []).filter((k) => INTERESTS[k]);
  if (!known.length) return "";
  return `<p class="mt-2 text-sm font-semibold text-ink/75">Loves ${listWords(known.map((k) => INTERESTS[k][0].toLowerCase()))}</p>`;
}

const storyOf = (j) => j.story || [j.before, j.after].filter(Boolean).join(" ");
const firstSentence = (text) => (String(text).match(/^.*?[.!?](\s|$)/) || [text])[0].trim();

function journey(j, i) {
  const story = storyOf(j);
  const highlight = j.highlight || firstSentence(story);
  const by = j.teacher ? `Volunteer: ${esc(j.teacher)}` : "Shared by their volunteer teacher";
  return `<details class="journey-tile offset-card bg-bg mr-4">
        <summary class="block cursor-pointer p-7 sm:p-8 text-center">
          ${poster(j, i)}
          <div class="mt-5">${j.placeholder ? BADGE : ""}</div>
          <p class="eyebrow">A student at Maho</p>
          <h2 class="heading text-[clamp(1.4rem,2.3vw,1.85rem)] mt-2">${esc(j.title)}</h2>
          ${loves(j.interests)}
          <p class="tile-teaser mt-5 text-lg font-semibold leading-relaxed max-w-md mx-auto">“${esc(highlight)}”</p>
          <span class="btn btn-sm btn-dark mt-6"><span class="tile-closed">Read the story</span><span class="tile-open">Close the story</span></span>
        </summary>
        <div class="px-7 sm:px-8 pb-8 text-center">
          <div class="border-t-2 border-ink pt-6">
            <p class="text-lg leading-relaxed max-w-prose mx-auto">${esc(story)}</p>
            <p class="mt-6 font-bold">${by}</p>
          </div>
        </div>
      </details>`;
}

export function renderJourneys(html, journeys) {
  if (!html.includes("<!-- journeys:")) return html;
  const list = (Array.isArray(journeys) ? journeys : []).filter((j) => j && typeof j === "object");
  const hidden = list.length === 0 || list.some((j) => j.placeholder); // keep out of search until real journeys
  const body = list.length
    ? `<div class="mt-12 lg:mt-16 grid md:grid-cols-2 gap-x-10 gap-y-12 items-start max-w-5xl mx-auto">\n      ${list.map(journey).join("\n      ")}\n      </div>`
    : '<p class="lede mt-10 mx-auto text-center">Stories of how the kids at Maho grow are coming soon.</p>';
  return html
    .replace("<!-- journeys:robots -->", hidden ? '<meta name="robots" content="noindex">' : "")
    .replace("<!-- journeys:list -->", body);
}

export function renderHtml(html, cfg) {
  const site = cfg.siteUrl.endsWith("/") ? cfg.siteUrl : `${cfg.siteUrl}/`;
  return renderJourneys(renderStories(html, cfg.stories), cfg.journeys).replaceAll("%SITE_URL%", site);
}
