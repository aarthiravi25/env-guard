import path from 'path';
import fs from 'fs/promises';
import { ENV_FILES } from '../utils/constants.js';
import { exists, writeFileContent, readFileContent, normalizePath } from '../utils/file.js';
import { logger } from '../utils/logger.js';
import { gitignoreService } from '../services/gitignoreService.js';
import { isGitRepository } from '../utils/git.js';

/**
 * Parses a standard .env file content and creates a safe template with values replaced by placeholders
 * @param {string} envContent - Content of existing .env file
 * @returns {string} - Clean, safe template content
 */
export function generateEnvExampleContent(envContent) {
  const lines = envContent.split(/\r?\n/);
  const resultLines = [];

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Preserve empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      resultLines.push(line);
      continue;
    }

    // Match KEY=VALUE pattern
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();

      // If value is empty or already a placeholder, keep it
      if (!value || value.startsWith('YOUR_') || value.startsWith('<YOUR_')) {
        resultLines.push(`${key}=${value}`);
      } else {
        // Generate placeholder based on variable name
        resultLines.push(`${key}=YOUR_${key}_HERE`);
      }
    } else {
      resultLines.push(line);
    }
  }

  return resultLines.join('\n');
}

/**
 * Execute the init command
 * @param {string} projectDir 
 * @param {object} [options]
 * @param {boolean} [options.husky] - Setup Husky pre-commit hook
 * @returns {Promise<boolean>}
 */
