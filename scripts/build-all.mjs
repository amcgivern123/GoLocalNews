// Builds every site in sites.json into dist/<site-id>/.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const { sites } = JSON.parse(fs.readFileSync(path.join(root, 'sites.json'), 'utf8'));
const only = process.argv[2]; // optional: build just one site, e.g. `npm run build:all belfast`

for (const s of sites.filter((s) => !only || s.id === only)) {
  console.log(`\n=== Building ${s.name} (${s.id}) ===`);
  execSync('npx astro build', { cwd: root, stdio: 'inherit', env: { ...process.env, SITE_ID: s.id, ASTRO_TELEMETRY_DISABLED: '1' } });
}
console.log('\nAll sites built into dist/.');
