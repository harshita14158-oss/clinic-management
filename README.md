# Heal Dental Digital Clinic

A calm, minimal clinic workflow app built with Next.js, React, Tailwind CSS, Supabase Postgres, Supabase Storage, and custom cookie authentication.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` locally and add the same values in your Vercel project settings under **Settings -> Environment Variables**:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SESSION_SECRET="replace-with-a-long-random-secret-at-least-32-characters"
```

Do not prefix the service role key with `NEXT_PUBLIC_`. It is used only in server-side route handlers.

## Supabase setup

The app expects these existing Supabase tables with the same column names/casing as `prisma/schema.prisma`:

- `User`
- `Patient`
- `Visit`
- `Medicine`
- `InvoiceItem`
- `Document`
- `Appointment`

The Prisma schema is kept only as a table reference. The app does not use Prisma Client.

Create a Supabase Storage bucket named `documents`. Private is safer for medical documents. The app uploads PDFs there and creates signed URLs with a 7-day expiry.

Recommended RLS posture:

- Keep RLS enabled.
- Do not add public anon policies for medical/clinic tables.
- All database access goes through server-side API routes using the service role key.

## Authentication

Staff login uses the `User` table with bcrypt-hashed passwords and a signed, httpOnly session cookie.

Create the first clinic user by calling:

```bash
POST /api/auth/signup
{
  "name": "Dr. Harshita Sharma",
  "email": "healdentaltld@gmail.com",
  "password": "choose-a-strong-password",
  "role": "DOCTOR"
}
```

After the first user exists, only a signed-in doctor can create additional staff users.

## Main routes

- `/checkin` patient QR landing/check-in
- `/register` patient registration
- `/checked` checked-in confirmation
- `/clinic` clinic login
- `/clinic/dashboard` clinic queue/dashboard
- `/clinic/calendar` appointments/calendar
- `/clinic/profile` patient visit entry
- `/clinic/document` generated document preview
- `/p/[visitToken]` patient portal
- `/consent` patient consent screen
