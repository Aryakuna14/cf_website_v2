// Safety checks on the built site (dist/). Run after `npm run build`:  npm run check
// Fails (exit code 1) on problems that would break the live site or weaken security.
// Owner: Arya.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

// Checks one referenced URL found in `file`.
function checkUrl(file, url, { loads }) {
  const where = `${rel(file)}: "${url}"`;
  const u = url.trim();
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

for (const file of files) {
  if (file.endsWith(".html")) {
    const html = readFileSync(file, "utf8");
    for (const [, tag, attrs] of html.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
      const attr = {};
      for (const m of attrs.matchAll(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g)) attr[m[1].toLowerCase()] = m[3] ?? m[4];
      const t = tag.toLowerCase();
      if (attr.src) checkUrl(file, attr.src, { loads: true });
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
      // Cache-busting: stylesheet and script links must carry the build's ?v= fingerprint
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
      warnings.push(`${rel(file)}: still contains a REPLACE_WITH placeholder (e.g. the contact form isn't connected to Formspree yet).`);
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
