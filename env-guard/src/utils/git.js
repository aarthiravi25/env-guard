import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { exists, normalizePath } from './file.js';

const execAsync = promisify(exec);

/**
 * Check if the given directory is inside a Git repository
 * @param {string} dir - The directory path to check
 * @returns {Promise<boolean>}
 */
export async function isGitRepository(dir) {
  const dotGitPath = path.join(dir, '.git');
  if (await exists(dotGitPath)) {
    return true;
  }

  try {
    const { stdout } = await execAsync('git rev-parse --is-inside-work-tree', { cwd: dir });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Get all staged, non-deleted files in the git index for the target directory.
 * Safely handles repositories without initial commits by falling back to empty tree diffing.
 * @param {string} dir - Target directory
 * @returns {Promise<string[]>} - List of absolute, normalized file paths
 */
export async function getStagedFiles(dir) {
  const isRepo = await isGitRepository(dir);
  if (!isRepo) {
    throw new Error('Not a Git repository.');
  }

  let stdout = '';
  try {
    // Try standard staged diff comparing index to HEAD
    const result = await execAsync('git diff --cached --name-only --diff-filter=d', { cwd: dir });
    stdout = result.stdout;
  } catch (err) {
    // If it fails (usually because there is no initial commit / HEAD is unborn),
    // we diff against Git's standard empty tree hash.
    try {
      const result = await execAsync('git diff --cached --name-only --diff-filter=d 4b825dc642cb6eb9a030e54bf8d69288fbee4904', { cwd: dir });
      stdout = result.stdout;
    } catch {
      // If both fail, fall back to parsing status porcelain
      try {
        const { stdout: statusOut } = await execAsync('git status --porcelain', { cwd: dir });
        const stagedList = [];
        const lines = statusOut.split(/\r?\n/);
        for (const line of lines) {
          // Staged statuses: 'A ', 'M ', 'R ' (first letter is index status)
          const indexStatus = line[0];
          const worktreeStatus = line[1];
          if (indexStatus && indexStatus !== ' ' && indexStatus !== '?' && worktreeStatus !== 'D') {
            // Extract filename, handling potential renaming (R status displays: "R  old -> new")
            let filePart = line.substring(3).trim();
            if (filePart.includes(' -> ')) {
              filePart = filePart.split(' -> ')[1];
            }
            // Strip potential enclosing double quotes
            filePart = filePart.replace(/^"|"$/g, '');
            stagedList.push(filePart);
          }
        }
        return stagedList.map(f => normalizePath(path.resolve(dir, f)));
      } catch (statusErr) {
        throw new Error(`Failed to retrieve staged files: ${statusErr.message}`);
      }
    }
  }

  return stdout
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(file => normalizePath(path.resolve(dir, file)));
}
