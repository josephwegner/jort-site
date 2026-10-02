import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs';

const source = new URL('../', import.meta.url);
const output = new URL('../dist/', import.meta.url);
const html = readFileSync(new URL('index.html', source), 'utf8');
// Ship only media used by the selected design, not the older design assets.
const assets = new Set(
  [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map((match) => match[1]),
);

rmSync(output, { recursive: true, force: true });
mkdirSync(new URL('assets/', output), { recursive: true });

for (const path of ['index.html', 'styles.css', 'script.js', ...assets]) {
  cpSync(new URL(path, source), new URL(path, output));
}
