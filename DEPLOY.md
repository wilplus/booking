# Deploy to Vercel – step-by-step

## 1. Get your code on GitHub

If the project isn’t in a Git repo yet:

```bash
cd /Users/arturwillonski/Documents/booking
git init
git add .
git commit -m "Initial commit – booking MVP"
```

Create a new repository on [github.com](https://github.com/new) (e.g. `booking` or `lesson-booking`). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

(Use your actual repo URL. If you use SSH: `git@github.com:YOUR_USERNAME/YOUR_REPO.git`.)

---

## 2. Create the Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project**.
3. **Import** your GitHub repo (select the one you just pushed).
4. Vercel will detect Next.js. Leave these as-is:
   - **Framework Preset:** Next.js  
   - **Root Directory:** (empty)  
   - **Build Command:** `next build`  
   - **Output Directory:** (default)
5. **Do not click Deploy yet** – add environment variables first.

---

## 3. Add environment variables in Vercel

In the same “Configure Project” screen, open **Environment Variables**.

Add each of these. Use **Production** (and optionally **Preview** if you want preview deployments to work the same).

| Name | Value | Notes |
|------|--------|--------|
| `DATABASE_URL` | Your Supabase connection string | Supabase → Project Settings → Database → **Session mode** pooler URI (not Direct). |
| `NEXTAUTH_SECRET` | Random string | e.g. run `openssl rand -base64 32` and paste. |
| `NEXTAUTH_URL` | `https://booking.willonski.com` | Or your Vercel URL first, e.g. `https://your-project.vercel.app`. |
| `ADMIN_EMAIL` | Your Google email | Only this account can sign in to `/admin`. |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | OAuth 2.0 Client ID. |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | OAuth 2.0 Client secret. |
| `RESEND_API_KEY` | From Resend dashboard | Starts with `re_`. |
| `EMAIL_FROM` | e.g. `booking@willonski.com` | Must be a verified domain in Resend (or use `onboarding@resend.dev` for testing). |
| `CRON_SECRET` | Random string | e.g. `openssl rand -hex 24`. Vercel sends this when calling cron. |
| `TEACHER_TIMEZONE` | e.g. `Europe/Paris` | For slot calculation. |
| `NEXT_PUBLIC_APP_URL` | `https://booking.willonski.com` | Or your Vercel URL. |
| `NEXT_PUBLIC_TEACHER_NAME` | Teacher display name | Shown on the booking page. |
| `NEXT_PUBLIC_TEACHER_PHOTO_URL` | (optional) Photo URL | |
| `NEXT_PUBLIC_TEACHER_BIO` | (optional) Short bio | |
| `NEXT_PUBLIC_ACCENT_COLOR` | (optional) e.g. `#6366f1` | Hex color for UI. |

To generate secrets in the terminal:

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -hex 24      # CRON_SECRET
```

Then click **Deploy**.

---

## 4. After the first deploy

1. Open your deployment URL (e.g. `https://your-project.vercel.app`).
2. Try the booking flow: choose duration → date → time → name/email → confirm.
3. Open `/admin/sign-in` and sign in with the Google account that matches `ADMIN_EMAIL`.

If anything fails, check **Vercel → Project → Deployments → [latest] → Logs / Functions** and fix env or code.

---

## 5. Custom domain (e.g. booking.willonski.com)

1. In Vercel: **Project → Settings → Domains**.
2. Add `booking.willonski.com`.
3. Vercel shows the DNS records. In your DNS provider (where willonski.com is managed):
   - Add the **CNAME** (or A record) Vercel tells you (e.g. `CNAME booking → cname.vercel-dns.com`).
4. Wait for DNS to propagate (minutes to an hour). Vercel will issue SSL automatically.

Then update in Vercel **Environment Variables**:

- `NEXTAUTH_URL` → `https://booking.willonski.com`
- `NEXT_PUBLIC_APP_URL` → `https://booking.willonski.com`

Redeploy if needed (or trigger a new deploy from the Vercel dashboard).

---

## 6. Google OAuth (admin + calendar)

So sign-in and “Connect Google Calendar” work in production:

1. Open [Google Cloud Console](https://console.cloud.google.com) → your project → **APIs & Services → Credentials**.
2. Edit your **OAuth 2.0 Client ID** (Web application).
3. Under **Authorized redirect URIs** add:
   - `https://booking.willonski.com/api/auth/callback/google`
   - `https://booking.willonski.com/api/admin/calendar/callback`
   - If you use a Vercel URL for testing, also add:
     - `https://YOUR_PROJECT.vercel.app/api/auth/callback/google`
     - `https://YOUR_PROJECT.vercel.app/api/admin/calendar/callback`
4. Save.
5. **Enable the Google Calendar API** so busy times are blocked and events can be created: **APIs & Services → Library** → search for “Google Calendar API” → **Enable**. Without this, the app cannot read your calendar busy times or create events.

---

## 7. Cron jobs

Crons are defined in `vercel.json` and run only on **production** (not preview URLs).

- Set `CRON_SECRET` in Vercel (step 3). Vercel sends it when calling your cron endpoints.
- After deploy, check **Vercel → Project → Cron Jobs** to see the single job (`/api/cron/run`), which runs reminders (24h + 1h) and post-session emails every 15 minutes.

---

## 8. Database (Supabase)

- Use the **Session mode** (pooler) connection string in `DATABASE_URL`, not Direct.
- If you haven’t run migrations on the production DB yet, run them once from your machine (with the same `DATABASE_URL` you put in Vercel):

  ```bash
  npx prisma migrate deploy
  ```

  Or run migrations from a one-off script or CI; the app expects the Prisma schema to be applied.

---

## Quick checklist

- [ ] Code on GitHub  
- [ ] Vercel project created and connected to repo  
- [ ] All env vars set (especially `DATABASE_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `CRON_SECRET`, Google, Resend)  
- [ ] First deploy successful  
- [ ] Booking page and admin sign-in work  
- [ ] Custom domain added and DNS set  
- [ ] `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` point to final URL  
- [ ] Google OAuth redirect URIs include production (and calendar callback)  
- [ ] Prisma migrations applied to production DB  

That’s the full path from “code on your machine” to “live on booking.willonski.com”.
