/**
 * Constants for env-guard
 */

// Standard environment variable files to detect and check
export const ENV_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  '.env.test',
  '.env.staging',
  '.env.sample',
  '.env.defaults'
];

// Directories that should always be ignored when scanning files
export const DEFAULT_IGNORE_DIRS = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'out',
  'coverage',
  '.next',
  '.nuxt',
  '.cache',
  'bower_components'
];

// Common binary/non-text file extensions to skip during scanning
export const BINARY_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp',
  '.mp4', '.mp3', '.wav', '.webm', '.ogg',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.pdf', '.epub', '.docx', '.xlsx', '.pptx',
  '.woff', '.woff2', '.eot', '.ttf',
  '.exe', '.dll', '.so', '.dylib', '.bin'
];

// High-fidelity secret scanning regexes
export const SECRET_PATTERNS = [
  {
    name: 'OpenAI API Key',
    regex: /\bsk-(?:proj-)?[a-zA-Z0-9]{40,100}\b/g,
    description: 'OpenAI API Secret Key (e.g. sk-proj-...)'
  },
  {
    name: 'AWS Access Key ID',
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    description: 'Amazon Web Services Access Key ID'
  },
  {
    name: 'AWS Secret Access Key',
    regex: /aws_secret_access_key\s*[:=]\s*['"`]([A-Za-z0-9/+=]{40})['"`]/gi,
    description: 'Amazon Web Services Secret Access Key'
  },
  {
    name: 'Google API Key',
    regex: /\bAIza[0-9A-Za-z-_]{35}\b/g,
    description: 'Google Cloud API Key'
  },
  {
    name: 'JSON Web Token (JWT)',
    regex: /\beyJ[a-zA-Z0-9-_]+\.eyJ[a-zA-Z0-9-_]+\.[a-zA-Z0-9-_.+/=]*\b/g,
    description: 'JSON Web Token'
  },
  {
    name: 'MongoDB Connection String',
    regex: /mongodb(?:\+srv)?:\/\/[a-zA-Z0-9\-._~%!$&'()*+,;=]+:[a-zA-Z0-9\-._~%!$&'()*+,;=]+@[a-zA-Z0-9.-]+\b/gi,
    description: 'MongoDB URI containing credentials'
  },
  {
    name: 'Generic API Key / Secret Assignation',
    regex: /\b(?:api_key|apikey|secret|token|password|pass|auth_token|client_secret)\b\s*[:=]\s*['"`]([a-zA-Z0-9_\-+=/]{12,})['"`]/gi,
    description: 'Generic key/token value assignment'
  }
];
