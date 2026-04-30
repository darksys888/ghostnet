# `nx.json` — Field Reference & Nx Operations Guide

JSON forbids comments, so this companion documents every field of `nx.json`
in source order, then explains how the workspace uses Nx natively
(`nx run`, `nx run-many`, `nx affected`, `nx graph`).

Edit `nx.json` and this file together when one changes.

---

## Top-level keys

### `$schema`

```json
"$schema": "./node_modules/nx/schemas/nx-schema.json"
```

JSON Schema reference. Editors (VS Code / JetBrains) read this for
autocompletion and validation while you edit `nx.json`. Required by the
editor, ignored by Nx itself.

---

### `namedInputs`

Reusable file-glob sets that targets reference for **cache invalidation**.
When Nx decides whether a cached task is still valid, it hashes the files
in that target's input set. If nothing in the set changed, the cache hits.

#### `namedInputs.default`

```json
"default": ["{projectRoot}/**/*", "sharedGlobals"]
```

Every file in the project plus repo-wide globals. The broadest, safest
input set — used by `test` (where any change in the project might affect
test outcomes).

#### `namedInputs.production`

```json
"production": [
  "default",
  "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
  "!{projectRoot}/**/*.{cy,e2e}.[jt]s?(x)",
  "!{projectRoot}/cypress/**/*",
  "!{projectRoot}/cypress.config.[jt]s",
  "!{projectRoot}/tsconfig.spec.json",
  "!{projectRoot}/jest.config.[jt]s",
  "!{projectRoot}/vitest.config.[jt]s",
  "!{projectRoot}/.eslintrc.json",
  "!{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}",
  "!{projectRoot}/src/test-setup.[jt]s"
]
```

`default` minus test/lint/config noise. Used by the `build` target so that
editing a unit test, Cypress spec, or ESLint rule does **not** invalidate
a cached build artifact. Each `!`-prefixed glob excludes a path:

| Pattern                                     | Excluded                          |
| ------------------------------------------- | --------------------------------- |
| `**/?(*.)+(spec\|test).[jt]s?(x)?(.snap)`   | unit tests + snapshot files       |
| `**/*.{cy,e2e}.[jt]s?(x)`                   | Cypress / Playwright specs        |
| `cypress/**/*`                              | the entire cypress directory tree |
| `cypress.config.[jt]s`                      | Cypress config                    |
| `tsconfig.spec.json`                        | test-only TypeScript config       |
| `jest.config.[jt]s` / `vitest.config.[jt]s` | test-runner configs               |
| `.eslintrc.json` / `eslint.config.{ext}`    | both legacy + flat ESLint configs |
| `src/test-setup.[jt]s`                      | common test bootstrap files       |

#### `namedInputs.sharedGlobals`

```json
"sharedGlobals": [
  "{workspaceRoot}/tsconfig.base.json",
  "{workspaceRoot}/eslint.config.mjs",
  "{workspaceRoot}/.prettierrc.cjs",
  "{workspaceRoot}/.prettierignore",
  "{workspaceRoot}/.editorconfig",
  "{workspaceRoot}/package.json"
]
```

Files outside any project that still influence every build. Editing the
root `tsconfig.base.json` should bust **every** project's typecheck
cache — this is how. Same for the shared ESLint / Prettier / EditorConfig
files and the root `package.json` (so a workspace-level dependency bump
invalidates downstream caches).

---

### `targetDefaults`

Defaults applied to every project that defines a target with the matching
name. Reduces boilerplate inside per-project `project.json` files; any
project can override these values locally.

#### `targetDefaults.build`

```json
"build": {
  "cache": true,
  "dependsOn": ["^build"],
  "inputs": ["production", "^production"],
  "outputs": [
    "{projectRoot}/dist",
    "{projectRoot}/build",
    "{projectRoot}/.next",
    "!{projectRoot}/.next/cache",
    "{projectRoot}/out",
    "{workspaceRoot}/dist/{projectRoot}"
  ]
}
```

