import chalk from 'chalk';

/**
 * Terminal logger with rich styling using chalk
 */
export const logger = {
  /**
   * Log standard message
   */
  log(msg = '') {
    console.log(msg);
  },

  /**
   * Log success message with a green checkmark
   */
  success(msg) {
    console.log(`${chalk.green('✔')} ${msg}`);
  },

  /**
   * Log error message with a red cross mark
   */
  error(msg) {
    console.error(`${chalk.red('✖')} ${chalk.red(msg)}`);
  },

  /**
   * Log warning message with a yellow warning sign
   */
  warn(msg) {
    console.warn(`${chalk.yellow('⚠')} ${chalk.yellow(msg)}`);
  },

  /**
   * Log information message with a cyan info sign
   */
  info(msg) {
    console.log(`${chalk.cyan('ℹ')} ${msg}`);
  },

  /**
   * Print a subtle dim message
   */
  dim(msg) {
    console.log(chalk.dim(msg));
  },

  /**
   * Print bold message
   */
  bold(msg) {
    console.log(chalk.bold(msg));
  },

  /**
   * Print a stylized section header
   */
  header(title) {
    console.log('\n' + chalk.cyan.bold('='.repeat(50)));
    console.log(chalk.cyan.bold(`  ${title.toUpperCase()}`));
    console.log(chalk.cyan.bold('='.repeat(50)) + '\n');
  },

  /**
   * Format warning block
   */
  warnBlock(title, lines) {
    console.log('\n' + chalk.yellow.bold(`⚠ ${title.toUpperCase()}`));
    console.log(chalk.yellow('═'.repeat(title.length + 2)));
    for (const line of lines) {
      console.log(chalk.yellow(`  ${line}`));
    }
    console.log();
  },

  /**
   * Format error block
   */
  errorBlock(title, lines) {
    console.log('\n' + chalk.red.bold(`✖ ${title.toUpperCase()}`));
    console.log(chalk.red('═'.repeat(title.length + 2)));
    for (const line of lines) {
      console.log(chalk.red(`  ${line}`));
    }
    console.log();
  }
};
