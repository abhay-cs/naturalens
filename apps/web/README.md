# Naturalens web

Landing page for Naturalens, hosted on Cloudflare Workers with a D1-backed waitlist.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Next.js dev server does not run the Worker API. To test the waitlist end-to-end locally:

```bash
npm run db:migrate:local
npm run preview
```

## Deploy

```bash
npm run db:migrate   # once, or after new migrations
npm run deploy
```

Live Worker: `https://naturalens-web.abhaysharmacse.workers.dev`

Waitlist emails are stored in the `naturalens-waitlist` D1 database.
