// Uploads each built site to its folder on the KnownHost server over SSH (rsync).
//   DEPLOY_HOST      user@server  (required)
//   DEPLOY_PORT      SSH port, default 22
//   DEPLOY_SSH_OPTS  extra ssh options, e.g. "-i ~/.ssh/id_deploy"
// Each site's folder on the server is set in deploy.json.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const host = process.env.DEPLOY_HOST;
if (!host) throw new Error('Set DEPLOY_HOST (user@server) before deploying.');
const port = process.env.DEPLOY_PORT || '22';
const ssh = `ssh -p ${port} ${process.env.DEPLOY_SSH_OPTS || ''}`.trim();
const targets = JSON.parse(fs.readFileSync(path.join(root, 'deploy.json'), 'utf8'));

for (const [id, remotePath] of Object.entries(targets)) {
  const local = path.join(root, 'dist', id) + '/';
  if (!fs.existsSync(local)) { console.log(`skip ${id}: not built`); continue; }
  if (remotePath.includes('CHANGE_ME')) { console.log(`skip ${id}: set its folder in deploy.json`); continue; }
  console.log(`\n=== Uploading ${id} -> ${host}:${remotePath} ===`);
  // --delete removes old pages, but never touches .htaccess or cPanel's own files.
  execSync(
    `rsync -az --delete --exclude=.htaccess --exclude=.well-known --exclude=cgi-bin -e "${ssh}" "${local}" "${host}:${remotePath}"`,
    { stdio: 'inherit' },
  );
}
