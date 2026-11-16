// Writes a short, different opening sentence for each site that carries an article.
// Only fills gaps, so it is safe to run on every publish. Edit any intro by hand in
// src/content/intros/<article>.json and it will be kept.
// Needs ANTHROPIC_API_KEY (from console.anthropic.com).
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const root = path.resolve(import.meta.dirname, '..');
const { sites, hub } = JSON.parse(fs.readFileSync(path.join(root, 'sites.json'), 'utf8'));
const locals = sites.filter((s) => s.id !== hub);
const articlesDir = path.join(root, 'src/content/articles');
const introsDir = path.join(root, 'src/content/intros');
const MODEL = process.env.LOCALISE_MODEL || 'claude-haiku-5-5';

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.log('localise: ANTHROPIC_API_KEY not set, skipping local intros.');
  process.exit(0);
}

function readArticle(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return null;
  const fm = parse(m[1]) ?? {};
  return { ...fm, sites: fm.sites ?? ['all'], body: m[2].slice(0, 3000) };
}

async function writeIntros(article, needed) {
  const prompt = `You write short introductions for a local business news article that is shared across several Northern Ireland news sites.
Article title: ${article.title}
Summary: ${article.description}
Article text:
${article.body}

Write one opening sentence (max 35 words) for each of these sites. Each line gives the site id, the site name and the area its readers live in:
${needed.map((t) => `- ${t.id}: ${t.name} (${t.town})`).join('\n')}

Each sentence must explain why the story matters to that site's readers, be factually safe (do not invent facts, distances, prices or quotes), and use British English. Several sites may share an area, so every sentence must be worded completely differently from the others, with a different opening and angle.
Reply with only a JSON object mapping each site id exactly as given to its sentence.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: MODEL, max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const text = (await res.json()).content.map((c) => c.text || '').join('');
  const json = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  const out = {};
  for (const t of needed) if (json[t.id]) out[t.id] = String(json[t.id]).trim();
  return out;
}

fs.mkdirSync(introsDir, { recursive: true });
let failed = 0;
for (const f of fs.readdirSync(articlesDir).filter((f) => f.endsWith('.md'))) {
  const slug = f.replace(/\.md$/, '');
  const article = readArticle(path.join(articlesDir, f));
  if (!article || article.draft) continue;
  const introFile = path.join(introsDir, `${slug}.json`);
  const existing = fs.existsSync(introFile) ? JSON.parse(fs.readFileSync(introFile, 'utf8')) : {};
  const carriers = locals.filter((t) => article.sites.includes('all') || article.sites.includes(t.id));
  const needed = carriers.filter((t) => !existing[t.id]);
  if (needed.length === 0) continue;
  try {
    const added = await writeIntros(article, needed);
    fs.writeFileSync(introFile, JSON.stringify({ ...existing, ...added }, null, 2) + '\n');
    console.log(`localise: ${slug} -> ${Object.keys(added).join(', ')}`);
  } catch (e) {
    failed++;
    console.error(`localise: ${slug} failed (${e.message}); it will publish without new intros and be retried next time.`);
  }
}
if (failed) console.log(`localise: ${failed} article(s) to retry.`);
