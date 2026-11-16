// Fills site-wide values from site.config.json into HTML pages.
// Used by `npm run build` and by the local server, so dev and the live site show the same thing.
// Owner: Arya.
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

const rupees = (n) => "₹" + new Intl.NumberFormat("en-IN").format(n);
const keepBlock = (html, name, keep) =>
  html.replace(new RegExp(`<!-- ${name}:start -->([\\s\\S]*?)<!-- ${name}:end -->`, "g"), (_, inner) => (keep ? inner : ""));

export function renderHtml(html, cfg) {
  const site = cfg.siteUrl.endsWith("/") ? cfg.siteUrl : `${cfg.siteUrl}/`;
  const c = cfg.campaign || {};
  const goal = Number(c.goal) || 0;
  const raised = Math.max(0, Number(c.raised) || 0);
  const percent = goal ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  html = keepBlock(html, "campaign", Boolean(c.show) && goal > 0); // the whole progress area
  html = keepBlock(html, "raised", raised > 0); // "₹X raised of ₹Y" + bar, once there is money in
  html = keepBlock(html, "goalonly", raised === 0); // just the goal, before the first donation is counted

  return html
    .replaceAll("%SITE_URL%", site)
    .replaceAll("%CAMPAIGN_GOAL%", rupees(goal))
    .replaceAll("%CAMPAIGN_RAISED%", rupees(raised))
    .replaceAll("%CAMPAIGN_PERCENT%", String(percent))
    .replaceAll("%CAMPAIGN_END%", c.endLabel || "");
}
