import path from 'path';
import { findFiles, exists, readFileContent, normalizePath } from '../utils/file.js';
import { DEFAULT_IGNORE_DIRS, BINARY_EXTENSIONS } from '../utils/constants.js';
import { scanContent } from './secretScanner.js';

/**
 * Service to manage scanning the whole codebase for secrets
 */
export const scannerService = {
  /**
   * Scan files in a directory for secrets.
   * Supports scanning the whole project or a targeted set of files (e.g., staged files).
   * @param {string} projectDir - Directory to start scanning
   * @param {object} options 
   * @param {string[]} [options.ignoreDirs] - Custom directories to ignore
   * @param {string[]} [options.filesToScan] - Absolute path array of targeted files to scan
   * @returns {Promise<{scannedFilesCount: number, findings: Array<{filePath: string, relativePath: string, secrets: Array<any>}>}>}
   */
  async scanProject(projectDir, options = {}) {
    let allFiles = [];

    if (options.filesToScan) {
      // Normalize all target paths to ensure cross-platform path separators
      allFiles = options.filesToScan.map(f => normalizePath(f));
    } else {
      const ignoreDirs = options.ignoreDirs || DEFAULT_IGNORE_DIRS;
      allFiles = await findFiles(projectDir, ignoreDirs);
    }

    const report = {
      scannedFilesCount: 0,
      findings: []
    };

    for (const absolutePath of allFiles) {
      const ext = path.extname(absolutePath).toLowerCase();

      // Skip binary files
      if (BINARY_EXTENSIONS.includes(ext)) {
        continue;
      }

      // Skip common lock files
      const basename = path.basename(absolutePath);
      if (basename === 'package-lock.json' || basename === 'yarn.lock' || basename === 'pnpm-lock.yaml') {
        continue;
      }

      // Check if file still exists (files can be deleted after staging or listing)
      if (!(await exists(absolutePath))) {
        continue;
      }

      try {
        const content = await readFileContent(absolutePath);
        report.scannedFilesCount++;

        const secrets = scanContent(content);
        if (secrets.length > 0) {
          report.findings.push({
            filePath: absolutePath,
            relativePath: normalizePath(path.relative(projectDir, absolutePath)),
            secrets
          });
        }
      } catch (err) {
        // Gracefully ignore individual file errors and continue
      }
    }

    return report;
  }
};
