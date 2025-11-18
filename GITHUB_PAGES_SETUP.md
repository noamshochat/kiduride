# GitHub Pages Deployment Setup

This project is configured to deploy to GitHub Pages using GitHub Actions.

## Important Notes

⚠️ **API Routes Limitation**: GitHub Pages only serves static files. The API routes in `app/api/` will not work on GitHub Pages. Since this app uses Supabase directly via `supabaseDb`, the API routes are not needed for the static deployment.

If you need the API routes to work, consider:
- Using Vercel (recommended for Next.js apps with API routes)
- Deploying API routes separately to a serverless platform
- Removing the API routes if they're not being used

## Setup Steps

1. **Enable GitHub Pages in your repository**:
   - Go to Settings → Pages
   - Source: Select "GitHub Actions"

2. **Add required secrets** (REQUIRED - build will fail without these):
   - Go to: https://github.com/noamshochat/kiduride/settings/secrets/actions
   - Click "New repository secret" and add these secrets:
     - Name: `NEXT_PUBLIC_SUPABASE_URL`
       Value: Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
     - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
       Value: Your Supabase anonymous/public key
   - **Important**: These secrets are REQUIRED for the build to succeed. The app uses Supabase for data storage, and these values are baked into the static build.

3. **The deployment will trigger automatically** when you push to the `main` branch.

## Accessing Your Site

Once deployed, your site will be available at:
`https://noamshochat.github.io/kiduride/`

Note: The basePath is set to `/kiduride` to match your repository name.

## Local Development

For local development, the basePath is empty, so you can run:
```bash
npm run dev
```

And access the app at `http://localhost:3000`

## Building Locally

To test the static export locally:
```bash
npm run build
```

The static files will be in the `out` directory.

