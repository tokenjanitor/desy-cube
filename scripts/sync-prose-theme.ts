import { copyFile, lstat, mkdir, readdir, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Stats } from 'node:fs';

const source = await realpath(fileURLToPath(new URL('../theme/', import.meta.url)));
const args = process.argv.slice(2);

const [destination] = args;
const usage = 'Usage: node scripts/sync-prose-theme.ts <destination-theme-directory>';
if (args.length !== 1 || !destination || destination === '--help') {
  console.log(usage);
  process.exit(args[0] === '--help' ? 0 : 1);
}

const isInside = (parent: string, child: string): boolean => {
  const path = relative(parent, child);
  return path === '' || (!path.startsWith('..' + sep) && path !== '..' && !isAbsolute(path));
};

const statIfPresent = async (path: string): Promise<Stats | null> => {
  try { return await lstat(path); }
  catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
    throw error;
  }
};

async function listFiles(directory: string, prefix = ''): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = prefix ? prefix + '/' + entry.name : entry.name;
    if (entry.isDirectory()) files.push(...await listFiles(resolve(directory, entry.name), path));
    else if (entry.isFile()) files.push(path);
    else throw new Error('Theme sources must be regular files: ' + path);
  }
  return files.sort();
}

try {
  let target = resolve(destination);
  const checkOverlap = () => {
    if (isInside(source, target) || isInside(target, source)) {
      throw new Error('Source and destination must not overlap.');
    }
  };
  checkOverlap();
  const targetStat = await statIfPresent(target);
  if (targetStat && !targetStat.isDirectory()) throw new Error('Destination must be a directory, not a file or symlink.');
  await mkdir(target, { recursive: true });
  target = await realpath(target);
  checkOverlap();
  const files = await listFiles(source);

  // Check every managed path before replacing any destination file.
  for (const file of files) {
    let directory = dirname(resolve(target, file));
    while (directory !== target) {
      const stat = await statIfPresent(directory);
      if (stat && !stat.isDirectory()) throw new Error('Destination directory is not a regular directory: ' + relative(target, directory));
      directory = dirname(directory);
    }
    const stat = await statIfPresent(resolve(target, file));
    if (stat && !stat.isFile()) throw new Error('Destination file is not a regular file: ' + file);
  }

  for (const file of files) {
    const destination = resolve(target, file);
    await mkdir(dirname(destination), { recursive: true });
    await copyFile(resolve(source, file), destination);
  }
  console.log('Copied ' + files.length + ' theme files to ' + target);
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
