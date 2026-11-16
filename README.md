# U&I x Maho website

Sponsor/donation website for U&I x Maho. Static site styled with Tailwind CSS. Team plan: [WORKFLOW.md](WORKFLOW.md).

Live site: https://aryakuna14.github.io/cf_website_v2/

## First-time setup
1. Install [Node.js](https://nodejs.org) version 20 or newer (the "LTS" download).
2. In this folder run:
   ```
   npm install
   ```

## Everyday commands
| Command | What it does |
|---|---|
| `npm run dev` | Starts the site at http://localhost:8000 and rebuilds the styles every time you save. Use this while working. Stop it with Ctrl+C. |
| `npm run build` | Makes the final website in the `dist/` folder. This is what gets published. |
| `npm run preview` | Builds, then serves `dist/` at http://localhost:8000/cf_website_v2/, the same address shape as GitHub Pages. Use it to check nothing breaks before a PR. |
| `npm run check` | After a build, checks for broken file links, paths that would break on GitHub Pages, files loaded from other websites, and insecure links. The same check runs automatically on every PR. |

## How publishing works
- Every pull request is built and checked automatically (`.github/workflows/pr-check.yml`). A red cross on the PR means something is broken: open the "Details" link to see what.
- Every merge into `main` publishes the site to GitHub Pages automatically (`.github/workflows/deploy.yml`). Nothing needs uploading by hand.
- One-time setup by the repo owner: **Settings > Pages > Source = GitHub Actions**.

## Update the fundraising total (no coding needed)
The "raised so far" bar in the Donate section reads from `site.config.json`.
1. On GitHub, open `site.config.json` and click the pencil icon (Edit).
2. Change `"raised": 0` to the total so far in rupees, **digits only**: `125000`, not `1,25,000` or `₹1.25L`.
3. Click **Commit changes**. The site republishes itself in about a minute. If you made a typo, the publish fails with a red cross and the live site stays as it was: fix the number and commit again.

Other settings in the same file:
- While `raised` is `0` the site shows only the goal ("Our December goal: the goal"). From the first rupee it shows "₹X raised of the goal" with a bar.
- `goal`, `endDate` (YYYY-MM-DD) and `endLabel` (the words shown, e.g. `December`) set the target and deadline. After `endDate` passes, `npm run check` warns you to update or hide it.
- `"show": false` hides the whole progress area.
- Only post a total U&I has confirmed. Never round up.

## Print the QR poster
Open the site's `poster.html` (linked as "Printable poster" in the footer). Press **Ctrl+P** (Cmd+P on Mac), choose **A4**, margins **None**, and tick **Background graphics**. It prints on one page. The QR code points to `siteUrl` from `site.config.json` and is made fresh on every build.

## Link previews (WhatsApp, Instagram, LinkedIn)
When the link is shared, apps show `images/og-image.jpg` (1200×630) with the title and description from the `og:` tags in `index.html`. If you replace the image, keep every face covered and keep it under 300 KB. WhatsApp caches previews, so changes can take a day to show.

**Moving to Vercel or a custom domain:** change `siteUrl` in `site.config.json` to the new address (starting `https://` and ending in `/`). Previews, the canonical link and the poster's QR code all follow it. Reprint any posters you have already put up.

## Security rules (enforced by `npm run check` on every PR)
- **No inline code:** no `<script>...</script>` blocks, no `onclick="..."` style attributes, no `style="..."`. Put JavaScript in `js/` and styles in classes.
- **Nothing from other websites:** scripts, styles, fonts, images and frames come only from this site. Links to other sites are fine.
- **The security policy** lives in three places that must stay identical: the `<meta http-equiv="Content-Security-Policy">` in `index.html` (and any new page), `_headers` (Cloudflare Pages/Netlify) and `vercel.json` (Vercel). To allow something new (e.g. a payment widget), change all three, and get it reviewed.
- **Hosting:** GitHub Pages can't send security headers, so clickjacking protection and some other headers only apply on **Vercel** (`vercel.json` is ready: import the repo and it builds and sends every header) or **Cloudflare Pages** (`_headers`). `npm run dev` and `npm run preview` send the same headers locally.

## Where things live
| Path | What | Owner |
|---|---|---|
| `index.html` `<body>` | Page content and layout | Ahna |
| `src/components.css` | Shared building blocks (`.band`, `.btn`, `.photo`...) | Ahna |
| `images/` | Photos, logo and link preview image | Ahna |
| `site.config.json` | Site address and fundraising numbers | Anyone (see above) |
| `poster.html` | Printable A4 poster with QR code | Ahna |
| `favicon.png`, `apple-touch-icon.png` | Browser tab and home-screen icons | Ahna |
| `index.html` `<head>`, `js/` | Security tags, form and payment code | Arya |
| `tailwind.config.js` | Colours and font (the design system) | Arya, changes agreed with Ahna |
| `src/input.css`, `src/fonts.css`, `fonts/`, `scripts/`, `package.json` | Build setup and self-hosted font | Arya |
| `.github/workflows/` | Automatic checks and publishing | Arya |

Notes:
- `css/styles.css` and `dist/` are generated. Don't edit them, and don't commit them (git ignores them).
- Use only **relative paths** (`images/hero.jpg`, not `/images/hero.jpg`) so the site works on GitHub Pages and on a custom domain.
- Don't add scripts, fonts or embeds from other websites. Everything is self-hosted for security.

## Add pictures
Put files in `images/` with these names, or change the `src` in `index.html`:
`logo.png` (optional), `hero.webp`, `session-2.webp`, `session-3.webp` (about 1000px wide, under 200 KB each, so the page loads fast)

## Before publishing
- **No placeholder or made-up content, ever.** Numbers, stories, quotes and prices go on the site only once the NGO confirms them, with written consent from anyone quoted and the shelter's consent for anything about a child.
- Only use photos of boys with consent from the shelter. Keep every child's face covered or cropped out.
- The "What we do" details and the privacy policy and terms are drafts: get them confirmed by the Maho team and U&I Trust.
- The contact form needs its Formspree ID before it can send messages. Donations go to U&I's own donation page.
- Design rules: U&I's colours only, pill buttons and softly rounded photos. Wide capitals only for the hero headline and the "U&I in 2025" numbers, which copy uandi.org.in's style (pink wide numbers, a card with a solid pink block offset behind it). Accent colour is U&I pink #e843a1; blue is kept only for keyboard focus outlines. No soft shadows, gradients, animations, emojis or icon sets, no rows of identical cards.
