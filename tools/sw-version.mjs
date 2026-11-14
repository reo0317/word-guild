import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../products/word-guild/', import.meta.url));
export async function precacheFiles(directory = root, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + entry.name;
    // Never traverse the retired assets or illustration working files.
    if (entry.isDirectory()) {
      if (name !== 'assets' && name !== 'art/work' && name !== 'art/word') files.push(...await precacheFiles(path.join(directory, entry.name), name + '/'));
    } else if (entry.isFile() && name !== 'sw.js' && (/\.(html|css|mjs|json|webmanifest)$/.test(name) || /^art\/.*\.(webp|png)$/.test(name))) {
      files.push('./' + name);
    }
  }
  return files.sort();
}
export async function shellMetadata(directory = root) {
  const files = await precacheFiles(directory);
  const hash = createHash('sha256').update(JSON.stringify(files));
  for (const file of files) {
    const bytes = await readFile(path.join(directory, file));
    // Keep binary artwork intact; normalize line endings in textual resources.
    hash.update(/\.(png|webp)$/.test(file) ? bytes : bytes.toString('utf8').replace(/\r\n/g, '\n'));
  }
  // 単語の絵は事前に読みこまず、出たときに別の保存場所へ入れる。絵が変わったら保存場所の名前を変える。
  const wordHash = createHash('sha256');
  for (const entry of (await readdir(path.join(directory, 'art', 'word'))).sort()) {
    if (entry.endsWith('.webp')) wordHash.update(entry).update(await readFile(path.join(directory, 'art', 'word', entry)));
  }
  return { files, version: hash.digest('hex').slice(0, 8), wordVersion: wordHash.digest('hex').slice(0, 8) };
}
export async function updateVersion(check = false) {
  const { files, version, wordVersion } = await shellMetadata();
  const filename = path.join(root, 'sw.js');
  const original = await readFile(filename, 'utf8');
  const next = original.replace(/^const VERSION = .*;$/m, `const VERSION = '${version}';`)
    .replace(/^const PRECACHE = .*;$/m, `const PRECACHE = ${JSON.stringify(files)};`)
    .replace(/^const WORD_VERSION = .*;$/m, `const WORD_VERSION = '${wordVersion}';`);
  if (check) return original === next;
  if (original !== next) await writeFile(filename, next);
  return true;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!await updateVersion(process.argv.includes('--check'))) {
    console.error('Service Worker is stale: run node tools/sw-version.mjs');
    process.exitCode = 1;
  }
}
