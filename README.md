# NOEMI Survey Application

A luxury-grade React + Vite survey application featuring an elegant design exploration interface. Users complete a wellness survey and then engage with a sophisticated swipe-based design exploration tool with instant image transitions.

## Philosophy

This application prioritizes **user interaction and luxury aesthetic** above all else. Every interaction is designed to feel premium and responsive, with comprehensive testing ensuring reliability across all user touchpoints. The codebase emphasizes modularity, robustness, and GitHub Copilot-friendly structure.

## Key Features

- **Luxury UI/UX**: Premium aesthetic with smooth animations and transitions
- **Robust Architecture**: Modular, well-tested components resilient to changes
- **Instant Image Loading**: Advanced preloading ensures lag-free design exploration
- **Comprehensive Testing**: Unit, integration, and e2e tests for all interactions
- **AI-Friendly Codebase**: Clear structure optimized for GitHub Copilot assistance

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

## Testing Philosophy

**All interactions must be tested.** This application is designed for user engagement, so every button click, swipe gesture, form input, and navigation flow requires comprehensive test coverage.

### Testing Strategy

- **Unit Tests**: Every utility function and component method
- **Component Tests**: All props, states, and user interactions
- **Integration Tests**: Cross-component workflows and data flow
- **E2E Tests**: Complete user journeys from start to finish
- **Visual Regression Tests**: UI consistency across updates
- **Accessibility Tests**: Screen reader and keyboard navigation

### Testing Commands

```bash
pnpm run test          # Unit and component tests (must pass)
pnpm run test:e2e      # End-to-end tests (must pass)
pnpm run lint          # Code quality checks (must pass)
```

**Requirements for CI/PR Approval:**

- ✅ All unit tests passing
- ✅ All e2e tests passing (or manual verification)
- ✅ ESLint with no errors
- ✅ Build succeeds
- ✅ Test coverage above 80% for new code

## Deployment

The repository includes `netlify.toml` for Netlify deployments.

1. Connect the repository to Netlify or deploy with the Netlify CLI.
2. Configure the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Netlify site settings.
3. Netlify build command: `pnpm run build`.
4. Publish directory: `dist`.

After deployment, the survey will be available at the Netlify-provided URL.

## Quick Start

1. pnpm install
2. Create .env with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
3. Apply SQL in supabase/migrations/0001_init.sql
4. pnpm dev
5. npx playwright install && pnpm test:e2e

## Contribution & acceptance criteria

Pull requests are merged only when they meet all of the following:

- Add unit tests for all new or changed logic.
- Add or update end-to-end tests for any affected user flow.
- Run `pnpm run lint`, all unit tests, and `pnpm run test:e2e`; all must pass.
- Fix lint errors and address warnings when possible.
- Follow the style and environment guidelines in `AGENTS.md`.
