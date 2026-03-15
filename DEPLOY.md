# BJJ Dashboard — Deployment Guide

## Project Structure

```
bjj-dashboard/
├── api/
│   └── strava.js        ← Serverless function (fetches from Strava)
├── public/
│   └── index.html       ← The dashboard
├── vercel.json          ← Vercel routing config
└── .env.example         ← Environment variable template
```

---

## Step 1 — Create a GitHub repository

1. Go to github.com and create a new repository called `bjj-dashboard`
2. Upload all files from this folder into it (drag and drop on the GitHub website)

---

## Step 2 — Deploy to Vercel

1. Go to vercel.com and sign up (free) with your GitHub account
2. Click **Add New Project** → import your `bjj-dashboard` repo
3. Click **Deploy** — Vercel will detect the project automatically

---

## Step 3 — Add your Strava credentials as environment variables

1. In Vercel, go to your project → **Settings** → **Environment Variables**
2. Add these three variables:

| Name                   | Value                                    |
|------------------------|------------------------------------------|
| `STRAVA_CLIENT_ID`     | 212028                                   |
| `STRAVA_CLIENT_SECRET` | 1f00af461845406f651e36fd02659fa26e125ca8 |
| `STRAVA_REFRESH_TOKEN` | c0c1856f02e2b86d2fab1f81600dc140081f5396 |

3. Click **Save** then go to **Deployments** → **Redeploy**

---

## Step 4 — Update Strava callback domain

1. Go to strava.com/settings/api
2. Change **Authorization Callback Domain** to your Vercel domain
   (e.g. `bjj-dashboard.vercel.app`)

---

## How it works once live

- Every time someone opens the dashboard, it calls `/api/strava`
- The function gets a fresh Strava access token using your refresh token
- It fetches all your activities, filters to BJJ/MMA, and returns them as JSON
- Results are cached for 1 hour (so Strava's rate limits are not hit on every load)
- If the API is unavailable, the dashboard falls back to the pre-loaded data

---

## Keeping it updated

No manual steps needed. Every BJJ session you sync from Garmin to Strava
will automatically appear on the dashboard within 1 hour of syncing.
