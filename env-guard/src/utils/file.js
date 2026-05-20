import fs from 'fs/promises';
import path from 'path';

/**
 * Normalize all path separators to forward slashes for cross-platform consistency.
 * This is critical for matching .gitignore rules correctly on Windows.
 * @param {string} filePath 
 * @returns {string}
 */
export function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * Check if a file or directory exists
 * @param {string} filePath - Path to the file or directory
 * @returns {Promise<boolean>} - True if exists, false otherwise
 */
export async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if path is a directory
 * @param {string} filePath - Path to check
 * @returns {Promise<boolean>}
 */
export async function isDirectory(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Recursively find all files in a directory, ignoring specified folders.
 * Uses symlink safety and path normalization.
 * @param {string} dir - Directory to search in
 * @param {string[]} ignoreDirs - List of directory names to ignore
 * @param {Set<string>} visitedPaths - Prevent infinite loops with circular symlinks
 * @returns {Promise<string[]>} - List of absolute, normalized file paths
 */
export async function findFiles(dir, ignoreDirs = [], visitedPaths = new Set()) {
  const results = [];
  const resolvedDir = path.resolve(dir);
  const normalizedDir = normalizePath(resolvedDir);

  if (visitedPaths.has(normalizedDir)) {
    return [];
  }
  visitedPaths.add(normalizedDir);

  try {
    const list = await fs.readdir(resolvedDir, { withFileTypes: true });

    for (const entry of list) {
      const fullPath = path.resolve(resolvedDir, entry.name);
      const normalizedPathStr = normalizePath(fullPath);

      if (entry.isDirectory()) {
        if (ignoreDirs.includes(entry.name)) {
          continue;
        }
        const subFiles = await findFiles(fullPath, ignoreDirs, visitedPaths);
        results.push(...subFiles);
      } else if (entry.isSymbolicLink()) {
        try {
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            if (ignoreDirs.includes(entry.name)) {
              continue;
            }
            const subFiles = await findFiles(fullPath, ignoreDirs, visitedPaths);
            results.push(...subFiles);
          } else if (stats.isFile()) {
            results.push(normalizedPathStr);
          }
        } catch {
          // Dead symbolic link, ignore
        }
      } else if (entry.isFile()) {
        results.push(normalizedPathStr);
      }
    }
  } catch (error) {
    // Gracefully ignore directory read or access permissions errors
  }

  return results;
}

/**
 * Read the content of a file as a UTF-8 string
 * @param {string} filePath 
 * @returns {Promise<string>}
 */
export async function readFileContent(filePath) {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Write content to a file
 * @param {string} filePath 
 * @param {string} content 
 */
export async function writeFileContent(filePath, content) {
  const resolvedPath = path.resolve(filePath);
  const dir = path.dirname(resolvedPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(resolvedPath, content, 'utf-8');
}
