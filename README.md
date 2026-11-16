# U&I x Maho website

Sponsor/donation website for U&I x Maho. Static site styled with Tailwind CSS. Team plan: [WORKFLOW.md](WORKFLOW.md).

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
| `npm run preview` | Builds, then serves `dist/` at http://localhost:8000/cfwebsite/, the same address shape as GitHub Pages. Use it to check nothing breaks before a PR. |
| `npm run check` | After a build, checks for broken file links, paths that would break on GitHub Pages, files loaded from other websites, and insecure links. The same check runs automatically on every PR. |

## How publishing works
- Every pull request is built and checked automatically (`.github/workflows/pr-check.yml`). A red cross on the PR means something is broken: open the "Details" link to see what.
- Every merge into `main` publishes the site to GitHub Pages automatically (`.github/workflows/deploy.yml`). Nothing needs uploading by hand.
- One-time setup by the repo owner: **Settings > Pages > Source = GitHub Actions**.

## Security rules (enforced by `npm run check` on every PR)
- **No inline code:** no `<script>...</script>` blocks, no `onclick="..."` style attributes, no `style="..."`. Put JavaScript in `js/` and styles in classes.
- **Nothing from other websites:** scripts, styles, fonts, images and frames come only from this site. Links to other sites are fine.
- **The security policy** lives in three places that must stay identical: the `<meta http-equiv="Content-Security-Policy">` in `index.html` (and any new page), `_headers` (Cloudflare Pages/Netlify) and `vercel.json` (Vercel). To allow something new (e.g. a payment widget), change all three, and get it reviewed.
- **Hosting:** GitHub Pages can't send security headers, so clickjacking protection and some other headers only apply on **Vercel** (`vercel.json` is ready: import the repo and it builds and sends every header) or **Cloudflare Pages** (`_headers`). `npm run dev` and `npm run preview` send the same headers locally.

## Where things live
| Path | What | Owner |
|---|---|---|
| `index.html` `<body>` | Page content and layout | Ahna |
| `src/components.css` | Shared building blocks (`.btn`, `.card`, `.section`...) | Ahna |
| `images/` | Photos and logo | Ahna |
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
- Design rules: square corners, no shadows, gradients, animations, emojis or icon sets, no rows of identical cards, U&I's colours only.
