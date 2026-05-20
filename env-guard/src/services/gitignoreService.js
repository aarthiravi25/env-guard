import path from 'path';
import { exists, readFileContent, writeFileContent, normalizePath } from '../utils/file.js';

/**
 * Service to parse, check, and edit .gitignore files
 */
export const gitignoreService = {
  /**
   * Check if a .gitignore file exists in the directory
   * @param {string} projectDir 
   * @returns {Promise<boolean>}
   */
  async gitignoreExists(projectDir) {
    const gitignorePath = path.join(projectDir, '.gitignore');
    return await exists(gitignorePath);
  },

  /**
   * Compile a gitignore rule line to a regular expression
   * @param {string} pattern - One line rule from .gitignore
   * @returns {{regex: RegExp, isNegated: boolean} | null}
   */
  compileRule(pattern) {
    let rule = pattern.trim();
    if (!rule || rule.startsWith('#')) {
      return null;
    }

    const isNegated = rule.startsWith('!');
    if (isNegated) {
      rule = rule.substring(1).trim();
    }

    // Normalize path separators to forward slashes
    rule = normalizePath(rule);

    let regexStr = '';

    // If pattern starts with '/', it matches from the root of the git repo
    const matchFromRoot = rule.startsWith('/');
    if (matchFromRoot) {
      rule = rule.substring(1);
      regexStr = '^';
    } else {
      regexStr = '(^|\\/)';
    }

    const matchDirOnly = rule.endsWith('/');
    if (matchDirOnly) {
      rule = rule.slice(0, -1);
    }

    // Convert glob patterns to regex characters safely
    for (let i = 0; i < rule.length; i++) {
      const char = rule[i];
      if (char === '*') {
        if (rule[i + 1] === '*') {
          // Double asterisk matches zero or more directories
          regexStr += '.*';
          i++;
          if (rule[i + 1] === '/') i++; // skip following slash
        } else {
          // Single asterisk matches any file/directory name (excluding slashes)
          regexStr += '[^/]*';
        }
      } else if (char === '?') {
        regexStr += '[^/]';
      } else if (char === '.') {
        regexStr += '\\.';
      } else if (char === '/') {
        regexStr += '\\/';
      } else {
        // Escape special characters in regex
        regexStr += char.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      }
    }

    if (matchDirOnly) {
      regexStr += '(\\/|$)';
    } else {
      regexStr += '$';
    }

    try {
      return {
        regex: new RegExp(regexStr),
        isNegated
      };
    } catch {
      return null;
    }
  },

  /**
   * Check if a relative file path is ignored by gitignore content
   * @param {string} relativeFilePath - Normalized relative path of the file
   * @param {string} gitignoreContent - Raw contents of .gitignore
   * @returns {boolean} - True if ignored, false otherwise
   */
  isFileIgnored(relativeFilePath, gitignoreContent) {
    const normalizedPath = normalizePath(relativeFilePath);
    const lines = gitignoreContent.split(/\r?\n/);
    const rules = [];

    for (const line of lines) {
      const compiled = this.compileRule(line);
      if (compiled) {
        rules.push(compiled);
      }
    }

    // Git matches top-down, and later matching rules override earlier ones
    let ignored = false;
    for (const rule of rules) {
      if (rule.regex.test(normalizedPath)) {
        ignored = !rule.isNegated;
      }
    }

    return ignored;
  },

  /**
   * Check which environment files in a project are ignored/unignored
   * @param {string} projectDir 
   * @param {string[]} foundEnvFiles - List of absolute paths of found env files
   * @returns {Promise<{ignored: string[], unignored: string[]}>}
   */
  async checkEnvFilesIgnoreStatus(projectDir, foundEnvFiles) {
    const gitignorePath = path.join(projectDir, '.gitignore');
    const status = {
      ignored: [],
      unignored: []
    };

    if (!(await exists(gitignorePath))) {
      status.unignored = foundEnvFiles.map(f => normalizePath(path.relative(projectDir, f)));
      return status;
    }

    const gitignoreContent = await readFileContent(gitignorePath);

    for (const absolutePath of foundEnvFiles) {
      const relativePath = normalizePath(path.relative(projectDir, absolutePath));
      const isIgnored = this.isFileIgnored(relativePath, gitignoreContent);

      if (isIgnored) {
        status.ignored.push(relativePath);
      } else {
        status.unignored.push(relativePath);
      }
    }

    return status;
  },

  /**
   * Add a list of files/patterns to .gitignore
   * @param {string} projectDir 
   * @param {string[]} patternsToAppend 
   * @returns {Promise<boolean>}
   */
  async appendToGitignore(projectDir, patternsToAppend) {
    if (patternsToAppend.length === 0) return false;

    const gitignorePath = path.join(projectDir, '.gitignore');
    let currentContent = '';

    if (await exists(gitignorePath)) {
      currentContent = await readFileContent(gitignorePath);
    }

    // Ensure we start with a clean newline if file has content and doesn't end with one
    let newContent = currentContent;
    if (currentContent && !currentContent.endsWith('\n')) {
      newContent += '\n';
    }

    // Append our environment guard section
    newContent += '\n# Generated by env-guard - Prevent environment secret leaks\n';
    for (const pattern of patternsToAppend) {
      newContent += `${normalizePath(pattern)}\n`;
    }

    await writeFileContent(gitignorePath, newContent);
    return true;
  }
};
