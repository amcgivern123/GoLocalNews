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

for (const site of sites) {
  const dir = path.join(root, 'public/brand', site.id);
  fs.mkdirSync(dir, { recursive: true });
  const icon = iconSvg(site);
  fs.writeFileSync(path.join(dir, 'icon.svg'), icon);
  fs.writeFileSync(path.join(dir, 'logo.svg'), logoSvg(site));
  await sharp(Buffer.from(iconSvg(site, 600))).png().toFile(path.join(dir, 'logo.png'));
  await sharp(Buffer.from(iconSvg(site, 180))).flatten({ background: '#ffffff' }).png().toFile(path.join(dir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(iconSvg(site, 48))).png().toFile(path.join(dir, 'icon-48.png'));
  await sharp(Buffer.from(ogSvg(site))).png().toFile(path.join(dir, 'og-default.png'));
  console.log(`brand: ${site.id}`);
}
