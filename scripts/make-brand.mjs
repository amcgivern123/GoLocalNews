// Draws each site's icon, logo and social image from the brand settings in sites.json.
// Output goes to public/brand/<site-id>/. Run `npm run brand` after changing a name or colour.
// Text is converted to shapes, so the files look the same on every computer.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, '..');
const { sites } = JSON.parse(fs.readFileSync(path.join(root, 'sites.json'), 'utf8'));
const font = (pkg, file) => {
  const buf = fs.readFileSync(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'files', file));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const serifBold = font('@fontsource/source-serif-4', 'source-serif-4-latin-700-normal.woff');
const sans = font('@fontsource/inter', 'inter-latin-400-normal.woff');

// Text as an SVG path, starting at (x, baseline y).
const textPath = (f, text, x, y, size, fill) => `<path fill="${fill}" d="${f.getPath(text, x, y, size).toPathData(2)}"/>`;
const textWidth = (f, text, size) => f.getAdvanceWidth(text, size);

// The square icon: initials in white on a coloured shape.
function iconBody(site, s = 64) {
  const { accent } = site.colors;
  const { initials, shape } = site.logo;
  const c = s / 2;
  let bg;
  if (shape === 'circle') bg = `<circle cx="${c}" cy="${c}" r="${c}" fill="${accent}"/>`;
  else if (shape === 'badge')
    bg = `<circle cx="${c}" cy="${c}" r="${c}" fill="${accent}"/><circle cx="${c}" cy="${c}" r="${c * 0.84}" fill="none" stroke="#fff" stroke-width="${s * 0.035}" stroke-opacity=".85"/>`;
  else bg = `<rect width="${s}" height="${s}" rx="${shape === 'rounded' ? s * 0.25 : s * 0.1}" fill="${accent}"/>`;
  const maxW = s * (shape === 'square' || shape === 'rounded' ? 0.74 : 0.62);
  let size = s * 0.5;
  while (textWidth(serifBold, initials, size) > maxW) size -= 0.5;
  const w = textWidth(serifBold, initials, size);
  const baseline = c + size * 0.35; // optical centre for cap height
  return bg + textPath(serifBold, initials, c - w / 2, baseline, size, '#fff');
}
const iconSvg = (site, s = 64) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s} ${s}" width="${s}" height="${s}">${iconBody(site, s)}</svg>`;

// Wordmark: words in ink, one highlighted in the accent colour.
function wordmark(site, x, baseline, size) {
  const { words, highlight } = site.logo;
  let out = '';
  for (const [i, word] of words.entries()) {
    out += textPath(serifBold, word, x, baseline, size, i === highlight ? site.colors.accent : site.colors.ink);
    x += textWidth(serifBold, word + ' ', size);
  }
  return { svg: out, end: x - textWidth(serifBold, ' ', size) };
}

function logoSvg(site) {
  const h = 80, icon = 64, gap = 16, size = 44;
  const { svg, end } = wordmark(site, icon + gap, 56, size);
  const w = Math.ceil(end + 4);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><g transform="translate(0 8)">${iconBody(site, 64)}</g>${svg}</svg>`;
}

function wrap(text, f, size, maxW) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const trial = lines.at(-1) ? `${lines.at(-1)} ${word}` : word;
    if (textWidth(f, trial, size) > maxW && lines.at(-1)) lines.push(word);
    else lines[lines.length - 1] = trial;
  }
  return lines;
}

function ogSvg(site) {
  const W = 1200, H = 630, x = 90;
  let size = 84;
  while (wordmark(site, x + 120, 0, size).end > W - x) size -= 2;
  const mark = wordmark(site, x + 120, 300, size);
  const tag = wrap(site.tagline, sans, 34, 760).slice(0, 2)
    .map((line, i) => textPath(sans, line, x, 370 + i * 46, 34, '#555555')).join('');
  const domain = textPath(sans, new URL(site.domain).host, x, 535, 32, site.colors.ink);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#fff"/><rect width="${W}" height="18" fill="${site.colors.accent}"/>
<g transform="translate(${x} ${300 - 92}) scale(1.5)">${iconBody(site, 64)}</g>${mark.svg}${tag}
<rect x="${x}" y="470" width="${W - 2 * x}" height="5" fill="${site.colors.ink}"/>${domain}</svg>`;
}

// ---------- Your own logo and icon files (brand-src/<site-id>/logo.* and icon.*) ----------

