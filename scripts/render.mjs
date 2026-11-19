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
  return cfg;
}

// QR code (SVG) for the printable poster
export function qrSvg(url) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#201e1e", light: "#ffffff" } });
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

function photo(s) {
  if (PHOTO.test(s.photo || "")) {
    return `<div class="photo"><img src="${esc(s.photo)}" width="1200" height="900" loading="lazy" alt="${esc(s.name)}, a volunteer at Maho" class="block w-full h-auto aspect-[4/3] object-cover"></div>`;
  }
  return `<div class="aspect-[4/3] rounded-[0.9rem] border-2 border-dashed border-ink/60 grid place-items-center text-ink font-bold text-lg">Photo coming soon</div>`;
}

function story(s, i) {
  // Long quotes get a smaller size so the card stays readable
  const size = String(s.quote || "").length <= 110 ? "heading-lg" : "text-[clamp(1.2rem,1.8vw,1.5rem)] leading-snug";
  return `<article class="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center ${i === 0 ? "mt-12 lg:mt-16" : "mt-16 lg:mt-24"}" aria-label="Story ${i + 1}">
        <div class="lg:col-span-6">${photo(s)}</div>
        <figure class="offset-card bg-yellow p-8 sm:p-10 lg:col-span-5 lg:col-start-8 mr-4 lg:mr-4">
          ${s.placeholder ? BADGE : ""}<p class="eyebrow">${esc(s.role)}</p>${stars(s.rating)}
          <blockquote><p class="heading ${size} mt-3">“${esc(s.quote)}”</p></blockquote>
          <figcaption class="mt-4 text-lg font-bold">${esc(s.name)}</figcaption>
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

export function renderHtml(html, cfg) {
  const site = cfg.siteUrl.endsWith("/") ? cfg.siteUrl : `${cfg.siteUrl}/`;
  return renderStories(html, cfg.stories).replaceAll("%SITE_URL%", site);
}
