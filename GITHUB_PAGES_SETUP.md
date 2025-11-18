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

2. **Add required secrets** (if not already added):
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

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

