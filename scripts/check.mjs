// Safety checks on the built site (dist/). Run after `npm run build`:  npm run check
// Fails (exit code 1) on problems that would break the live site or weaken security.
// Owner: Arya.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DONATE_URL } from "./render.mjs";

// Donation pages and payment services the site must never link to: every payment goes to the Maho team's UPI only
const PAYMENT_SITES = /uandi\.org\.in\/donate|razorpay|instamojo|paypal\.|ko-fi\.com|buymeacoffee|paytm\.me|p\.paytm|phon\.pe|gpay\.app|pay\.google|milaap|ketto|givedo|donorbox|gofundme/i;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

// Third-party domains the page may LOAD things from (scripts, styles, images, frames).
// Plain links (<a href>) to other sites are always fine. Add a domain here only after a security review,
// and add it to the Content-Security-Policy in index.html, _headers and vercel.json too.
const allowedExternalHosts = [];

const errors = [];
const warnings = [];

if (!existsSync(join(dist, "index.html"))) {
  console.error("dist/index.html is missing. Run `npm run build` first.");
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const files = walk(dist);
const rel = (f) => relative(dist, f).replace(/\\/g, "/");

// ---- Security policy (CSP): must exist, be strict, and be identical in index.html, _headers and vercel.json ----
const cspDirectives = (p = "") => p.split(";").map((d) => d.trim().replace(/\s+/g, " ")).filter(Boolean);
const normCsp = (p, { dropFrameAncestors = false } = {}) =>
  cspDirectives(p).filter((d) => !(dropFrameAncestors && d.startsWith("frame-ancestors"))).sort().join("; ");
const cspSources = (p, name) => (cspDirectives(p).find((d) => d.split(" ")[0] === name) || "").split(" ").slice(1);
const metaCsp = (html) => (html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]+)"/i) || [])[1];

const pageCsp = metaCsp(readFileSync(join(dist, "index.html"), "utf8"));
const headerFile = join(root, "_headers");
const vercelFile = join(root, "vercel.json");
const fromHeadersFile = existsSync(headerFile)
  ? Object.fromEntries(readFileSync(headerFile, "utf8").split(/\r?\n/).filter((l) => /^\s+[\w-]+:/.test(l)).map((l) => { const i = l.indexOf(":"); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }))
  : null;
const fromVercel = existsSync(vercelFile)
  ? Object.fromEntries((JSON.parse(readFileSync(vercelFile, "utf8")).headers?.[0]?.headers || []).map((h) => [h.key, h.value]))
  : null;
const requiredHeaders = ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"];

if (!pageCsp) errors.push("index.html has no Content-Security-Policy <meta> tag.");
else {
  if (/'unsafe-inline'|'unsafe-eval'|(^|\s)\*(\s|;|$)/.test(pageCsp)) errors.push("The security policy allows 'unsafe-inline', 'unsafe-eval' or '*'. Remove it.");
  if (!cspSources(pageCsp, "default-src").includes("'none'")) errors.push("The security policy must start from default-src 'none'.");
}
for (const [name, headers] of [["_headers", fromHeadersFile], ["vercel.json", fromVercel]]) {
  if (!headers) { errors.push(`${name} is missing (security headers for Cloudflare Pages / Netlify / Vercel).`); continue; }
  for (const h of requiredHeaders) if (!headers[h]) errors.push(`${name} is missing the ${h} header.`);
  const csp = headers["Content-Security-Policy"] || "";
  if (!cspSources(csp, "frame-ancestors").includes("'none'")) errors.push(`${name}: Content-Security-Policy needs frame-ancestors 'none' (blocks clickjacking).`);
  if (pageCsp && normCsp(csp, { dropFrameAncestors: true }) !== normCsp(pageCsp)) {
    errors.push(`${name}: Content-Security-Policy differs from the one in index.html. Keep all three identical (plus frame-ancestors in the header files).`);
  }
}
if (fromHeadersFile && fromVercel) {
  for (const h of new Set([...Object.keys(fromHeadersFile), ...Object.keys(fromVercel)])) {
    if (h !== "Content-Security-Policy" && fromHeadersFile[h] !== fromVercel[h]) errors.push(`_headers and vercel.json disagree on ${h}.`);
  }
}

