import path from 'path';
import * as p from '@clack/prompts';
import { ENV_FILES } from '../utils/constants.js';
import { exists } from '../utils/file.js';
import { logger } from '../utils/logger.js';
import { gitignoreService } from '../services/gitignoreService.js';
import { isGitRepository } from '../utils/git.js';
import { fixCommand } from './fix.js';

/**
 * Execute the check command
 * @param {string} projectDir - The target directory
 * @returns {Promise<boolean>} - True if clean (no secrets exposed) or successfully fixed, false if there are issues
 */
export async function checkCommand(projectDir = process.cwd()) {
  logger.dim(`Running environment check in: ${projectDir}`);

  // 1. Check if git repository is initialized
  const isGit = await isGitRepository(projectDir);
  if (!isGit) {
    logger.warn('This directory is not a Git repository. Run "git init" to initialize Git.');
  }

  // 2. Find all env files in the directory root
  const foundEnvFiles = [];
  for (const envFile of ENV_FILES) {
    const filePath = path.join(projectDir, envFile);
    if (await exists(filePath)) {
      foundEnvFiles.push(filePath);
    }
  }

  if (foundEnvFiles.length === 0) {
    logger.success('No environment files (.env*) detected in the root directory.');
    return true;
  }

  logger.info(`Detected ${foundEnvFiles.length} environment file(s) in root directory.`);

  // 3. Verify .gitignore exists
  const gitignorePath = path.join(projectDir, '.gitignore');
  const gitignoreExists = await exists(gitignorePath);
  const isInteractive = process.stdout.isTTY && !process.env.CI;

  if (!gitignoreExists) {
    logger.error('.gitignore file is missing in the project root!');
    
    // In interactive environments, offer to run fix immediately
    if (isInteractive) {
      p.intro(p.bgCyan(' env-guard '));
      const shouldFix = await p.confirm({
        message: 'No .gitignore file found. Would you like to create one and ignore env files automatically?',
        initialValue: true
      });

      if (p.isCancel(shouldFix) || !shouldFix) {
        p.cancel('Cancelled. Your environment files remain exposed.');
        for (const envFile of foundEnvFiles) {
          logger.error(`  ✖ ${path.basename(envFile)} is NOT ignored`);
        }
        return false;
      }

      // Run fix automatically
      const fixed = await fixCommand(projectDir);
      if (fixed) {
        p.outro(p.green('✔ .gitignore created and environment files successfully ignored!'));
        return true;
      }
      return false;
    }

    // All env files are unignored since there is no gitignore in CI/hooks
    for (const envFile of foundEnvFiles) {
      logger.error(`  ✖ ${path.basename(envFile)} is NOT ignored (no .gitignore file)`);
    }
    return false;
  }

  logger.success('.gitignore file found.');

  // 4. Check ignore status using gitignoreService
  const status = await gitignoreService.checkEnvFilesIgnoreStatus(projectDir, foundEnvFiles);
  let allSafe = true;

  // Print results nicely
  for (const ignoredFile of status.ignored) {
    logger.success(`${ignoredFile} is successfully ignored.`);
  }

  if (status.unignored.length > 0) {
    allSafe = false;
    logger.log(); // spacing
    
    logger.errorBlock('Vulnerability Detected!', [
      `The following env file(s) are NOT ignored and could be committed to Git:`,
      ...status.unignored.map(file => `  - ${file}`),
    ]);

    // If interactive, offer to auto-fix immediately
    if (isInteractive) {
      p.intro(p.bgCyan(' env-guard '));
      const shouldFix = await p.confirm({
        message: `Would you like to automatically ignore these ${status.unignored.length} files in .gitignore?`,
        initialValue: true
      });

      if (p.isCancel(shouldFix) || !shouldFix) {
        p.cancel('Fix cancelled. Please add them to .gitignore manually to secure the repository.');
        return false;
      }

      // Run fix automatically
      const fixed = await fixCommand(projectDir);
      if (fixed) {
        p.outro(p.green('✔ .gitignore updated and environment files successfully ignored!'));
        return true;
      }
      return false;
    } else {
      logger.info('Action required: Run "env-guard fix" to ignore these files.');
    }
  } else {
    logger.success('All detected environment files are safely ignored in .gitignore!');
  }

  return allSafe;
}
