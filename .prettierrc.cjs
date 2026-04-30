// Prettier config — CommonJS so we can include comments (JSON form would forbid them).
// Applied to every file under the repo unless excluded by .prettierignore.

/** @type {import("prettier").Config} */
module.exports = {
  // Width before Prettier wraps. 100 reads well on modern wide screens
  // without becoming unscannable on a side-by-side diff.
  printWidth: 100,

  // Indent with 2 spaces — JS/TS community default and matches editorconfig.
  tabWidth: 2,
  useTabs: false,

  // Always emit semicolons — avoids the few ASI gotchas that still bite.
  semi: true,

  // Single quotes for JS/TS strings; JSX gets its own setting below.
  singleQuote: true,
  jsxSingleQuote: false,

  // Trailing commas everywhere they are valid (incl. function params in ES2017+).
  // Produces cleaner git diffs when adding new entries.
  trailingComma: 'all',

  // Spaces inside object/array literals: `{ foo: 1 }` not `{foo: 1}`.
  bracketSpacing: true,

  // Place the closing `>` of a multi-line JSX element on its own line.
  bracketSameLine: false,

  // Always wrap arrow function params in parens: `(x) => x` not `x => x`.
  // Consistent with TS annotations and easier to refactor.
  arrowParens: 'always',

  // Use LF endings — committed files should be platform-independent.
  // .editorconfig + .gitattributes back this up at the VCS layer.
  endOfLine: 'lf',

  // Format embedded code blocks (e.g. CSS-in-JS, Markdown fenced code).
  embeddedLanguageFormatting: 'auto',

  // Per-file overrides: tweak formatting for specific extensions/locations.
  overrides: [
    {
      // Markdown: respect line breaks the author intended.
      files: '*.md',
      options: {
        proseWrap: 'preserve', // do not reflow paragraphs
      },
    },
    {
      // YAML is whitespace-sensitive; keep the conservative defaults.
      files: ['*.yml', '*.yaml'],
      options: {
        singleQuote: false, // YAML idiom prefers double quotes
        tabWidth: 2,
      },
    },
    {
      // JSON files don't allow trailing commas.
      files: ['*.json'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
};
