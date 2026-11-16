# Go Local News network

One Astro project, built on the Belfast Local Business design, that publishes golocalnews.co.uk (the hub) and every local site from one shared set of articles. Each site has its own name, colours, logo and icon.

## How publishing works

1. You add or edit an article in **Pages CMS** (app.pagescms.org). It saves to GitHub.
2. GitHub runs the **Publish network** workflow: it writes a different opening line for each site, builds all the sites and uploads them to KnownHost.
3. The same workflow runs every morning, so scheduled stories appear and expired offers drop off.

## Where things live

| Path | What it holds |
|---|---|
| `sites.json` | Every site: name, domain, town, tagline, logo wording, icon shape and colours. Also the sections and the contact email. |
| `src/content/articles/` | The shared articles (one file each). |
| `src/content/offers/` | Offers (can be limited to particular sites). |
| `src/content/intros/` | Each site's opening line per article, written automatically. Edit any you don't like and it is kept. |
| `src/content/authors/` | Author bios. A byline matching a name here links to an author page. |
| `public/brand/<site>/` | Each site's icon, logo and social image, made by `npm run brand`. |
| `public/images/` | Photos uploaded through the editor. |
| `public/form.php` | Emails newsletter sign-ups and story submissions to you. |
| `deploy.json` | The folder on KnownHost for each site. |

## Article options (all in the editor)

- **Publish on:** All sites, or chosen sites. Go Local News always carries everything.
- **Point copies to Go Local News (canonical):** on by default. Turn it off and every copy stands on its own.
- **Let these sites' copies rank on their own:** keeps the canonical on, but frees the chosen sites.
- **Paid press release:** adds a label and marks the business link as sponsored.
- **Pinned until:** the story stops being the homepage lead after this date.
- **YouTube video link**, **second photo**, **photo captions**, and **business details** with a Google Maps embed.

## Changing a site's look

Edit its entry in `sites.json`:

- `colors.accent` is the main colour (buttons, highlights); `colors.ink` is the dark colour (top bar, rules, text).
- `logo.words` and `logo.highlight` set the name and which word is in colour (counting from 0).
- `logo.initials` and `logo.shape` (`square`, `rounded`, `circle` or `badge`) set the icon.

Then run `npm run brand` to redraw the icons and logos.

## Adding a site

1. Add it to `sites.json` and its folder to `deploy.json`.
2. Add it to the two site lists in `.pages.yml` (the "Publish on" and "Let these sites' copies rank" options).
3. Run `npm run brand`.

## Going live (one-off)

1. **GitHub:** create a repository and upload everything in this folder, including the hidden `.pages.yml` and `.github` folder.
2. **KnownHost:** add each domain in cPanel (Domains), note each one's folder, and put those folders in `deploy.json`. Turn on SSH access and create an SSH key pair.
3. **GitHub secrets** (Settings → Secrets and variables → Actions): `DEPLOY_HOST` (e.g. `user@server.knownhost.com`), `DEPLOY_SSH_KEY` (the private key), `DEPLOY_PORT` if it isn't 22, and `ANTHROPIC_API_KEY` for the opening lines.
4. **Forms:** put your email address at the top of `public/form.php`, and optionally `contactEmail` in `sites.json`.
5. **Editor:** sign in at app.pagescms.org with GitHub and open the repository.
6. **Google:** add each site to Search Console and submit `/sitemap-index.xml` and `/news-sitemap.xml`.
7. **Before launch:** delete the sample articles and offers (they have "sample" in the name), and fill in the `[BRACKETED]` text on the About, Advertise and Privacy pages and in `src/content/authors/adrian.json`.

## Working on your own computer (optional)

```bash
npm install
npm run dev                          # preview Go Local News at localhost:4321
SITE_ID=wearebelfast npm run dev     # preview another site
npm run build:all                    # build every site into dist/<site>/
npm run build:all bestinlisburn      # build one site
npm run release                      # opening lines + build + upload (needs the same settings as the secrets)
```
