# Deploy Runbook

## Local Development

### Prerequisites
- Node.js v20.11.1 (use `nvm use` if you have `.nvmrc`)
- pnpm v8.10.5 (install with `npm install -g pnpm@8.10.5`)

### Setup
```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

The development server will run at `http://localhost:5173/`.

### Environment Variables
Create a `.env` file with:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Development Modes
- `?dev=true` - Start directly at survey
- `?play=true` - Start directly at swipe game

## CI/CD Pipeline

### GitHub Actions (Automated)
The CI pipeline runs on every push/PR and includes:

1. **Install Dependencies** - Uses pnpm with frozen lockfile
2. **Lint** - ESLint checks
3. **Type Check** - Basic TypeScript validation  
4. **Unit Tests** - Vitest test suite
5. **Build** - Vite production build
6. **E2E Tests** - Playwright test suite

Playwright browsers are **only installed in CI**, never during build.

### Environment Separation
- **CI**: Runs all tests, validates code quality
- **Netlify**: Only builds and deploys, skips tests and browser installs

## Netlify Deployment

### Configuration
- **Build Command**: `pnpm run build`
- **Publish Directory**: `dist`
- **Node Version**: 20.11.1
- **pnpm Version**: 8.10.5

### Environment Variables (Netlify UI)
Set these in Netlify Site Settings > Environment Variables:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build Process
1. Environment validation (fails fast if vars missing)
2. Vite production build (no tests or side effects)
3. Deploy to CDN

### Troubleshooting

#### Build Failures
- **Missing env vars**: Check Netlify environment settings
- **Node version**: Ensure 20.11.1 is specified in netlify.toml
- **Playwright errors**: Should be skipped automatically on Netlify

#### Clear Cache & Redeploy
Use Netlify dashboard "Clear cache and deploy site" for fresh builds.

### Local Testing of Production Build
```bash
# Test the exact build command Netlify uses
pnpm run build

# Preview the built site
pnpm run preview
```

## Architecture

### Build Separation
- **Development**: Full toolchain including Playwright
- **CI**: Tests and quality checks with browser installs
- **Production**: Pure Vite build, no tests or browsers

### Key Files
- `scripts/check-env.mjs` - Environment validation
- `scripts/setup-playwright.mjs` - Smart browser installation
- `netlify.toml` - Deployment configuration
- `.github/workflows/ci.yml` - CI pipeline

This separation ensures reliable deployments while maintaining comprehensive testing.