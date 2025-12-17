import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../../theme/', import.meta.url));
const script = fileURLToPath(new URL('../../scripts/sync-prose-theme.ts', import.meta.url));
const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });

async function files(directory: string, prefix = ''): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) result.push(...await files(join(directory, entry.name), path));
    else result.push(path);
  }
  return result.sort();
}

test('the command copies the complete local theme, repeats safely and preserves unrelated work', async () => {
  const target = await mkdtemp(join(tmpdir(), 'cube-theme-'));
  try {
    await writeFile(join(target, 'keep.txt'), 'unrelated work');
    assert.equal(run(target).status, 0);
    for (const file of await files(source)) {
      assert.deepEqual(await readFile(join(target, file)), await readFile(join(source, file)), file);
    }
    await writeFile(join(target, 'tokens.css'), 'outdated managed content');
    assert.equal(run(target).status, 0);
    assert.equal(await readFile(join(target, 'keep.txt'), 'utf8'), 'unrelated work');
    assert.deepEqual(await readFile(join(target, 'tokens.css')), await readFile(join(source, 'tokens.css')));
  } finally { await rm(target, { recursive: true, force: true }); }
});

test('the command rejects a conflicting managed path before changing other files', async () => {
  const target = await mkdtemp(join(tmpdir(), 'cube-theme-conflict-'));
  try {
    await writeFile(join(target, 'tokens.css'), 'keep this version');
    await mkdir(join(target, 'fonts.css'));
    assert.notEqual(run(target).status, 0);
    assert.equal(await readFile(join(target, 'tokens.css'), 'utf8'), 'keep this version');
  } finally { await rm(target, { recursive: true, force: true }); }
});

test('the command does not follow destination symlinks into unrelated files', async () => {
  const target = await mkdtemp(join(tmpdir(), 'cube-theme-link-'));
  try {
    await writeFile(join(target, 'keep.txt'), 'unrelated work');
    await symlink(join(target, 'keep.txt'), join(target, 'tokens.css'));
    assert.notEqual(run(target).status, 0);
    assert.equal(await readFile(join(target, 'keep.txt'), 'utf8'), 'unrelated work');
  } finally { await rm(target, { recursive: true, force: true }); }
});

test('the command requires an explicit non-overlapping destination', () => {
  assert.notEqual(run().status, 0);
  assert.notEqual(run(source).status, 0);
  assert.equal(run('--help').status, 0);
});
