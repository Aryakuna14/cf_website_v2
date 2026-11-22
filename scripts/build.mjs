// Builds the production site into dist/ (what gets deployed).
// Usage: npm run build
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, qrImages, qrSvg, renderHtml } from "./render.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const config = loadConfig(root);
const dist = join(root, "dist");
const tailwindCli = join(root, "node_modules", "tailwindcss", "lib", "cli.js");

if (!existsSync(tailwindCli)) {
  console.error("Tailwind is not installed. Run `npm install` first.");
  process.exit(1);
}

// 1. Start clean
rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, "css"), { recursive: true });

// 2. Build the minified stylesheet
const css = spawnSync(
  process.execPath,
  [tailwindCli, "-c", join(root, "tailwind.config.js"), "-i", join(root, "src", "input.css"), "-o", join(dist, "css", "styles.css"), "--minify"],
  { cwd: root, stdio: "inherit", env: { ...process.env, BROWSERSLIST_IGNORE_OLD_DATA: "1" } }
);
if (css.status !== 0) {
  console.error("CSS build failed.");
  process.exit(css.status ?? 1);
}

// 3. Copy the static files. Only what is listed here is published.
const copyIfExists = [
  "js", "images", "videos", "fonts", ".well-known",
  "robots.txt", "sitemap.xml", "CNAME", "_headers", "favicon.ico", "favicon.png", "favicon.svg", "apple-touch-icon.png",
];
for (const name of copyIfExists) {
  const from = join(root, name);
  if (existsSync(from)) cpSync(from, join(dist, name), { recursive: true });
}
// Pages: fill in the site address and campaign numbers from site.config.json
for (const file of readdirSync(root)) {
  if (file.endsWith(".html")) writeFileSync(join(dist, file), renderHtml(readFileSync(join(root, file), "utf8"), config));
}

// QR codes: the poster's (the address in site.config.json) and the donate one (U&I's donation page)
for (const [file, url] of Object.entries(qrImages(config))) writeFileSync(join(dist, file), await qrSvg(url));

// 4. Cache-busting: stamp each stylesheet/script link with a fingerprint of the file's contents
//    (e.g. css/styles.css?v=1a2b3c4d5e). When a file changes, its address changes, so browsers and
//    GitHub's caching servers can never pair a new page with an old stylesheet after an update.
const fingerprint = (file) => createHash("sha256").update(readFileSync(join(dist, file))).digest("hex").slice(0, 10);
const assets = ["css/styles.css", ...readdirSync(join(dist, "js")).filter((f) => f.endsWith(".js")).map((f) => `js/${f}`)];
const versions = Object.fromEntries(assets.filter((a) => existsSync(join(dist, a))).map((a) => [a, fingerprint(a)]));
for (const file of readdirSync(dist).filter((f) => f.endsWith(".html"))) {
  let html = readFileSync(join(dist, file), "utf8");
  for (const [asset, v] of Object.entries(versions)) {
    html = html.replaceAll(`"${asset}"`, `"${asset}?v=${v}"`).replaceAll(`"/${asset}"`, `"/${asset}?v=${v}"`); // "/..." only in 404.html
  }
  writeFileSync(join(dist, file), html);
}

// 5. Tell GitHub Pages not to run Jekyll (it would hide _headers and .well-known)
writeFileSync(join(dist, ".nojekyll"), "");

// 6. sitemap.xml and robots.txt for search engines, from the address in site.config.json. A page that is hidden from
//    search (it has placeholders, so it carries <meta name="robots" content="noindex">) is left out of the sitemap.
const site = config.siteUrl.endsWith("/") ? config.siteUrl : `${config.siteUrl}/`;
const listed = ["index.html", "fundraiser.html", "journeys.html", "stories.html", "volunteer.html", "privacy.html", "terms.html"]
  .filter((p) => existsSync(join(dist, p)) && !/^<meta name="robots" content="noindex">/m.test(readFileSync(join(dist, p), "utf8")));
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${listed.map((p) => `  <url><loc>${site}${p === "index.html" ? "" : p}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`);

console.log("Built site in dist/");
