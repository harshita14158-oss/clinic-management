# Heal Dental Digital Clinic

A calm, minimal V1 clinic workflow prototype built with Next.js, React, Tailwind CSS, Node.js API routes and a Prisma/PostgreSQL data model.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Routes

- `/` interactive demo switcher for QR check-in, clinic login, consent and case entry
- `/clinic` clinic dashboard, profile and case entry workflow
- `/p/visit-ABCD123` patient portal
- `/consent` consent screen

## Backend foundation

The Prisma schema is in `prisma/schema.prisma`. Set `DATABASE_URL` from `.env.example`, then run:

```bash
npm run prisma:generate
```

The current UI uses mock data so the workflow can be reviewed immediately before connecting a live PostgreSQL database.
