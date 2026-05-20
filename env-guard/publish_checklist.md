# NPM Publishing & Release Checklist: env-guard 🚀

This checklist provides a reliable, step-by-step process for open-source maintainers to publish **env-guard** on the public npm registry successfully.

---

## 📋 1. Pre-Publish Verification

Before initiating a release, ensure the package is functional and all configuration constraints are validated:

- [ ] **Run Linting**: Verify that the codebase matches clean coding rules without syntax anomalies:
  ```bash
  npm run lint
  ```
- [ ] **Run Tests**: Verify that the logic works (when test framework is ready):
  ```bash
  npm run test
  ```
- [ ] **Dry Run Package Inspection**: Run the dry-run command to review the exact list of files packed in the publication tarball:
  ```bash
  npm publish --dry-run
  ```
  *Make sure only `bin/`, `src/`, `README.md`, and `LICENSE` are included. `examples/` and logs should be omitted!*

---

## 🔒 2. NPM Account Configuration

Ensure you are authenticated on the npm registry:

- [ ] **Check Authentication Status**:
  ```bash
  npm whoami
  ```
- [ ] **Log In (If Needed)**:
  ```bash
  npm login
  ```
  *Note: Make sure your email is verified on npmjs.com and 2-Factor Authentication (2FA) is active for maximum account security.*

---

## 🏷️ 3. Semantic Versioning & Tagging

Use standard npm versioning commands to increase version fields in `package.json` and generate Git tags atomically:

- [ ] **Determine Release Scope**:
  - **Patch Release** (e.g., `1.0.0` ➔ `1.0.1`): Minor bug fixes or safe internal refactoring.
    ```bash
    npm version patch -m "chore: release v%s"
    ```
  - **Minor Release** (e.g., `1.0.0` ➔ `1.1.0`): Adding new backwards-compatible features (like staging support).
    ```bash
    npm version minor -m "feat: release v%s"
    ```
  - **Major Release** (e.g., `1.0.0` ➔ `2.0.0`): Introducing breaking API or CLI changes.
    ```bash
    npm version major -m "feat!: release v%s"
    ```

- [ ] **Push Tags to Git**:
  Push changes and release tags to your remote repository:
  ```bash
  git push origin main --tags
  ```

---

## 🚀 4. Executing Publication

Execute public deployment onto the npm registry:

- [ ] **Publish Package**:
  Since `env-guard` is a scoped or unscoped public package, run the publish command:
  ```bash
  npm publish --access public
  ```
- [ ] **Audit Online Registry**:
  Verify the deployment has registered on the public web portal by visiting:
  `https://www.npmjs.com/package/env-guard`

---

## ⚠️ 5. Troubleshooting Common Failures

- **`ERR_NEED_AUTH` / `You must be logged in`**:
  Make sure to run `npm login` inside your shell before publishing.
- **`You do not have permission to publish "env-guard"`**:
  The package name `env-guard` might already be taken by someone else on npm. If so, you can rename your package in `package.json` to a scoped format:
  `"name": "@your-username/env-guard"`
  And run:
  ```bash
  npm publish --access public
  ```
