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
// Anonymous: a short title, what the kid was like when they started, how they've grown, and (optionally) the
// volunteer teacher who tells it. No photos, names, ages or classes, ever: npm run check refuses them.
function journey(j, i) {
  const by = j.teacher ? `Shared by ${esc(j.teacher)}, their volunteer teacher` : "Shared by their volunteer teacher";
  return `<div class="max-w-4xl mx-auto pr-4 ${i === 0 ? "mt-12 lg:mt-16" : "mt-14 lg:mt-16"}">
        <article class="offset-card bg-teal p-8 sm:p-10" aria-label="Journey ${i + 1}">
          ${j.placeholder ? BADGE : ""}<p class="eyebrow">A student at Maho</p>
          <h2 class="heading heading-lg mt-3">${esc(j.title)}</h2>
          <div class="mt-8 grid md:grid-cols-2 gap-8">
            <div class="border-t-2 border-ink pt-4"><h3 class="impact-label fact-label">When they started</h3><p class="mt-3 text-lg leading-relaxed">${esc(j.before)}</p></div>
            <div class="border-t-2 border-ink pt-4"><h3 class="impact-label fact-label">Now</h3><p class="mt-3 text-lg leading-relaxed">${esc(j.after)}</p></div>
          </div>
          <p class="mt-8 font-bold">${by}</p>
        </article>
      </div>`;
}

export function renderJourneys(html, journeys) {
  if (!html.includes("<!-- journeys:")) return html;
  const list = (Array.isArray(journeys) ? journeys : []).filter((j) => j && typeof j === "object");
  const hidden = list.length === 0 || list.some((j) => j.placeholder); // keep out of search until real journeys
  const body = list.length
    ? list.map(journey).join("\n      ")
    : '<p class="lede mt-10 mx-auto text-center">Stories of how the kids at Maho grow are coming soon.</p>';
  return html
    .replace("<!-- journeys:robots -->", hidden ? '<meta name="robots" content="noindex">' : "")
    .replace("<!-- journeys:list -->", body);
}

export function renderHtml(html, cfg) {
  const site = cfg.siteUrl.endsWith("/") ? cfg.siteUrl : `${cfg.siteUrl}/`;
  return renderJourneys(renderStories(html, cfg.stories), cfg.journeys).replaceAll("%SITE_URL%", site);
}
