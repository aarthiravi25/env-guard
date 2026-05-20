/**
 * env-guard Programmatic API
 */

// Export commands
export { checkCommand } from './commands/check.js';
export { fixCommand } from './commands/fix.js';
export { initCommand } from './commands/init.js';
export { scanCommand } from './commands/scan.js';

// Export core services
export { gitignoreService } from './services/gitignoreService.js';
export { scannerService } from './services/scannerService.js';
export * as secretScanner from './services/secretScanner.js';
