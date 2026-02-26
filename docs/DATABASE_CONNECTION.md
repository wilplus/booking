# Fixing "Can't reach database server" (Supabase)

If `npx prisma db push` or `npm run db:seed` fails with **Can't reach database server at `db.xxx.supabase.co:5432`**, your app is using the **direct** connection, which is **IPv6-only** and often unreachable from home/office networks.

## Use the Session mode pooler (recommended)

1. Open your project in the **Supabase Dashboard**.
2. Click **Connect** (top of the page) or go to **Settings → Database**.
3. Under connection strings, select **Session mode** (not "Direct" and not "Transaction" for this step).
4. Copy the **URI**. It should look like:
   ```text
   postgres://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   Example region: `eu-central-1`, `us-east-1`, etc.
5. Replace `[YOUR-PASSWORD]` with your **database password** (the one you set for the project).
6. If the password contains special characters (`@`, `#`, `/`, `%`, etc.), **URL-encode** them (e.g. `@` → `%40`, `#` → `%23`).
7. Put the full string in your `.env` as:
   ```env
   DATABASE_URL="postgres://postgres.bbsrcewqqmibgasdhppu:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   ```
   (Use your actual project ref, region, and password.)

## Test the connection

From the project root:

```bash
node scripts/test-db-connection.js
```

If you see **OK – database is reachable**, then run:

```bash
npx prisma db push
npm run db:seed
```

## Still failing?

- **Password authentication failed** → Wrong password or wrong user. Reset the DB password in Supabase (Settings → Database) and update `.env`.
- **Project paused** → On the free tier, open the project in the dashboard and click **Restore** if it’s paused.
- **SSL errors** → Add `?sslmode=require` at the end of `DATABASE_URL` (no space before `?`).
