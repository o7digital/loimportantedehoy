// Toggle anonymous editorial reads without changing editions or user access.
import { readFile, writeFile, mkdir, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
const mode = process.argv[2];
if (!['--private', '--public'].includes(mode)) throw new Error('Choose --private or --public explicitly.');
const root = (process.env.PUBLIC_URL || process.env.DIRECTUS_URL || '').replace(/\/$/, '');
if (!root || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) throw new Error('Load the private CMS environment.');
const login = await fetch(`${root}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
if (!login.ok) throw new Error(`Directus login: ${login.status}`);
const { data: { access_token, refresh_token } } = await login.json();
async function api(path, body) {
  const response = await fetch(root + path, { method: body ? 'PATCH' : 'GET', headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (!response.ok) throw new Error(`Directus ${path}: ${response.status}`);
  return (await response.json()).data;
}
try {
  const policies = await api('/policies?fields=id,name');
  const policy = policies.find(item => item.name === 'Public' || item.name === '$t:public_label');
  if (!policy) throw new Error('The public policy is missing.');
  const rules = (await api(`/permissions?filter[policy][_eq]=${policy.id}`)).filter(rule => ['ediciones', 'paginas'].includes(rule.collection) && rule.action === 'read');
  if (rules.length !== 2) throw new Error('Expected existing public read rules for editions and pages.');
  const directory = join(homedir(), '.config', 'loimportantedehoy');
  const backup = join(directory, 'public-visibility-backup.json');
  let saved;
  try { saved = JSON.parse(await readFile(backup, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (mode === '--private' && !saved) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(backup, JSON.stringify({ cms: root, rules }, null, 2) + '\n', { mode: 0o600 });
    await chmod(backup, 0o600);
  }
  if (mode === '--public' && (saved?.cms !== root || saved.rules.length !== 2)) throw new Error('The original public rules backup is required to reopen the same CMS.');
  for (const rule of rules) {
    const original = saved?.rules.find(item => item.collection === rule.collection && item.policy === rule.policy);
    if (mode === '--public' && !original) throw new Error('The saved rules belong to a different public policy.');
    await api(`/permissions/${rule.id}`, { permissions: mode === '--private' ? { id: { _eq: 0 } } : original.permissions });
  }
  console.log(mode === '--private' ? 'Anonymous editions and pages are hidden. Authenticated editorial access is retained.' : 'Original public editorial read rules restored.');
} finally {
  await fetch(`${root}/auth/logout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token }) });
}
