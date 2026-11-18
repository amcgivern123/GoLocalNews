// Uploads each built site to its own cPanel account on the KnownHost server over SSH (rsync).
//   DEPLOY_HOST      the server address, e.g. golocalnews.co.uk (a "user@" in front is ignored)
//   DEPLOY_PORT      SSH port, default 22
//   DEPLOY_SSH_OPTS  extra ssh options, e.g. "-i ~/.ssh/id_deploy"
// deploy.json gives each site's cPanel username and folder. The same SSH key must be
// imported and authorized in every one of those cPanel accounts.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const host = (process.env.DEPLOY_HOST || '').split('@').pop();
if (!host) throw new Error('Set DEPLOY_HOST (the server address) before deploying.');
const port = process.env.DEPLOY_PORT || '22';
const ssh = `ssh -p ${port} ${process.env.DEPLOY_SSH_OPTS || ''}`.trim();
const targets = JSON.parse(fs.readFileSync(path.join(root, 'deploy.json'), 'utf8'));

const failed = [];
for (const [id, t] of Object.entries(targets)) {
  const local = path.join(root, 'dist', id) + '/';
  if (!fs.existsSync(local)) { console.log(`skip ${id}: not built`); continue; }
  if (!t.user || !t.path || `${t.user}${t.path}`.includes('CHANGE_ME')) {
    console.log(`skip ${id}: set its user and path in deploy.json`);
    continue;
  }
  const dest = `${t.user}@${host}:${t.path.endsWith('/') ? t.path : t.path + '/'}`;
  console.log(`\n=== Uploading ${id} -> ${t.user}:${t.path} ===`);
  try {
    // --delete removes old pages, but never touches .htaccess or cPanel's own files.
    execSync(
      `rsync -az --delete --exclude=.htaccess --exclude=.well-known --exclude=cgi-bin -e "${ssh}" "${local}" "${dest}"`,
      { stdio: 'inherit' },
    );
  } catch {
    failed.push(id);
    console.error(`!!! ${id} failed: check its key is authorized in the ${t.user} cPanel account.`);
  }
}
if (failed.length) {
  console.error(`\nUpload failed for: ${failed.join(', ')}. The other sites were uploaded.`);
  process.exit(1);
}