| Field       | Meaning                                                                                        |
| ----------- | ---------------------------------------------------------------------------------------------- |
| `cache`     | Cache the result keyed by the input hash. Hit = skip the build entirely.                       |
| `dependsOn` | `^build` = build upstream dependencies first (topological order).                              |
| `inputs`    | Hash this project's `production` files plus dependencies' `production` files.                  |
| `outputs`   | Glob list of build artifacts Nx restores from cache on a hit. Covers Vite/Webpack/Next.js/SWC. |

The `!{projectRoot}/.next/cache` exclusion stops Nx from caching Next.js's
own internal cache (would double-cache and bloat the Nx cache).

#### `targetDefaults.lint`

```json
"lint": {
  "cache": true,
  "inputs": ["default", "{workspaceRoot}/eslint.config.mjs"]
}
```

Lint is idempotent on unchanged source → safe to cache. Adding the root
ESLint config to the inputs means tweaking a rule busts every project's
lint cache automatically.

#### `targetDefaults.test`

```json
"test": {
  "cache": true,
  "inputs": ["default", "^production"],
  "outputs": ["{projectRoot}/coverage"]
}
```

Tests depend on the **full** source of the current project (including
the test files themselves — that's why `default`, not `production`)
plus the production files of upstream dependencies. Coverage HTML is
captured as an output so it survives cache restores.

#### `targetDefaults.typecheck`

```json
"typecheck": {
  "cache": true,
  "inputs": [
    "default",
    "^production",
    "{workspaceRoot}/tsconfig.base.json"
  ]
}
```

`tsc --noEmit` is deterministic on the same input set. The base
`tsconfig.base.json` is added explicitly because changing strictness
flags or `paths` should invalidate every project's typecheck.

#### `targetDefaults.e2e`

```json
"e2e": {
  "cache": false,
  "dependsOn": ["^build"]
}
```

E2E suites cover network-attached services that are NOT reproducible
from inputs alone (DB state, container health, …). **Caching disabled
on purpose.** `dependsOn: ["^build"]` ensures upstream apps are built
before the suite tries to hit them.

#### `targetDefaults.serve`

```json
"serve": {
  "continuous": true,
  "dependsOn": ["^build"]
}
```

`continuous: true` tells Nx this target runs indefinitely (a dev server)
— Nx won't wait for it before considering downstream targets. Upstream
projects are built first.

---

### `parallel`

```json
"parallel": 3
```

Maximum number of tasks Nx runs concurrently for `nx run-many` and
`nx affected`. Tuned conservatively; raise to 6-8 on a workstation with
plenty of cores + RAM.

---

### `defaultBase`

```json
"defaultBase": "main"
```

The branch Nx compares against when computing `nx affected`. CI workflows
that run "test only what changed" pivot on this. Change to `master` or
`develop` if your default branch is named differently.

---

### `defaultProject`

```json
"defaultProject": "ghostnet"
```

Target of the implicit project for bare commands like `nx lint` (with no
project specified). Set to `ghostnet` (the root project defined in
`project.json`) so workspace-level operations Just Work without a
project name.

```bash
nx check          # → nx run ghostnet:check (no project arg needed)
nx lint           # → workspace-wide eslint .
nx graph          # → opens the project graph
```

---

### `useDaemonProcess`

```json
"useDaemonProcess": true
```

Keep an Nx daemon alive in the background to avoid re-parsing the project
graph on every command (~1s saving per call). Default is `true` since
Nx 19; explicit here for clarity.

---

## How Nx commands work in this workspace

### Run a target on **one project**

```bash
nx run <project>:<target>
nx <target> <project>           # shorthand
```

Examples:

```bash
nx run tests-devcontainer:e2e
nx e2e tests-devcontainer
nx typecheck tests-devcontainer
```

### Run a target on **every project that defines it**

```bash
nx run-many --target=<target> [--parallel=N]
```

Examples:

```bash
nx run-many --target=lint
nx run-many --target=test --parallel=6
nx run-many --targets=lint,typecheck,test --parallel
```

The repo's `npm run check`, `npm run build`, `npm run test`, etc. all
delegate to `nx run-many` under the hood.

### Run only on **affected** projects

```bash
nx affected --target=<target> [--base=<branch>]
```

Computes which projects' inputs have changed since `defaultBase` (or the
branch you pass via `--base`) and runs the target only on those.

