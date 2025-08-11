# noemi-survey-app

A React + Vite survey application that presents label designs in a Tinder-like swipe game. Swipes are stored in Supabase for later analysis.

## Prerequisites
- Node.js v20.11.1
- pnpm v8.10.5

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
   The app expects `designs` and `swipes` tables to exist in your Supabase project.
3. Add label images under `public/designs` for the swipe game.

## Available scripts

- `pnpm run dev` – start a local development server.
- `pnpm run lint` – run ESLint to check code quality.
- `pnpm run build` – create a production build in `dist/`.
- `pnpm run preview` – serve the production build locally.

## Testing

This project does not currently include automated tests. Use the linter to catch common issues:

```bash
pnpm run lint
```

## Deployment

The repository includes `netlify.toml` for Netlify deployments.

1. Connect the repository to Netlify or deploy with the Netlify CLI.
2. Configure the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify site settings.
3. Netlify build command: `pnpm run build`.
4. Publish directory: `dist`.

After deployment, the survey will be available at the Netlify-provided URL.
