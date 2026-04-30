// @ts-check
// ESLint flat config — single source of truth for linting JS/TS across the monorepo.
// Flat config replaces the legacy .eslintrc.* files; ESLint 9+ uses this format natively.
// Order matters: later configs override earlier ones, so Prettier MUST be last.

// Nx plugin: enforces module boundaries between apps/libs based on project tags.
import nxPlugin from '@nx/eslint-plugin';
// Disables ESLint stylistic rules that conflict with Prettier (Prettier handles formatting).
import eslintConfigPrettier from 'eslint-config-prettier';
// Maintained fork of eslint-plugin-import with native flat-config + faster TS resolver.
import importX from 'eslint-plugin-import-x';
// Node.js best-practice rules (process.exit, deprecated APIs, etc.).
import n from 'eslint-plugin-n';
// Promise hygiene (always-return, no-nesting, prefer-await-to-then).
import promise from 'eslint-plugin-promise';
// Detects common security anti-patterns (eval, regex DoS, unsafe fs paths).
import security from 'eslint-plugin-security';
// Catches code smells, cognitive complexity, and bug-prone patterns.
import sonarjs from 'eslint-plugin-sonarjs';
// Modern JS idioms — pushes toward newer language features and cleaner APIs.
import unicorn from 'eslint-plugin-unicorn';
// Removes unused imports/vars more aggressively than the built-in rule.
import unusedImports from 'eslint-plugin-unused-imports';
// Pre-built globals for Node, browser, ES2024 environments.
import globals from 'globals';
// typescript-eslint exports a `config` helper that types each segment of the flat array.
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // 1) Global ignores — never lint generated, vendored, or build output.
  {
    ignores: [
      '**/node_modules/**', // installed deps
      '**/dist/**', // bundler/tsc output
      '**/build/**', // alt build dir
      '**/.build/**', // hidden build cache (e.g. dev/retro/.build)
      '**/out/**', // Next.js / static export
      '**/.nx/**', // Nx cache + workspace data
      '**/coverage/**', // test coverage reports
      '**/*.min.js', // minified vendor code
      '**/.next/**', // Next.js dev/build artifacts
      '**/tmp/**', // scratch directory
      'dev/retro/emulator/arcturus/**', // Arcturus submodule
      'dev/retro/nitro/nitro-react/**', // Nitro client submodule
      'dev/retro/nitro/nitro-converter/**', // SWF→nitro converter submodule
      'dev/retro/nitro/nitro-assets/**', // default assets submodule
      'dev/retro/nitro/nitro-swf/**', // SWF pack submodule
    ],
  },

  // 2) TypeScript-ESLint strict + stylistic with type-checking — UHQ baseline for TS.
  // `strictTypeChecked` enables every rule that uses the type system (highest signal).
  // `stylisticTypeChecked` adds opinionated style rules that benefit from types.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // 3) Nx module boundary plugin — prevents lib/app dependency violations.
  // The `flat/base` layer is required; typescript/javascript layers add language rules.
  ...nxPlugin.configs['flat/base'],
  ...nxPlugin.configs['flat/typescript'],
  ...nxPlugin.configs['flat/javascript'],

  // 4) Plugin recommended layers — each contributes its own rule set.
  importX.flatConfigs.recommended, // import order, cycle detection, resolver
  importX.flatConfigs.typescript, // TS-aware import resolution
  promise.configs['flat/recommended'], // promise correctness
  n.configs['flat/recommended'], // node platform rules
  security.configs.recommended, // security anti-patterns
  sonarjs.configs.recommended, // code smells + cognitive complexity
  unicorn.configs['flat/recommended'], // modern JS idioms

  // 5) Workspace-wide language options + project-specific rule tuning.
  {
    languageOptions: {
      ecmaVersion: 2024, // allow latest stable syntax
      sourceType: 'module', // ESM throughout
      globals: {
        ...globals.node, // process, Buffer, __dirname, etc.
        ...globals.browser, // window, document, fetch, etc.
        ...globals.es2024, // newest built-ins
      },
      parserOptions: {
        projectService: true, // typescript-eslint v8 fast project service
        tsconfigRootDir: import.meta.dirname, // anchor TS project lookup at repo root
      },
    },
    plugins: {
      'unused-imports': unusedImports, // registered here so rules below resolve
    },
    settings: {
      // Tell import-x how to resolve `@workspace/foo` style imports via tsconfig paths
      // and standard Node resolution. The TS resolver respects baseUrl + paths.
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true, // also resolve @types/* packages
          project: './tsconfig.base.json', // workspace root tsconfig
        },
        node: true, // fallback to plain Node resolution
      },
    },
    rules: {
      // ── Nx boundaries: permissive default; tighten via tags once apps exist.
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true, // libs must declare buildable deps
          allow: [], // no special-case bypasses
          depConstraints: [
            { sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }, // any → any (replace with strict tags later)
          ],
        },
      ],

      // ── Dead-code elimination: prefer the plugin over the base rule.
      '@typescript-eslint/no-unused-vars': 'off', // disabled in favor of plugin below
      'unused-imports/no-unused-imports': 'error', // strip orphan imports
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_', // _foo = intentionally unused
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // ── Import ordering: stable diffs, fewer merge conflicts.
      'import-x/order': [
        'warn',
        {
          groups: [
            'builtin', // node:fs etc.
            'external', // npm packages
            'internal', // workspace aliases
            'parent', // ../foo
            'sibling', // ./foo
            'index', // ./
            'type', // type-only imports last
          ],
          'newlines-between': 'always', // blank line between groups
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // ── Targeted opinion overrides for plugins whose defaults are noisy.
      'unicorn/prevent-abbreviations': 'off', // ctx/args/e2e are idiomatic
      'unicorn/no-null': 'off', // null is a deliberate value
      // Fastify / Express / etc. plugins are imported as defaults but ALSO have
      // named exports for types — `import-x/no-named-as-default` flags this
      // pattern with no actionable signal in 99% of cases.
      'import-x/no-named-as-default': 'off',
      'unicorn/filename-case': [
        'error',
        { cases: { kebabCase: true, pascalCase: true } }, // foo-bar.ts or FooBar.tsx
      ],
      'unicorn/no-array-reduce': 'off', // reduce is fine when used carefully
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }], // tolerate small repetition

      // ── Node plugin: TS handles these better than runtime checks.
      'n/no-missing-import': 'off', // TS resolves imports authoritatively
      'n/no-unsupported-features/es-syntax': 'off', // we compile via tsc/swc/esbuild
      'n/no-unsupported-features/node-builtins': 'off', // engines field controls this; no need to double-check
      'n/no-extraneous-import': 'off', // monorepo workspaces confuse this rule

      // ── TS strict tweaks: keep the rule but allow common escape hatches.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // strong default but warn (not error)
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true }, // pragmatic for logging
      ],
    },
  },

  // 6) Test files: relax rules that produce noise with no quality benefit.
  {
    files: [
      '**/*.{spec,test}.{ts,tsx,js,jsx}', // foo.spec.ts, bar.test.tsx
      '**/__tests__/**', // jest convention
      '**/*.e2e.{ts,tsx,js,jsx}', // playwright/cypress e2e
      '**/*.cy.{ts,tsx,js,jsx}', // cypress spec files
      '**/cypress/**/*.{ts,tsx,js,jsx}', // cypress support / commands / tasks
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off', // foo!.bar is fine in tests
      '@typescript-eslint/no-explicit-any': 'off', // any is fine in mocks/fixtures
      '@typescript-eslint/unbound-method': 'off', // jest expect calls trigger this
      '@typescript-eslint/no-unused-expressions': 'off', // chai: expect(x).to.exist
      'sonarjs/no-duplicate-string': 'off', // describe('foo') × N is normal
      'security/detect-non-literal-fs-filename': 'off', // fixture paths
    },
  },

  // 6b) Cypress-specific block: declare ambient globals so ESLint stops
  //     flagging `cy`, `Cypress`, `describe`, `it`, etc. as undefined.
  {
    files: ['**/*.cy.{ts,tsx,js,jsx}', '**/cypress/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        cy: 'readonly',
        Cypress: 'readonly',
        expect: 'readonly',
        assert: 'readonly',
        chai: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
        describe: 'readonly',
        context: 'readonly',
        it: 'readonly',
        specify: 'readonly',
      },
    },
    rules: {
      'promise/always-return': 'off', // cy.request().then() is a Cypress chain, not a Promise
      'promise/no-nesting': 'off', // same — cy chains are NOT promises
      'promise/catch-or-return': 'off', // ditto — cy chains handle errors via failOnStatusCode
      'unicorn/no-empty-file': 'off', // support files may legitimately be empty stubs
      'unicorn/require-module-specifiers': 'off', // `export {}` is valid for module marking
      'unicorn/no-array-for-each': 'off', // [...].forEach(it(...)) is idiomatic mocha/cypress
      '@typescript-eslint/no-namespace': 'off', // Cypress.Chainable augmentation needs `namespace`
      '@typescript-eslint/no-floating-promises': 'off', // Cypress chains aren't real promises
      '@typescript-eslint/no-base-to-string': 'off', // res.body in cy.request can be string|object
    },
  },

  // 7) Plain JS / config files: skip type-aware rules (no tsconfig project for them).
  {
    files: [
      '**/*.{js,cjs,mjs}', // pure JS
      '**/*.config.{js,cjs,mjs,ts}', // tool configs (vitest, vite, postcss, etc.)
    ],
    extends: [tseslint.configs.disableTypeChecked], // type-aware rules off here
    rules: {
      'unicorn/prefer-module': 'off', // CJS-style configs (cypress.config.ts) are fine
      'unicorn/prefer-top-level-await': 'off', // not always supported in config tooling
      'security/detect-object-injection': 'off', // false positive on `process.env[key]`
    },
  },

  // 7b) ESLint flat-config + Prettier config files: silence import-x noise.
  // ESLint plugins idiomatically expose a default export that *also* has named
  // exports — `no-named-as-default*` flags this with no actionable signal.
  {
    files: ['eslint.config.{js,cjs,mjs,ts}', '.prettierrc.{js,cjs,mjs}'],
    rules: {
      'import-x/no-named-as-default': 'off',
      'import-x/no-named-as-default-member': 'off',
    },
  },

  // 8) Prettier — MUST be the last entry; turns off any formatting rules
  //    that would conflict with Prettier's output.
  eslintConfigPrettier,
);
