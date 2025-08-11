# AGENTS

## Code Style
- Use 2 spaces for indentation.
- Prefer functional React components with hooks.

## Testing
- Run `pnpm run lint` and `pnpm run test:e2e` before committing.

This repository uses [Vite](https://vitejs.dev) with React for a survey application.
Follow these guidelines when contributing code.

## Environment
- Use **Node.js v20.11.1** and **pnpm v8.10.5**.
- Install dependencies with `pnpm install`.

## Development
- Start the development server with `pnpm run dev`.
- Source files live in the `src/` directory; end-to-end tests are in `e2e/`.

## Code style
- Use modern ES modules (`import`/`export`) and React functional components.
- Indent with 2 spaces and terminate statements with semicolons.
- Add concise [JSDoc](https://jsdoc.app) comments for functions and components.

## Verification
Run these commands before submitting changes:

```bash
pnpm run lint
pnpm run test:e2e
```

Both commands must succeed before commit. Linting checks for style issues and the Playwright suite verifies core interactions.

## Commit messages
- Write commits in the imperative mood: "Add feature" not "Added feature".
- Reference issue numbers when relevant.

