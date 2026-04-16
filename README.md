# FPLanner

A tactical squad companion for Fantasy Premier League. Enter your FPL Team ID to preview upcoming fixture difficulty, view your squad on an interactive pitch, and get data-driven transfer recommendations.

## Features

- **Pitch View** — Visual 2D pitch layout with your current squad in formation
- **Fixture Grid** — Scrollable fixture difficulty rating (FDR) table from the current gameweek through GW38
- **Transfer Recommendations** — Server-side computed transfer suggestions based on fixture difficulty
- **Dark / Light mode** — Themed to match the official FPL colour palette

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
- FPL API (proxied via Next.js API routes)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your FPL Team ID.

> **Finding your Team ID:** Go to fantasy.premierleague.com → Points → click your team name → the number in the URL is your ID.

## Environment Variables

Create a `.env.local` file at the project root:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

In production (e.g. Vercel), set `VERCEL_URL` or `NEXT_PUBLIC_BASE_URL` to your deployment URL.

## Project Structure

```
src/
├── app/
│   ├── api/fpl/        # Proxy routes for FPL API (CORS workaround)
│   ├── team/[teamId]/  # Team page (server component)
│   ├── globals.css     # CSS variables + Tailwind import
│   ├── layout.tsx      # Font loading
│   └── page.tsx        # Home — team ID input
├── components/         # UI components (pitch, grid, sidebar, etc.)
├── lib/
│   └── fpl.ts          # Data fetching + transformation
└── types/
    └── fpl.ts          # FPL API + view-model types
```

## Disclaimer

This is an unofficial fan-made tool and is not affiliated with or endorsed by the Premier League or the official Fantasy Premier League product.
