#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import path from 'path';
import { readFile } from 'fs/promises';

import { checkCommand } from '../src/commands/check.js';
import { fixCommand } from '../src/commands/fix.js';
import { initCommand } from '../src/commands/init.js';
import { scanCommand } from '../src/commands/scan.js';
import { logger } from '../src/utils/logger.js';

// Resolve paths for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  const program = new Command();

  try {
    // Read package.json metadata
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));

    program
      .name('env-guard')
      .description(packageJson.description || 'Prevent secrets exposure in Git')
      .version(packageJson.version || '1.0.0');

    // Register check command
    program
      .command('check')
      .description('Verify that all root environment files are ignored in .gitignore')
      .action(async () => {
        try {
          const success = await checkCommand();
          if (!success) {
            process.exit(1);
          }
          process.exit(0);
        } catch (err) {
          logger.error(`Check command failed: ${err.message}`);
          process.exit(1);
        }
      });

    // Register fix command
    program
      .command('fix')
      .description('Automatically add any unignored environment files to .gitignore')
      .action(async () => {
        try {
          const success = await fixCommand();
          if (!success) {
            process.exit(1);
          }
          process.exit(0);
        } catch (err) {
          logger.error(`Fix command failed: ${err.message}`);
          process.exit(1);
        }
      });

    // Register init command
    program
      .command('init')
      .description('Initialize env-guard configuration (setup .gitignore & .env.example)')
      .option('--husky', 'Configure Husky pre-commit hook automatically')
      .action(async (options) => {
        try {
          const success = await initCommand(process.cwd(), options);
          if (!success) {
            process.exit(1);
          }
          process.exit(0);
        } catch (err) {
          logger.error(`Init command failed: ${err.message}`);
          process.exit(1);
        }
      });

    // Register scan command
    program
      .command('scan')
      .description('Scan project files for hardcoded credentials & API keys')
      .option('--staged', 'Scan only staged git files')
      .action(async (options) => {
        try {
          const success = await scanCommand(process.cwd(), options);
          if (!success) {
            process.exit(1);
          }
          process.exit(0);
        } catch (err) {
          logger.error(`Scan command failed: ${err.message}`);
          process.exit(1);
        }
      });

    // Handle invalid commands
    program.on('command:*', () => {
      logger.error(`Invalid command: ${program.args.join(' ')}`);
      logger.info('Use "env-guard --help" to see all available commands.');
      process.exit(1);
    });

    await program.parseAsync(process.argv);

    // If no arguments passed, output help menu
    if (process.argv.length === 2) {
      program.outputHelp();
    }
  } catch (err) {
    logger.error(`CLI initialization error: ${err.message}`);
    process.exit(1);
  }
}

start();