```bash
npm run affected           # lint + typecheck + test on affected
npm run affected:test      # test only on affected
npm run affected:build     # build only on affected
```

### Visualise the project graph

```bash
nx graph
```

Opens an interactive graph in your browser. Useful for:

- Seeing module-boundary violations (red edges)
- Spotting cycle hazards
- Visually checking what `nx affected` will run

Aliased as `npm run graph` and `make graph`.

### Generate a new project (sketch)

```bash
nx g @nx/js:library my-lib --directory=libs/my-lib
nx g @nx/next:app web --directory=apps/web
nx g @nx/node:app api --directory=services/api
```

You'll need to install the matching plugin first
(`npm i -D @nx/js`, `@nx/next`, etc.). Each generator scaffolds a
`project.json` with the standard targets defined here.

---

## Caching strategy at a glance

| Target      | Cache | Why                                                           |
| ----------- | ----- | ------------------------------------------------------------- |
| `build`     | yes   | Pure function of `production` inputs.                         |
| `lint`      | yes   | Idempotent on unchanged source + ESLint config.               |
| `test`      | yes   | Deterministic on the same source set.                         |
| `typecheck` | yes   | `tsc --noEmit` is pure.                                       |
| `e2e`       | NO    | Depends on external services, network, DB state.              |
| `serve`     | n/a   | Long-running process; `continuous: true`, no caching meaning. |

The cache lives at `.nx/cache/`. Clear it with `nx reset` (or
`npm run clean`). Caches are keyed by content hashes, so rebuilds across
branches reuse warm artifacts whenever the inputs match.

---

## How to add a new project

1. Pick the right workspace folder (`apps/`, `libs/`, `packages/`,
   `services/`, `bots/`, `tests/`).
2. Run an Nx generator to scaffold:
   ```bash
   nx g @nx/js:library my-feature --directory=libs/my-feature
   ```
3. The generator writes `libs/my-feature/project.json`. The `targetDefaults`
   above flow through automatically — you don't need to redeclare cache /
   inputs / outputs unless you want to override.
4. Run the standard targets:
   ```bash
   nx run-many --target=lint           # picks up the new project
   nx affected --target=test           # if you commit the change
   ```
5. Check the graph:
   ```bash
   nx graph
   ```

---

## Adding tags + module boundaries

The flat ESLint config already wires up `@nx/enforce-module-boundaries`.
Add tags in your `project.json`:

```json
{
  "tags": ["scope:web", "type:feature"]
}
```

Then tighten the `depConstraints` in `eslint.config.mjs` from the current
permissive `{ sourceTag: "*", onlyDependOnLibsWithTags: ["*"] }` to
explicit rules like:

```js
{ sourceTag: 'scope:web',  onlyDependOnLibsWithTags: ['scope:web', 'scope:shared'] }
{ sourceTag: 'type:feature', onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:data-access'] }
```

ESLint will then refuse any import that crosses a forbidden boundary.

---

## Companion: root `project.json`

The workspace itself is registered as the `ghostnet` project (root
`project.json`) so commands like `nx check` work without an explicit
project argument. Targets defined there:

| Target         | Wraps                                             |
| -------------- | ------------------------------------------------- |
| `check`        | `npm run check` (full quality gate)               |
| `lint`         | `eslint . --max-warnings=0` (workspace-wide)      |
| `lint-fix`     | `eslint . --fix`                                  |
| `format`       | `npm run format` (Prettier --write)               |
| `format-check` | `npm run format:check`                            |
| `docker-check` | `docker build --target check -t ghostnet/ci .`    |
| `docker-build` | `docker build --target build -t ghostnet/build .` |
| `graph`        | `nx graph`                                        |

Per-project targets (`build`, `test`, `typecheck`, `e2e`, …) live in
each project's own `project.json`. They inherit cache + inputs + outputs
from the `targetDefaults` documented above.
