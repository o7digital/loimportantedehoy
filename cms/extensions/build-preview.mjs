import { build } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile } from 'node:fs/promises';
await mkdir('dist/assets', { recursive: true });
await build({ entryPoints: ['preview/app.tsx'], bundle: true, minify: true, format: 'iife', target: 'es2022', outfile: 'dist/assets/reader.js', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, loader: { '.woff2': 'dataurl' }, external: ['/fonts/*'] });
// The reader's root CSS uses /fonts URLs. Inline local licensed fonts so a private
// draft preview and the headless renderer never depend on third-party origins.
let css = await readFile('dist/assets/reader.css', 'utf8');
// Resolve every font referenced by the shared reader CSS.
const matches = [...css.matchAll(/\/fonts\/([\w.-]+\.woff2)/g)];
for (const [, file] of matches) css = css.replaceAll(`/fonts/${file}`, `data:font/woff2;base64,${(await readFile(`../../public/fonts/${file}`)).toString('base64')}`);
const editingCss = await readFile('preview/editing.css', 'utf8');
await writeFile('dist/assets/reader.css', css + '\n' + editingCss);
await build({ entryPoints: ['preview/poster.js'], bundle: true, minify: true, format: 'iife', target: 'es2022', outfile: 'dist/assets/poster.js' });
await writeFile('dist/assets/poster.css', [...css.matchAll(/@font-face\{[^}]+\}/g)].map(match => match[0]).join('\n') + '\n' + await readFile('preview/poster.css', 'utf8') + '\n' + editingCss);
console.log('Reader, poster and licensed fonts packaged.');