export async function initCommand(projectDir = process.cwd(), options = {}) {
  const setupHusky = !!options.husky;

  if (setupHusky) {
    logger.header('Husky Hook Setup');
    
    // 1. Verify Git Repository
    const isGit = await isGitRepository(projectDir);
    if (!isGit) {
      logger.error('Error: Husky setup requested, but this directory is not inside a Git repository.');
      return false;
    }

    const huskyDir = path.join(projectDir, '.husky');
    const preCommitPath = path.join(huskyDir, 'pre-commit');
    const commandToAdd = 'npx env-guard check && npx env-guard scan --staged';

    try {
      // 2. Safely create .husky directory if it does not exist
      if (!(await exists(huskyDir))) {
        logger.info('.husky directory not found. Creating it...');
        await fs.mkdir(huskyDir, { recursive: true });
      }

      let hookContent = '';
      const hookExists = await exists(preCommitPath);

      if (hookExists) {
        // 3. Append to existing pre-commit hook idempotently
        hookContent = await readFileContent(preCommitPath);
        if (hookContent.includes('env-guard')) {
          logger.success('Husky pre-commit hook is already configured with env-guard.');
          return true;
        }

        logger.info('pre-commit hook already exists. Appending env-guard checks safely...');
        hookContent = hookContent.trim();
        hookContent += `\n\n# Run env-guard safety audits\n${commandToAdd}\n`;
      } else {
        // 4. Create new pre-commit hook with shebang
        logger.info('Creating a new Husky pre-commit hook...');
        hookContent = [
          '#!/bin/sh',
          '. "$(dirname "$0")/_/husky.sh"',
          '',
          '# Run env-guard safety audits before committing code',
          commandToAdd,
          ''
        ].join('\n');
      }

      // Write hook and grant execution permissions (0o755 on Unix-like systems)
      // Windows doesn't support file mode, so only set permissions on non-Windows platforms
      if (process.platform !== 'win32') {
        await fs.writeFile(preCommitPath, hookContent, { encoding: 'utf-8', mode: 0o755 });
      } else {
        await fs.writeFile(preCommitPath, hookContent, { encoding: 'utf-8' });
      }
      logger.success('Husky pre-commit hook configured successfully!');
      logger.success(`Added audits: "${commandToAdd}"`);

      // 5. Friendly audit of package.json dependencies
      const pkgPath = path.join(projectDir, 'package.json');
      if (await exists(pkgPath)) {
        try {
          const pkgJson = JSON.parse(await readFileContent(pkgPath));
          const devDeps = pkgJson.devDependencies || {};
          const deps = pkgJson.dependencies || {};
          if (!devDeps.husky && !deps.husky) {
            logger.log();
            logger.warn('Dependency alert: "husky" was not found in your package.json dependencies.');
            logger.info('Please run the following to complete setup:');
            logger.info('  npm install husky --save-dev && npx husky init');
          }
        } catch {
          // Ignore json parse errors
        }
      }

      return true;
    } catch (err) {
      logger.error(`Failed to configure Husky hook: ${err.message}`);
      return false;
    }
  }

  // STANDARD INITIALIZATION FLOW
  logger.dim(`Initializing env-guard in: ${projectDir}`);

  // 1. Initialize .gitignore
  const gitignorePath = path.join(projectDir, '.gitignore');
  const gitignoreExists = await exists(gitignorePath);

  if (!gitignoreExists) {
    logger.info('.gitignore file not found. Creating and configuring...');
    const recommendedIgnore = [
      '# Environment files',
      '.env',
      '.env.local',
      '.env.production',
      '.env.development',
      '.env.test',
      '.env.staging',
      '.env.sample',
      '.env.defaults',
      '# env-guard generated backup / temporary files',
      '.env.backup',
      '.env-guard.log'
    ].join('\n') + '\n';
    
    try {
      await writeFileContent(gitignorePath, recommendedIgnore);
      logger.success('.gitignore created with standard environment ignore rules.');
    } catch (err) {
      logger.error(`Failed to create .gitignore: ${err.message}`);
      return false;
    }
  } else {
    logger.info('.gitignore already exists. Ensuring environment rules are present...');
    // Check if standard .env is ignored
    const isIgnored = gitignoreService.isFileIgnored('.env', await readFileContent(gitignorePath));
    if (!isIgnored) {
      logger.info('Adding standard env ignore rules to existing .gitignore...');
      await gitignoreService.appendToGitignore(projectDir, ['.env', '.env.local', '.env.*.local']);
      logger.success('.gitignore updated with standard environment ignore patterns.');
    } else {
      logger.success('.gitignore is already configured to ignore environment variables.');
    }
  }

  // 2. Initialize .env.example
  const envExamplePath = path.join(projectDir, '.env.example');
  const envExampleExists = await exists(envExamplePath);

  if (envExampleExists) {
    logger.info('.env.example already exists. Skipping creation.');
  } else {
    logger.info('.env.example is missing. Generating template...');
    
    // Check if there is an existing .env to build the template from
    const dotenvPath = path.join(projectDir, '.env');
    const dotenvExists = await exists(dotenvPath);

    let templateContent = '';

    if (dotenvExists) {
      logger.info('Found existing .env file. Generating safe template based on its structure...');
      try {
        const dotEnvContent = await readFileContent(dotenvPath);
        templateContent = generateEnvExampleContent(dotEnvContent);
      } catch (err) {
        logger.warn(`Could not read .env: ${err.message}. Creating default template.`);
      }
    }

    if (!templateContent) {
      // Default template if no .env exists
      templateContent = [
        '# Environment Template (env-guard created)',
        '# Copy this file to .env and fill in your secrets',
        '',
        'PORT=3000',
        'NODE_ENV=development',
        'DATABASE_URL=mongodb://localhost:27017/mydb',
        '',
        '# API Credentials',
        'OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE',
        'GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE',
        'JWT_SECRET=YOUR_JWT_SECRET_HERE'
      ].join('\n') + '\n';
    }

    try {
      await writeFileContent(envExamplePath, templateContent);
      logger.success('.env.example created successfully!');
    } catch (err) {
      logger.error(`Failed to create .env.example: ${err.message}`);
      return false;
    }
  }

  logger.log();
  logger.success('env-guard initialization complete! Your secrets are now guarded.');
  return true;
}