const findSrc = (id, name) => {
  const d = path.join(root, 'brand-src', id);
  if (!fs.existsSync(d)) return null;
  const f = fs.readdirSync(d).find((x) => /^(.+)\.(webp|png|jpe?g)$/i.test(x) && x.toLowerCase().startsWith(name + '.'));
  return f ? path.join(d, f) : null;
};

// Makes the plain light background around a logo transparent (only the area joined to the edges),
// then trims the empty margin.
async function cutOutBackground(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const isBg = (i) => {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    return Math.min(r, g, b) > 222 && Math.max(r, g, b) - Math.min(r, g, b) < 28;
  };
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !isBg(i)) continue;
    seen[i] = 1;
    data[i * 4 + 3] = 0;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w);
    if (y < h - 1) stack.push(i + w);
  }
  // Soften the edge: light pixels touching the removed area become partly see-through.
  for (let i = 0; i < w * h; i++) {
    if (seen[i]) continue;
    const x = i % w, y = (i / w) | 0;
    const touches = (x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (y > 0 && seen[i - w]) || (y < h - 1 && seen[i + w]);
    if (!touches) continue;
    const light = Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    if (light > 170) data[i * 4 + 3] = Math.round(255 * (1 - (light - 170) / 85) * 0.9 + 25);
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer().then((b) => sharp(b).trim().toBuffer());
}

async function customBrand(site, dir, logoSrc, iconSrc) {
  const logo = await cutOutBackground(logoSrc);
  const tall = sharp(logo).resize({ height: 180, withoutEnlargement: true });
  await tall.clone().webp({ quality: 90 }).toFile(path.join(dir, 'logo-full.webp'));
  await tall.clone().png().toFile(path.join(dir, 'logo-full.png'));
  const meta = await sharp(path.join(dir, 'logo-full.png')).metadata();
  fs.writeFileSync(path.join(dir, 'logo-full.json'), JSON.stringify({ width: meta.width, height: meta.height }) + '\n');

  const icon = sharp(iconSrc).flatten({ background: '#ffffff' });
  await icon.clone().resize(512, 512).png().toFile(path.join(dir, 'logo.png'));
  await icon.clone().resize(192, 192).png().toFile(path.join(dir, 'icon-192.png'));
  await icon.clone().resize(180, 180).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  await icon.clone().resize(48, 48).png().toFile(path.join(dir, 'icon-48.png'));
  for (const old of ['icon.svg', 'logo.svg']) fs.rmSync(path.join(dir, old), { force: true });

  // Social sharing image: the logo centred on white, with the site's colour as a top bar.
  const W = 1200, H = 630;
  const fitted = await sharp(logo).resize({ width: 1000, height: 440, fit: 'inside' }).png().toBuffer();
  const fm = await sharp(fitted).metadata();
  await sharp({ create: { width: W, height: H, channels: 3, background: '#ffffff' } })
    .composite([
      { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="18"><rect width="${W}" height="18" fill="${site.colors.accent}"/></svg>`), top: 0, left: 0 },
      { input: fitted, top: Math.round((H - fm.height) / 2) + 9, left: Math.round((W - fm.width) / 2) },
    ])
    .png()
    .toFile(path.join(dir, 'og-default.png'));
}

for (const site of sites) {
  const dir = path.join(root, 'public/brand', site.id);
  fs.mkdirSync(dir, { recursive: true });
  const logoSrc = findSrc(site.id, 'logo');
  const iconSrc = findSrc(site.id, 'icon');
  if (logoSrc && iconSrc) {
    await customBrand(site, dir, logoSrc, iconSrc);
    console.log(`brand: ${site.id} (your logo files)`);
    continue;
  }
  for (const old of ['logo-full.webp', 'logo-full.png', 'logo-full.json', 'icon-192.png']) fs.rmSync(path.join(dir, old), { force: true });
  const icon = iconSvg(site);
  fs.writeFileSync(path.join(dir, 'icon.svg'), icon);
  fs.writeFileSync(path.join(dir, 'logo.svg'), logoSvg(site));
  await sharp(Buffer.from(iconSvg(site, 600))).png().toFile(path.join(dir, 'logo.png'));
  await sharp(Buffer.from(iconSvg(site, 180))).flatten({ background: '#ffffff' }).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(iconSvg(site, 48))).png().toFile(path.join(dir, 'icon-48.png'));
  await sharp(Buffer.from(ogSvg(site))).png().toFile(path.join(dir, 'og-default.png'));
  console.log(`brand: ${site.id}`);
}
