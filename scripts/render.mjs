// Fills site-wide values from site.config.json into HTML pages.
// Used by `npm run build` and by the local server, so dev and the live site show the same thing.
// Owner: Arya.
// Fundraising targets, totals and dates are deliberately NOT supported: they stay private to the team.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import QRCode from "qrcode";

export function loadConfig(root) {
  return JSON.parse(readFileSync(join(root, "site.config.json"), "utf8"));
}

// QR code (SVG) for the printable poster
export function qrSvg(url) {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 2, color: { dark: "#201e1e", light: "#ffffff" } });
}

export function renderHtml(html, cfg) {
  const site = cfg.siteUrl.endsWith("/") ? cfg.siteUrl : `${cfg.siteUrl}/`;
  return html.replaceAll("%SITE_URL%", site);
}
