import path from 'path';
import { ENV_FILES } from '../utils/constants.js';
import { exists, writeFileContent } from '../utils/file.js';
import { logger } from '../utils/logger.js';
import { gitignoreService } from '../services/gitignoreService.js';

/**
 * Execute the fix command to automatically ignore any unignored env files
 * @param {string} projectDir 
 * @returns {Promise<boolean>} - True if successful, false if failed
 */
export async function fixCommand(projectDir = process.cwd()) {
  logger.dim(`Running environment fix in: ${projectDir}`);

  // 1. Find root env files
  const foundEnvFiles = [];
  for (const envFile of ENV_FILES) {
    const filePath = path.join(projectDir, envFile);
    if (await exists(filePath)) {
      foundEnvFiles.push(filePath);
    }
  }

  // 2. Check if there are any env files in the project
  if (foundEnvFiles.length === 0) {
    logger.info('No environment files (.env*) detected in root. No actions needed.');
    return true;
  }

  const gitignorePath = path.join(projectDir, '.gitignore');
  const gitignoreExists = await exists(gitignorePath);

  // 3. Create .gitignore if missing
  if (!gitignoreExists) {
    try {
      logger.info('.gitignore file not found. Creating a new one...');
      await writeFileContent(gitignorePath, '# Git Ignore File\n');
      logger.success('.gitignore created successfully.');
    } catch (err) {
      logger.error(`Failed to create .gitignore: ${err.message}`);
      return false;
    }
  }

  // 4. Verify ignore status
  const status = await gitignoreService.checkEnvFilesIgnoreStatus(projectDir, foundEnvFiles);

  if (status.unignored.length === 0) {
    logger.success('All environment files are already properly ignored.');
    return true;
  }

  // 5. Append missing ones to .gitignore
  try {
    logger.info(`Adding ${status.unignored.length} missing entry/entries to .gitignore...`);
    
    // We can ignore exact filenames or general wildcards. 
    // Standard practice for a specific project fix is to add the exact relative filenames or a general .env rule.
    // Let's add the exact relative files that were missing to be safe and precise.
    await gitignoreService.appendToGitignore(projectDir, status.unignored);
    
    logger.success('Fix completed successfully!');
    logger.success(`Added the following entries to .gitignore:`);
    for (const file of status.unignored) {
      logger.success(`  + ${file}`);
    }
    
    return true;
  } catch (err) {
    logger.error(`Failed to update .gitignore: ${err.message}`);
    return false;
  }
}
