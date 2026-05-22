import { scannerService } from '../services/scannerService.js';
import { logger } from '../utils/logger.js';
import { isGitRepository, getStagedFiles } from '../utils/git.js';

/**
 * Execute the secret scanning command
 * @param {string} projectDir 
 * @param {object} [options] 
 * @param {boolean} [options.staged] - Scan only staged git files
 * @returns {Promise<boolean>} - True if clean (no secrets found), false if secrets found
 */
export async function scanCommand(projectDir = process.cwd(), options = {}) {
  const staged = !!options.staged;

  logger.header('Secret Scan');
  
  let filesToScan = null;

  if (staged) {
    logger.dim(`Scanning staged Git files in: ${projectDir}`);
    
    // 1. Verify it's a Git repository
    const isGit = await isGitRepository(projectDir);
    if (!isGit) {
      logger.error('Error: Staged scan requested, but this directory is not inside a Git repository.');
      return false;
    }

    try {
      // 2. Fetch staged files
      const stagedFiles = await getStagedFiles(projectDir);
      if (stagedFiles.length === 0) {
        logger.success('No staged changes detected. Skipping staged file scan.');
        return true;
      }
      
      filesToScan = stagedFiles;
      logger.info(`Detected ${stagedFiles.length} staged file(s) to scan.`);
    } catch (err) {
      logger.error(`Failed to retrieve staged files: ${err.message}`);
      return false;
    }
  } else {
    logger.dim(`Scanning codebase for hardcoded secrets in: ${projectDir}`);
    logger.dim('This checks file contents against known signatures (OpenAI, AWS, Google APIs, JWT, MongoDB, etc.)...\n');
  }

  try {
    const report = await scannerService.scanProject(projectDir, { filesToScan });

    logger.info(`Scanned ${report.scannedFilesCount} files.`);

    if (report.findings.length === 0) {
      logger.log();
      logger.success('No secrets or private keys detected in your codebase. Good job!');
      return true;
    }

    let totalSecrets = 0;
    for (const finding of report.findings) {
      totalSecrets += finding.secrets.length;
    }

    logger.log();
    logger.warnBlock('Secrets Detected!', [
      `Found ${totalSecrets} potential secret(s) exposed in ${report.findings.length} file(s)!`,
      'Please review the files below and move sensitive configurations to .env files.'
    ]);

    for (const finding of report.findings) {
      logger.bold(`📄 ${finding.relativePath}`);
      
      for (const secret of finding.secrets) {
        // Safe excerpt is pre-masked in secretScanner, so we can print it directly
        logger.log(
          `  ⚠ Line ${secret.lineNumber}: ${secret.patternName}`
        );
        logger.dim(`    Snippet: ${secret.maskedSecret}`);
        logger.dim(`    Line:    ${secret.safeExcerpt}`);
        logger.log();
      }
    }

    return false;
  } catch (err) {
    logger.error(`Scan execution failed: ${err.message}`);
    return false;
  }
}