// ---- site.config.json: site address only (the repo is public: no fundraising numbers) ----
let siteUrl = "";
try {
  const cfg = JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
  siteUrl = cfg.siteUrl || "";
  if (!/^https:\/\/[^/]+\/.*\/$|^https:\/\/[^/]+\/$/.test(siteUrl)) errors.push(`site.config.json: siteUrl must start with https:// and end with "/" (got "${siteUrl}").`);
  if ("campaign" in cfg) errors.push("site.config.json: remove \"campaign\". Fundraising targets, totals and dates are private to the team, and this repo is public.");
} catch (e) {
  errors.push(`site.config.json is missing or not valid JSON (${e.message}). Check for a missing comma or quote.`);
}

// Checks one referenced URL found in `file`.
function checkUrl(file, url, { loads }) {
  const where = `${rel(file)}: "${url}"`;
  const u = url.trim();
  // Payments go to one place only: the UPI link in scripts/render.mjs (DONATE_URL)
  if (/^upi:/i.test(u)) {
    if (u.replace(/&amp;/g, "&") !== DONATE_URL) errors.push(`${where} is a UPI payment link that isn't the Maho team's. Every payment must go to DONATE_URL in scripts/render.mjs.`);
    return;
  }
  if (PAYMENT_SITES.test(u)) {
    errors.push(`${where} links to another payment page. Every payment must go to the Maho team's UPI (DONATE_URL in scripts/render.mjs), nowhere else.`);
    return;
  }
  if (!u || u.startsWith("#") || /^(mailto|tel|data|blob|javascript):/i.test(u)) {
    if (/^javascript:/i.test(u)) errors.push(`${where} uses a javascript: link. Use a normal link or a button with code in js/.`);
    return;
  }
  if (/^(https?:)?\/\//i.test(u)) {
    const host = new URL(u.startsWith("//") ? "https:" + u : u).hostname;
    if (u.startsWith("http:")) errors.push(`${where} uses insecure http://. Use https://.`);
    if (loads && !allowedExternalHosts.includes(host)) {
      errors.push(`${where} loads a file from another website (${host}). Self-host it, or get it approved and add it to allowedExternalHosts in scripts/check.mjs.`);
    }
    return;
  }
  if (u.startsWith("/") && rel(file) === "404.html") {
    // The "page not found" page is shown for any missing address, even deep ones, so it links from the site root
    const target = join(dist, decodeURIComponent(u.split(/[?#]/)[0]));
    if (!existsSync(target)) errors.push(`${where} points to a file that doesn't exist.`);
    return;
  }
  if (u.startsWith("/")) {
    errors.push(`${where} starts with "/". It will break on GitHub Pages, which serves the site from a sub-folder (/cf_website_v2/). Use a relative path like "${u.replace(/^\/+/, "")}".`);
    return;
  }
  const clean = decodeURIComponent(u.split(/[?#]/)[0]);
  if (!clean) return;
  let target = resolve(dirname(file), clean);
  if (existsSync(target) && statSync(target).isDirectory()) target = join(target, "index.html");
  if (!target.startsWith(dist) || !existsSync(target)) {
    errors.push(`${where} points to a file that isn't in the built site. Check the spelling, or that the file is copied in scripts/build.mjs.`);
  }
}

// Private details stay private: pages must not show money amounts or exact dates (month only).
// Checks the whole page source, comments included, because anyone can read those too.
// Exception: an amount that is deliberately public (U&I's own per-child donation prices) sits alone in an element
// marked data-public-amount, e.g. <dd data-public-amount>₹9,000</dd>. Only that element's own text is skipped.
const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";
const AMOUNT = /₹\s?\d|\bRs\.?\s?\d|\b\d+(\.\d+)?\s?(lakh|lakhs|lac|crore|crores|k)\b/i;
const DAY_MONTH = new RegExp(`\\b\\d{1,2}(st|nd|rd|th)?\\s+(${MONTHS})\\b|\\b(${MONTHS})\\s+\\d{1,2}(st|nd|rd|th)?\\b(?!\\d)`, "i");

for (const file of files) {
  if (file.endsWith(".html")) {
    const html = readFileSync(file, "utf8");
    const amount = html.replace(/(<[^>]*\sdata-public-amount(?:[\s=][^>]*)?>)[^<]*/g, "$1").match(AMOUNT);
    if (amount) errors.push(`${rel(file)}: shows a money amount ("${amount[0]}"). Fundraising targets and totals stay private: say it in words.`);
    const day = html.match(DAY_MONTH);
    if (day) errors.push(`${rel(file)}: shows an exact date ("${day[0]}"). Use the month only.`);
    for (const [, tag, attrs] of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
      const attr = {};
      for (const m of attrs.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attr[m[1].toLowerCase()] = m[3] ?? m[4];
      const t = tag.toLowerCase();
      if (attr.src) checkUrl(file, attr.src, { loads: true });
      // Every size in a srcset ("photo-800.webp 800w, photo-1600.webp 1600w") must exist too
      if (attr.srcset) for (const part of attr.srcset.split(",")) checkUrl(file, part.trim().split(/\s+/)[0], { loads: true });
      if (attr.poster) checkUrl(file, attr.poster, { loads: true }); // a video's preview picture
      if (attr.href) {
        const relAttr = (attr.rel || "").toLowerCase();
        const loads = t === "link" && relAttr !== "canonical" && relAttr !== "alternate";
        checkUrl(file, attr.href, { loads });
        if (t === "a" && attr.target === "_blank" && !/noopener/.test(relAttr)) {
          warnings.push(`${rel(file)}: link to "${attr.href}" opens a new tab without rel="noopener noreferrer".`);
        }
      }
      if (attr.action) {
        checkUrl(file, attr.action, { loads: false });
        // The page may only send data where the security policy allows it
        if (/^https:\/\//i.test(attr.action) && pageCsp) {
          const origin = new URL(attr.action).origin;
          for (const d of ["form-action", "connect-src"]) {
            if (!cspSources(pageCsp, d).includes(origin)) errors.push(`${rel(file)}: form sends to ${origin}, but the security policy's ${d} doesn't allow it.`);
          }
        }
      }
      const handlers = Object.keys(attr).filter((a) => /^on[a-z]+$/.test(a));
      if (handlers.length) errors.push(`${rel(file)}: <${t} ${handlers.join(" ")}="..."> is inline JavaScript, which the security policy blocks. Move it into a file in js/.`);
      if ("style" in attr) errors.push(`${rel(file)}: <${t} style="..."> is an inline style, which the security policy blocks. Use a class instead.`);
      // Cache-busting: stylesheet and script links must carry the build's ?v= fingerprint. Required: vercel.json lets
      // browsers keep css/ and js/ files for a year, so the fingerprint is the only way an update reaches them.
      const asset = (t === "link" && (attr.rel || "").toLowerCase() === "stylesheet" && attr.href) || (t === "script" && attr.src);
      if (asset && !/^https?:/i.test(asset) && !/\?v=[0-9a-f]{10}$/.test(asset)) {
        errors.push(`${rel(file)}: "${asset}" has no ?v= fingerprint, so visitors could get an old cached copy after an update. Build with npm run build.`);
      }
    }
    if (rel(file) !== "index.html") {
      const csp = metaCsp(html);
      if (!csp) errors.push(`${rel(file)} has no Content-Security-Policy <meta> tag. Copy the one from index.html.`);
      else if (pageCsp && normCsp(csp) !== normCsp(pageCsp)) errors.push(`${rel(file)}: its security policy differs from index.html's.`);
    }
    if (html.includes("REPLACE_WITH")) {
      warnings.push(`${rel(file)}: still contains a REPLACE_WITH placeholder that needs filling in.`);
    }
    // Build placeholders like %SITE_URL% must all be filled in (scripts/render.mjs)
    for (const m of new Set(html.match(/%[A-Z][A-Z_]+%/g) || [])) errors.push(`${rel(file)}: placeholder ${m} was not filled in. Check site.config.json and scripts/render.mjs.`);
    for (const m of html.matchAll(/<!-- [a-z]+:(start|end) -->/g)) errors.push(`${rel(file)}: leftover block marker "${m[0]}".`);
    // Link previews: must point at this site's own preview image, which must exist
    const og = (prop) => (html.match(new RegExp(`<meta\\s+property="${prop}"\\s+content="([^"]+)"`, "i")) || [])[1];
    if (og("og:image")) {
      if (siteUrl && !og("og:image").startsWith(siteUrl)) errors.push(`${rel(file)}: og:image must start with the siteUrl (${siteUrl}).`);
      const local = og("og:image").slice(siteUrl.length);
      if (!existsSync(join(dist, local))) errors.push(`${rel(file)}: the link-preview image ${local} is not in the built site.`);
      if (og("og:url") !== siteUrl && rel(file) === "index.html") errors.push(`index.html: og:url should be the siteUrl (${siteUrl}).`);
    }
    for (const m of html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)) {
      if (m[1].trim()) errors.push(`${rel(file)}: inline <script> block, which the security policy blocks. Move it into a file in js/.`);
    }
  }
  if (file.endsWith(".css")) {
    const css = readFileSync(file, "utf8");
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) checkUrl(file, m[1], { loads: true });
  }
}

// ---- stories.json: volunteer stories shown on stories.html (volunteers only, never a kid's story) ----
const storiesFile = join(root, "stories.json");
let placeholderStories = 0;
if (existsSync(storiesFile)) {
  try {
    const list = JSON.parse(readFileSync(storiesFile, "utf8")).stories;
    if (!Array.isArray(list)) throw new Error('"stories" must be a list in square brackets [ ... ]');
    list.forEach((s, i) => {
      const where = `stories.json, story ${i + 1}`;
      for (const k of ["name", "role", "quote"]) if (typeof s?.[k] !== "string" || !s[k].trim()) errors.push(`${where}: "${k}" is missing.`);
      if (typeof s?.quote === "string" && s.quote.length > 900) errors.push(`${where}: the quote is ${s.quote.length} characters. Keep it under 900.`);
      if (s?.years !== undefined && !/^\d{4}\s*[–-]\s*\d{4}$/.test(s.years)) errors.push(`${where}: "years" must look like "2025–2027".`);
      if (s?.rating !== undefined && !(Number.isInteger(s.rating) && s.rating >= 1 && s.rating <= 5)) errors.push(`${where}: "rating" must be a whole number from 1 to 5, or left out.`);
      if (s?.photo !== undefined && (!/^images\/[a-z0-9/_-]+\.(webp|jpg|jpeg|png)$/.test(s.photo) || !existsSync(join(root, s.photo)))) {
        errors.push(`${where}: "photo" must be a file in images/ with a lowercase name, e.g. images/stories/first-name.webp.`);
      }
      if (s?.placeholder) placeholderStories++;
      else if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(s?.consent || "")) {
        errors.push(`${where}: a real story needs "consent": the month the volunteer agreed in writing, like "2026-11".`);
      }
    });
  } catch (e) {
    errors.push(`stories.json is not valid (${e.message}). Check for a missing comma or quote.`);
  }
}
const storiesPage = join(dist, "stories.html");
if (existsSync(storiesPage) && readFileSync(storiesPage, "utf8").includes("<!-- stories:")) errors.push("stories.html: the story cards weren't filled in. Run npm run build.");
if (placeholderStories) {
  warnings.push(`stories.json has ${placeholderStories} placeholder stor${placeholderStories === 1 ? "y" : "ies"}: stories.html stays out of search results until they're replaced with real ones.`);
}

// ---- journeys.json: anonymous student journeys shown on journeys.html (Juvenile Justice Act, Section 74) ----
// Nothing that could identify a child: no photos, no ages, no class or grade. Names can't be detected
// automatically, so the help text in journeys.json and the shelter's OK ("shelterConsent") cover those.
const journeysFile = join(root, "journeys.json");
let placeholderJourneys = 0;
if (existsSync(journeysFile)) {
  const AGE_OR_CLASS = /\b\d{1,2}\s*-?\s*(?:years?|yrs?)\s*-?\s*old\b|\baged?\s+\d{1,2}\b|\b(?:class|grade|std\.?|standard)\s*\d{1,2}\b|\b\d{1,2}(?:st|nd|rd|th)\s+(?:class|grade|std|standard)\b/i;
  try {
    const list = JSON.parse(readFileSync(journeysFile, "utf8")).journeys;
    if (!Array.isArray(list)) throw new Error('"journeys" must be a list in square brackets [ ... ]');
    list.forEach((j, i) => {
      const where = `journeys.json, journey ${i + 1}`;
      if (typeof j?.title !== "string" || !j.title.trim()) errors.push(`${where}: "title" is missing.`);
      if (typeof j?.title === "string" && j.title.length > 80) errors.push(`${where}: the title is ${j.title.length} characters. Keep it under 80.`);
      // The story is either one "story", or "before" + "after"
      const hasStory = typeof j?.story === "string" && j.story.trim();
      if (!hasStory) for (const k of ["before", "after"]) if (typeof j?.[k] !== "string" || !j[k].trim()) errors.push(`${where}: needs a "story" (or "before" and "after").`);
      if (hasStory && j.story.length > 900) errors.push(`${where}: the story is ${j.story.length} characters. Keep it under 900.`);
      for (const k of ["before", "after"]) if (typeof j?.[k] === "string" && j[k].length > 500) errors.push(`${where}: "${k}" is ${j[k].length} characters. Keep it under 500.`);
      // The highlight on the closed tile must be the volunteer's own words, copied from the story
      const fullStory = (hasStory ? j.story : [j?.before, j?.after].filter(Boolean).join(" ")).replace(/\s+/g, " ");
      if (j?.highlight !== undefined && (typeof j.highlight !== "string" || !fullStory.includes(j.highlight.replace(/\s+/g, " ").trim()))) {
        errors.push(`${where}: "highlight" must be one sentence copied word for word from the story.`);
      }
      const knownInterests = ["running", "football", "cricket", "badminton", "art", "reading"]; // icons in scripts/render.mjs
      if (j?.interests !== undefined && (!Array.isArray(j.interests) || j.interests.some((k) => !knownInterests.includes(k)))) {
        errors.push(`${where}: "interests" can only use: ${knownInterests.join(", ")}.`);
      }
      for (const k of ["photo", "image", "picture", "name", "age"]) if (j?.[k] !== undefined) errors.push(`${where}: remove "${k}". This page never shows a child's photo, name or age.`);
      for (const k of ["title", "before", "after", "story", "highlight"]) if (typeof j?.[k] === "string" && AGE_OR_CLASS.test(j[k])) errors.push(`${where}: "${k}" mentions an age or a class/grade ("${j[k].match(AGE_OR_CLASS)[0]}"). Remove it: it could identify the child.`);
      if (j?.placeholder) placeholderJourneys++;
      else if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(j?.shelterConsent || "")) {
        errors.push(`${where}: a real journey needs "shelterConsent": the month the shelter agreed in writing, like "2026-11".`);
      }
    });
  } catch (e) {
    errors.push(`journeys.json is not valid (${e.message}). Check for a missing comma or quote.`);
  }
}
const journeysPage = join(dist, "journeys.html");
if (existsSync(journeysPage) && readFileSync(journeysPage, "utf8").includes("<!-- journeys:")) errors.push("journeys.html: the journey cards weren't filled in. Run npm run build.");
if (placeholderJourneys) {
  warnings.push(`journeys.json has ${placeholderJourneys} placeholder journey${placeholderJourneys === 1 ? "" : "s"}: journeys.html stays out of search results until they're replaced with real ones.`);
}

// Every page with the site menu must have the same menu (same labels, same destinations), so visitors never get lost.
// On the home page, links to its own sections are written "#about"; elsewhere "index.html#about". Both count as the same.
function menusOf(file) {
  const html = readFileSync(file, "utf8");
  const onHome = rel(file) === "index.html";
  return [...html.matchAll(/<nav\b[^>]*aria-label="Main"[^>]*>([\s\S]*?)<\/nav>/g)].map(([, inner]) =>
    [...inner.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/g)].map(([, href, label]) => {
      const to = onHome && href === "#top" ? "index.html" : onHome && href.startsWith("#") ? "index.html" + href : href;
      return `${label.trim()} -> ${to}`;
    }).join(", "));
}
const homeMenus = menusOf(join(dist, "index.html"));
for (const file of files.filter((f) => f.endsWith(".html"))) {
  const menus = menusOf(file);
  if (!menus.length) continue; // pages without the site menu (e.g. the printable poster)
  for (const menu of menus) {
    if (menu !== homeMenus[0]) {
      errors.push(`${rel(file)}: its menu differs from the home page's. Copy the <header> from index.html (only aria-current changes).\n           home: ${homeMenus[0]}\n           here: ${menu}`);
      break;
    }
  }
}

// security.txt must have a Contact and a future Expires date (RFC 9116)
const securityTxt = join(dist, ".well-known", "security.txt");
if (existsSync(securityTxt)) {
  const txt = readFileSync(securityTxt, "utf8");
  const expires = txt.match(/^Expires:\s*(.+)$/m);
  const daysLeft = expires ? (Date.parse(expires[1].trim()) - Date.now()) / 86400000 : NaN;
  if (!/^Contact:\s*\S+/m.test(txt)) errors.push(".well-known/security.txt has no Contact line.");
  if (Number.isNaN(daysLeft)) errors.push(".well-known/security.txt needs a valid Expires date.");
  else if (daysLeft < 0) errors.push(".well-known/security.txt has expired. Set Expires to a date up to a year ahead.");
  else if (daysLeft < 30) warnings.push(`.well-known/security.txt expires in ${Math.floor(daysLeft)} days. Move Expires a year ahead.`);
}

for (const w of warnings) console.warn("warning: " + w);
for (const e of errors) console.error("ERROR:   " + e);
if (errors.length) {
  console.error(`\n${errors.length} problem(s) found. Fix them before merging.`);
  process.exit(1);
}
console.log(`Checks passed (${files.length} files${warnings.length ? `, ${warnings.length} warning(s)` : ""}).`);
