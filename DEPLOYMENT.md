# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Supabase project with database configured
- OpenAI API key

## Deployment Steps

### 1. Install Vercel CLI (Optional)
```bash
npm i -g vercel
```

### 2. Deploy via Vercel CLI
```bash
vercel
```

Or deploy via Vercel Dashboard by connecting your GitHub repository.

### 3. Configure Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | From Supabase Dashboard → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | From Supabase Dashboard → Settings → API |
| `VITE_OPENAI_API_KEY` | Your OpenAI API key | From OpenAI Platform → API Keys |

**IMPORTANT**: Add these to all environments (Production, Preview, Development).

### 4. Redeploy
After adding environment variables, trigger a new deployment:
- Via CLI: `vercel --prod`
- Via Dashboard: Go to Deployments → Click "..." → Redeploy

## Configuration Files

### vercel.json
- **buildCommand**: `npm run build` - Compiles TypeScript + builds Vite
- **outputDirectory**: `dist` - Where Vite outputs the built files
- **framework**: `vite` - Optimized for Vite projects
- **rewrites**: Routes all requests to index.html for React Router

### Build Process
1. TypeScript compilation (`tsc`)
2. Vite build (bundles React app)
3. Output to `dist/` directory
4. Vercel serves static files with SPA routing

## Supabase Configuration

Ensure your Supabase URL is whitelisted in Vercel:
1. Supabase Dashboard → Settings → API
2. Add your Vercel domain to allowed origins if needed

## Troubleshooting

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding variables
- Check Vercel deployment logs

### 404 on Routes
- Verify `vercel.json` rewrites configuration
- Check that `dist/index.html` exists after build

### Build Failures
- Check Vercel build logs
- Verify all dependencies in `package.json`
- Ensure TypeScript compiles without errors: `npm run build`

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Successful deployment (no build errors)
- [ ] Test all routes work (/, /exercise/:id, /saved)
- [ ] Verify Supabase connection
- [ ] Test AI lesson generation
- [ ] Verify OpenAI integration
- [ ] Check mobile responsiveness (375px, 768px, 1024px)
- [ ] Test exercise flow end-to-end

## Production URL
After deployment, your app will be available at:
- `https://your-project.vercel.app`
- Custom domain (optional - configure in Vercel Dashboard)

## Continuous Deployment
If using GitHub integration:
- Push to main branch → auto-deploys to production
- Pull requests → auto-creates preview deployments
