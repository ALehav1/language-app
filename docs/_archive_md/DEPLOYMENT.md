# Vercel Deployment History & Guide

**Current Production URL:** https://language-l68eo6ut3-alehav1s-projects.vercel.app

---

## Latest Deployment (January 10, 2026 - 4:30 PM)

**Version:** 1.4 - Fixed Tile Order & Removed Redundant UI  
**URL:** https://language-l68eo6ut3-alehav1s-projects.vercel.app

### Changes Deployed
- **Correct tile order in Lessons:** Context → Memory Aid → Example Sentences → Chat → Save
- **Removed ALL redundant memory aid UI** from SaveDecisionPanel  
- **No more duplicate memory aid sections**
- **Example sentences now appear AFTER Memory Aid tile**

### Tile Order (Final)
1. WordDisplay (word details, NO examples shown)
2. ContextTile (root, usage, MSA comparison)
3. MemoryAidTile (image + note dropdown)
4. Example Sentences (manually rendered)
5. ChatTile (AI Q&A)
6. SaveDecisionPanel (ONLY Practice/Archive/Skip buttons)
5. **ChatTile** - Interactive AI Q&A
6. **SaveDecisionPanel** - Practice/Archive/Skip buttons ONLY (no embedded memory aid)

### AI Improvements
- **Forbidden MSA words:** ممكن, مرآة, غرفة, سيارة, حقيبة (use Egyptian equivalents)
- **Required harakat:** All Arabic text includes vowel marks (َ ُ ِ ْ ً ٌ ٍ ّ)
- **Native Egyptian vocabulary:** Not MSA adapted to Egyptian pronunciation

---

## Previous Deployments

### January 10, 2026 - 11:00 AM
**URL:** https://language-o87w7kacs-alehav1s-projects.vercel.app
- Fixed Egyptian dialect enforcement
- Added vowel mark requirements

### January 10, 2026 - 10:15 AM
**URL:** https://language-g8e021s8w-alehav1s-projects.vercel.app
- Added MemoryAidTile as separate dropdown
- Reordered tiles: Context before examples

### January 10, 2026 - 9:30 AM
**URL:** https://language-3qvhgu0di-alehav1s-projects.vercel.app
- Fixed sentence detection (only 2+ sentences = passage)
- Unified Lookup and Lessons to use WordDisplay

---

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
