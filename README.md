# CricStats — SportMonks Cricket Players

A React + Vite application that shows:

- Players listing page with search, filters, sorting, and client-side pagination.
- Single player page with detailed info, aggregated career stats, and teams.

## Tech

- React (JSX)
- React Router
- Custom CSS (no UI framework)
- IndexedDB for client-side caching

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
cp .env.example .env
```

3. Add your SportMonks token in `.env`:

```env
VITE_SPORTMONKS_API_TOKEN=your_token_here
```

4. Run locally:

```bash
npm run dev
```

## Scripts

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run preview` — preview built app
- `npm run lint` — run ESLint
- `npm run format` — apply Prettier

## Caching strategy

- Players list is cached in IndexedDB (`players_list_v1`).
- Country map is cached in IndexedDB (`country_map_v1`).
- Career tournament map is lazily loaded and cached (`career_tournament_map_v1`).

## Production note

This project is frontend-only by requirement. API token is therefore shipped to the client.
For real production environments, route requests through a backend/BFF to keep tokens private.
