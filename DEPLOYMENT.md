# Deployment Guide

## Recommended Hosting

- **Database**: Supabase PostgreSQL
- **Backend + Frontend**: Railway (single app deployment)

This setup is the best fit for your current code:
- your backend is a Node/Express app with Socket.IO
- your backend already serves the frontend `dist` build in production
- your backend connects to PostgreSQL through `DATABASE_URL`

## Why this setup

- Supabase provides a managed PostgreSQL database with a free tier
- Railway can host your Node backend and serve the frontend from the same origin
- No major frontend API rewrites are required

## Step 1: Set up Supabase

1. Create a Supabase account at https://supabase.com
2. Create a new project
3. In the Supabase project dashboard, go to `Settings > Database`
4. Copy the `Connection string` (postgres URL)
5. Keep this value for Railway environment variables

## Step 2: Prepare your repo

1. Make sure your backend is in production mode by setting `NODE_ENV=production`
2. Confirm your backend `.env` uses the Supabase connection string
   - `DATABASE_URL=postgres://...`
3. Confirm `FRONTEND_URL` points to your deployed Railway app URL once available

## Step 3: Deploy the backend + frontend to Railway

1. Create a Railway account at https://railway.app
2. Create a new project and connect your GitHub repository
3. Select the `backend` folder as the service root
4. Set the Railway service commands:
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
5. Add environment variables to Railway:
   - `DATABASE_URL` = Supabase connection string
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = a strong secret string
   - `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`
   - `FRONTEND_URL` = your Railway app URL (for CORS and email links)

## Step 4: Create a Supabase Database

Your Express backend will use the Supabase database directly.
No additional Supabase hosting is required for frontend if Railway serves the app.

## Step 5: Configure email

Use Gmail app password or another SMTP provider.
Set these env vars in Railway:
- `EMAIL_SERVICE` (e.g. `gmail`)
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`

## Step 6: Verify production

1. Deploy on Railway
2. Open the Railway app URL in browser
3. Check `/health` endpoint:
   - `https://<your-railway-app>.railway.app/health`
4. Confirm frontend loads and auth/register works
5. Confirm email verification and account creation work

## Optional future upgrades

- Add a custom domain on Railway
- Move frontend to Supabase static hosting later if you want separate static site hosting
- Convert authentication to Supabase Auth in a later refactor
- Use Supabase Realtime if you want to replace Socket.IO eventually

## Notes

- The current backend already serves the built frontend when `NODE_ENV=production`
- This keeps the app on one origin, simplifying CORS and API calls
- Supabase is used here only as the managed PostgreSQL database
