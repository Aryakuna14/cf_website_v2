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

## Fundraising numbers stay private
The team's fundraising target, totals and exact dates are **never** shown on the site or kept in this repo (it is public). The fundraiser page (`fundraiser.html`) describes the goal in words, and mentions the month only.
- `npm run check` fails the build if a page shows a money amount (₹ figures, lakh, crore) or an exact date (a day and a month). A month on its own is fine.
- Keep the plan, targets and progress in the team's private notes, not here.
- One exception: U&I's own public per-child prices in the fundraiser page's giving section (`#give`) (₹9,000 for one child for a year, ₹4,500 for six months, from uandi.org.in/donatenow). Each sits alone in an element marked `data-public-amount`, which the check allows. Re-check them, the 50% (80G) tax line and the annual report link against U&I's site every year.

## Menu and page flow
- **One menu on every page** (home, volunteer, fundraiser, privacy, terms): Home · About · Impact · Sessions · Volunteer · Fundraiser · Contact. Only `aria-current="page"` (the underlined item) changes per page. To change the menu, change it in every page's `<header>`: `npm run check` fails if any page's menu differs from the home page's.
- On the home page, links to its own sections are `#about`; on other pages `index.html#about`.
- Inner pages have a "← Home / page name" strip under the menu. The logo always goes home.
- **Donate** (menu button and "Donate now") always goes to `fundraiser.html#give`, the giving section of the fundraiser page.
- The fundraiser page owns the giving details (what a gift does, 80G, annual report, campaign numbers). The home page has one crimson section under the slideshow (heading + donate, `id="donate"`) with all the donate and volunteer buttons; it points to the fundraiser page for the details, so the two pages don't repeat each other.
- Arriving at a `#section` from another page jumps straight there (`js/main.js`); smooth scrolling switches on after the page loads.

## Volunteer stories (stories.html)
Each story shows the volunteer's photo, then their words in a yellow card (the same look as the "#InThisTogether moment" section on the fundraiser page). Stories live in `stories.json`, not in the HTML: open it on GitHub, click the pencil icon, edit, and commit. The site rebuilds itself.
- One story = one `{ }` block in `"stories"`, shown in that order: `name`, `role` (e.g. "Volunteer at Maho since 2025"), `quote` (40 to 80 words, under 600 characters). Optional: `photo` (a landscape photo of the volunteer, 1200 x 900, under 200 KB, e.g. `images/stories/first-name.webp`; without one the page shows "Photo coming soon") and `rating` (1 to 5 stars).
- **Every real story needs `consent`**: the month the volunteer agreed in writing, like `"2026-11"`. The build refuses a real story without it.
- **Volunteers only.** Never a kid's story, name, age or photo on this page. Photos follow the same rules as everywhere: no kids' faces, no signs that show where the shelter is.
- Placeholders are blocks with `"placeholder": true`. While any is left, the page is hidden from search engines and no other page may link to it (`npm run check` stops the build). Replace them as real stories come in, then add "Stories" to the menu.
- Quotes are shown exactly as text: anything like HTML in a quote is shown as plain characters, never run.

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
| `site.config.json` | Site address (used for previews, canonical links and the poster QR code) | Anyone |
| `poster.html` | Printable A4 poster with QR code | Ahna |
| `volunteer.html` | Volunteering page. Its facts (hours, dates, subjects, steps) come from uandi.org.in/volunteer: re-check them every volunteering year | Ahna |
| `fundraiser.html` | December #InThisTogether fundraiser page: photo-led opening, campaign numbers, where the money goes, what a gift does (`#give`), how to help. Facts come from U&I's crowdfunding deck and donation page. No targets, totals or exact dates | Arya |
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
`logo.png` (optional), `session-2.webp`, `session-3.webp` (about 1000px wide, under 200 KB each, so the page loads fast)

**Photo slideshow** (full width at the top of the home page): `volunteers-1.webp` to `volunteers-4.webp`, 1200 x 900 (4:3), under 200 KB each. Each photo is cropped to a wide strip: set what stays in view with an `object-[x%_y%]` class on its `<img>` (e.g. `object-bottom`). To add a photo, copy one `<figure class="carousel-slide">` line in `index.html` and update the numbers ("5 of 5"). Only photos of volunteers and staff who have agreed to be on the site. **Never the boys**, and nothing that shows where the shelter is. It moves every 5 seconds (`DELAY_MS` in `js/carousel.js`).
**Fundraiser slideshow** (the opening of `fundraiser.html`): `fundraiser-1.webp` to `fundraiser-3.webp`, 1200 x 900, under 200 KB each. Before adding a photo here or anywhere: cover every boy's face, and pixelate any sign, board or notice that names the organisation running the shelter, the school, or the address (fundraiser-1 has its signs pixelated for this reason).

**Hero heading**: `for-every-child.webp` is U&I's "for Every Child" lockup, used as an image so the lettering and the smiley stay exact. It is transparent outside the salmon shape and keeps the original colours (salmon #fd8964, black). Don't stretch it, recolour it, or swap it for a screenshot.

## Before publishing
- **No placeholder or made-up content, ever.** Numbers, stories, quotes and prices go on the site only once the NGO confirms them, with written consent from anyone quoted and the shelter's consent for anything about a child.
- Only use photos of boys with consent from the shelter. Keep every child's face covered or cropped out.
- The "What we do" details and the privacy policy and terms are drafts: get them confirmed by the Maho team and U&I Trust.
- The contact form needs its Formspree ID before it can send messages. Donations go to U&I's own donation page.
- Design rules: U&I's colours only. The home page's top heading, its Donate section and the fundraiser page's top section copy uandi.org.in/volunteer: crimson `#e5024a`, a black line and a big sun-yellow `#f9ed32` line in Londrina Solid capitals (`.hand`), black sparkles, and Arial capital pill buttons (`.btn-sun`, `.btn-black`). On crimson, small text is white; black and yellow only at 24px or larger. The photo slideshow at the top copies uandiadheera.vercel.app: full width, square corners, one yellow button. Elsewhere: pill buttons and softly rounded photos, wide capitals (Archivo) for the U&I in 2025 numbers. No soft shadows, gradients, emojis or icon sets, no rows of identical cards.
