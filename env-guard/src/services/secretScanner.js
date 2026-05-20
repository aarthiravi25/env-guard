import { SECRET_PATTERNS } from '../utils/constants.js';

/**
 * Mask a secret value to protect it from being exposed in logs.
 * Provides high-fidelity, secure masking keeping prefixes/lengths in mind.
 * @param {string} secret 
 * @returns {string}
 */
export function maskSecret(secret) {
  if (!secret) return '';
  const len = secret.length;

  if (len <= 8) {
    return '*'.repeat(len);
  }

  if (secret.startsWith('sk-proj-')) {
    return `sk-proj-${secret.substring(8, 12)}...${secret.substring(len - 4)}`;
  }

  if (secret.startsWith('sk-')) {
    return `sk-${secret.substring(3, 7)}...${secret.substring(len - 4)}`;
  }

  if (secret.startsWith('AIza')) {
    return `AIza...${secret.substring(len - 4)}`;
  }

  // Handle generic secrets (e.g. database credentials or key assignments)
  return `${secret.substring(0, 4)}...${secret.substring(len - 4)}`;
}

/**
 * Scan a single file content line by line for sensitive secrets.
 * Ensures the excerpt is fully masked for absolute leak safety.
 * @param {string} content - Raw content of the file
 * @returns {Array<{patternName: string, lineNumber: number, fullMatch: string, secretValue: string, maskedSecret: string, safeExcerpt: string}>}
 */
export function scanContent(content) {
  const lines = content.split(/\r?\n/);
  const findings = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    for (const pattern of SECRET_PATTERNS) {
      // Re-compile or create a fresh copy of the global RegExp to avoid state sharing
      const regex = new RegExp(pattern.regex);
      let match;

      while ((match = regex.exec(line)) !== null) {
        // If there's a capture group, the secret is in group 1. Otherwise, it is the whole match.
        const fullMatch = match[0];
        const secretVal = match[1] || match[0];

        // Avoid pushing duplicates for the same line and position
        const isDuplicate = findings.some(f => 
          f.lineNumber === lineNumber && 
          f.patternName === pattern.name && 
          f.secretValue === secretVal
        );

        if (!isDuplicate) {
          const masked = maskSecret(secretVal);
          const rawExcerpt = line.trim();
          
          // Pre-mask the excerpt safely to make it impossible to leak raw keys
          const safeExcerpt = rawExcerpt.replace(secretVal, masked);

          findings.push({
            patternName: pattern.name,
            lineNumber,
            fullMatch,
            secretValue: secretVal,
            maskedSecret: masked,
            safeExcerpt
          });
        }
      }
    }
  }

  return findings;
}
