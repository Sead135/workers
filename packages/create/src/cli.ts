import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');
const templatesDir = resolve(__dirname, '../templates/worker');

function toAlias(input: string) {
  return input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function walk(dir: string) {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else {
      out.push(full);
    }
  }
  return out;
}

function main() {
  const rawName = process.argv[2];
  if (!rawName) {
    console.error('Usage: pnpm create-worker <name>');
    process.exit(1);
  }

  const alias = toAlias(rawName);
  if (!alias) {
    console.error('Invalid name');
    process.exit(1);
  }

  const target = join(root, 'workers', alias);
  if (existsSync(target)) {
    console.error(`Already exists: ${target}`);
    process.exit(1);
  }

  mkdirSync(target, { recursive: true });

  for (const file of walk(templatesDir)) {
    const rel = file.slice(templatesDir.length + 1);
    const dest = join(target, rel);

    mkdirSync(dirname(dest), { recursive: true });

    const content = readFileSync(file, 'utf8').replaceAll('__ALIAS__', alias);
    writeFileSync(dest, content);
  }

  console.log(`Created workers/${alias}`);
  console.log(`Next: pnpm i && pnpm --filter @workers/${alias} dev`);
}

main();
