# noemi-survey-app

A React + Vite survey application that asks a few questions and then presents label designs in a Tinder-like swipe game. Swipe
choices are written to Supabase for later analysis.

## Requirements

- Node.js v20.11.1
- pnpm v8.10.5
- A Supabase project with `designs` and `swipes` tables

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create a `.env` file in the project root with your Supabase credentials:
   ```bash
   VITE_SUPABASE_URL=<your-supabase-url>
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   ```
3. Add label images under `public/designs` for the swipe game.

## Project structure

- `src/` – application source code
- `public/designs` – swipeable label images
- `e2e/` – Playwright end-to-end tests
- `docs/` – additional documentation

## Development

- `pnpm run dev` – start a local development server
- `pnpm run build` – create a production build in `dist/`
- `pnpm run preview` – serve the production build locally
- `pnpm run lint` – run ESLint to check code quality

## Testing

Playwright powers the end-to-end tests and a unit-test framework can be added as needed. Run the following before committing:

```bash
pnpm run lint
pnpm run test:e2e   # verify core user flows
pnpm run test       # run unit tests if configured
```

## Deployment

The repository includes `netlify.toml` for Netlify deployments.

1. Connect the repository to Netlify or deploy with the Netlify CLI.
2. Configure the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify site settings.
3. Netlify build command: `pnpm run build`.
4. Publish directory: `dist`.

After deployment, the survey will be available at the Netlify-provided URL.

## Contribution & acceptance criteria

Pull requests are merged only when they meet all of the following:

- Add unit tests for all new or changed logic.
- Add or update end-to-end tests for any affected user flow.
- Run `pnpm run lint`, all unit tests, and `pnpm run test:e2e`; all must pass.
- Fix lint errors and address warnings when possible.
- Follow the style and environment guidelines in `AGENTS.md`.
