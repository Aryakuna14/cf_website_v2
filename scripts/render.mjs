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
// Everything from stories.json is escaped, so a quote can never add HTML or scripts to the page.
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const PHOTO = /^images\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png)$/;
const BADGE = '<span class="inline-block mb-4 rounded-full bg-ink text-white text-xs font-bold uppercase tracking-wider px-3 py-1">Placeholder</span>';

function stars(rating, color) {
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return "";
  return `<p class="${color} text-xl tracking-widest mb-3" role="img" aria-label="Rated ${n} out of 5">${"★".repeat(n)}${"☆".repeat(5 - n)}</p>`;
}

function person(s, nameSize) {
  const photo = PHOTO.test(s.photo || "")
    ? `<img src="${esc(s.photo)}" width="64" height="64" loading="lazy" alt="" class="h-14 w-14 rounded-full object-cover shrink-0">`
    : "";
  return `<figcaption class="mt-6 flex items-center gap-4">${photo}<span><span class="block font-extrabold ${nameSize}">${esc(s.name)}</span><span class="block">${esc(s.role)}</span></span></figcaption>`;
}

function featuredCard(s) {
  const look = s.placeholder ? "bg-white border-2 border-dashed border-ink/40" : "bg-sun";
  return `<figure class="offset-card ${look} text-black p-8 sm:p-12 mt-12 max-w-4xl mx-auto mr-4 sm:mr-auto text-left">
          ${s.placeholder ? BADGE : ""}${stars(s.rating, "text-black")}
          <blockquote><p class="heading heading-lg">“${esc(s.quote)}”</p></blockquote>
          ${person(s, "text-lg")}
        </figure>`;
}

function card(s) {
  const look = s.placeholder ? "bg-bg border-2 border-dashed border-ink/40" : "bg-white border border-line";
  return `<figure class="break-inside-avoid mb-6 rounded-2xl p-7 ${look}">
          ${s.placeholder ? BADGE : ""}${stars(s.rating, "text-pink")}
          <blockquote><p class="text-lg leading-relaxed">“${esc(s.quote)}”</p></blockquote>
          ${person(s, "")}
        </figure>`;
}

export function renderStories(html, stories) {
  if (!html.includes("<!-- stories:")) return html;
  const list = (Array.isArray(stories) ? stories : []).filter((s) => s && typeof s === "object");
  const featured = list.find((s) => s.featured) || list[0];
  const rest = list.filter((s) => s !== featured);
  const hidden = list.length === 0 || list.some((s) => s.placeholder); // keep out of search until real stories
  const more = rest.length
    ? `<section class="band" aria-labelledby="more-title">
    <div class="wrap">
      <h2 id="more-title" class="display impact-title">More stories</h2>
      <div class="mt-10 columns-1 md:columns-2 lg:columns-3 gap-6">
        ${rest.map(card).join("\n        ")}
      </div>
    </div>
  </section>`
    : "";
  return html
    .replace("<!-- stories:robots -->", hidden ? '<meta name="robots" content="noindex">' : "")
    .replace("<!-- stories:featured -->", featured ? featuredCard(featured) : '<p class="lede mt-10 mx-auto">Stories from Maho\'s volunteers are coming soon.</p>')
    .replace("<!-- stories:more -->", more);
}

export function renderHtml(html, cfg) {
  const site = cfg.siteUrl.endsWith("/") ? cfg.siteUrl : `${cfg.siteUrl}/`;
  return renderStories(html, cfg.stories).replaceAll("%SITE_URL%", site);
}
