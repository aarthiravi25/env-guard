# Contributing to env-guard

Thank you for your interest in contributing to env-guard! We welcome all kinds of contributions—bug reports, feature suggestions, documentation improvements, and code enhancements.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Git

### Local Setup

```bash
# Clone the repository
git clone https://github.com/your-username/env-guard.git
cd env-guard

# Install dependencies
npm install

# Start the CLI
npm start -- --help
```

## Development Workflow

### Running Commands

```bash
# Run the CLI locally
npm start -- check
npm start -- fix
npm start -- init
npm start -- scan

# Run linting
npm run lint

# Run tests (when configured)
npm test
```

### Before Submitting a PR

1. **Test your changes** — Verify all CLI commands work correctly
2. **Run linting** — Ensure code follows the style guide: `npm run lint`
3. **Test on your platform** — Confirm Windows/Mac/Linux compatibility if applicable
4. **Keep the CLI stable** — Don't break existing commands or change behavior unexpectedly

## Code Standards

- **No unnecessary dependencies** — Keep the package lean
- **Cross-platform safe** — Use path normalization, handle line endings properly
- **Clear error messages** — Users should understand what went wrong
- **Security first** — Any secret handling must mask data appropriately
- **Simple, readable code** — Prefer clarity over complexity

## What We Accept

- 🐛 Bug fixes
- ✨ Small feature improvements
- 📝 Documentation improvements
- 🔒 Security hardening
- 🪟 Cross-platform fixes
- ⚡ Performance improvements

## What We Don't Accept

- Major API breaking changes
- Heavy feature additions (keep scope focused)
- Significant new dependencies without discussion
- Unrelated refactoring

## Questions?

Feel free to open an issue to discuss ideas before investing time in large changes.

---

**Thank you for helping make env-guard better!** 🛡️
