# srijansk.github.io

Source for [srijansk.github.io](https://srijansk.github.io) — Srijan Saket's
personal site. Astro + Markdown content collections, deployed to GitHub Pages
via Actions on push to `main`.

## Local development

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # production build into ./dist
npm run preview      # preview the production build
```

## Content model

Everything that shows up on the site is either in `src/pages/*.astro` (layout /
copy) or in a content collection (`src/content/*`). Collections are typed
against `src/content.config.ts`.

- `src/content/talks/*.md` — every talk, keynote, workshop presentation, and
  program-committee service entry.
- `src/content/publications/*.md` — papers, patents, book.
- `src/content/writing/*.md` — curated writing entries (`featured: true` are
  surfaced on the landing page).

Assets for a given talk live under `public/talks/<slug>/` and are referenced
from the talk's frontmatter via `slides:` or `thumbnail:`.

## Adding a new talk

1. Create `src/content/talks/YYYY-MM-venue-slug.md`:

    ```yaml
    ---
    title: "Talk title"
    venue: "Venue Name"
    location: "City, Country"
    date: 2026-05-12
    type: keynote       # or: talk, panel, tutorial, pc-service, webinar
    url: "https://..."  # optional canonical page
    slides: "/talks/YYYY-MM-venue-slug/slides.pdf"  # or a Google Slides URL
    video: "https://youtu.be/..."                   # optional
    abstract: |
      Two or three sentences describing the talk.
    thumbnail: "/talks/YYYY-MM-venue-slug/thumbnail.png"  # optional, 16:9
    tags: [recsys, agents]
    featured: true
    ---
    ```

2. (Optional) drop assets into `public/talks/YYYY-MM-venue-slug/`.
3. Commit and push to `main`.

## Adding a new publication

Create `src/content/publications/<slug>.md`:

```yaml
---
title: "Paper title"
authors: "Author list"
venue: "Venue Year (Track)"
year: 2026
arxiv: "https://arxiv.org/abs/..."  # optional
pdf: "https://arxiv.org/pdf/..."    # optional
url: "https://..."                   # optional canonical link
type: paper   # or: patent, book
---
```

## Adding a new writing entry

```yaml
---
title: "Title"
publication: "Publication name"
date: 2026-04-20
url: "https://..."
teaser: "One line."
featured: true   # if it should surface on the landing page
---
```

Non-featured entries still get picked up if the archive page is later expanded
to include them.

## Updating the Now block

Edit `src/pages/index.astro`, section `#now`. Update both the date label and
the body. Freshness is the point of the block — quarterly updates are plenty.

## Updating positioning

Re-read `/knowledge-lab/meta/public-venues.md` in the private lab. Update the
hero copy in `src/pages/index.astro` to match.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`:

1. Installs dependencies with `npm ci`.
2. Builds the static site with `npm run build`.
3. Publishes to GitHub Pages via the official `deploy-pages` action.

In the repo Settings → Pages, set the source to "GitHub Actions" (not a
branch). Deployments are gated by the `github-pages` environment.

## Custom domain (optional)

To attach a custom domain later:

1. Add a `CNAME` file at the repo root with just the domain, e.g.
   `srijansaket.com`.
2. Configure DNS (`A`/`ALIAS` records per GitHub Pages docs).
3. In Settings → Pages, set the custom domain and enable "Enforce HTTPS".
4. Update `astro.config.mjs`'s `site` to the new URL.

## Stack

- [Astro](https://astro.build) (minimal + content collections, static output)
- [@fontsource-variable/newsreader](https://fontsource.org/fonts/newsreader)
  and [/inter](https://fontsource.org/fonts/inter) — self-hosted variable
  fonts, no Google CDN
- Vanilla CSS, single `global.css`, no Tailwind / no runtime JS

## License

Source code under MIT (see `LICENSE` if present). Written content —
publications, talks, prose — is reserved unless otherwise noted.
