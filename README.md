# TechPulse

TechPulse is a personal technology intelligence dashboard for tracking AI/ML research, patent-related developments, technology news, and saved resources in one place.

The application aggregates live content from multiple sources, persists article state, and provides a lightweight interface for reviewing and organizing technical information.

## Features

- Aggregates Hacker News and arXiv content
- Persists saved/read article state with Supabase
- Server-side data fetching and storage
- Article preview expansion
- Saved-article workflow
- Modular navigation for research, learning, stocks, and technical intelligence
- Incremental revalidation for updated content

## Tech Stack

- Next.js
- React
- TypeScript
- Supabase
- Tailwind CSS
- Vercel
- Hacker News API
- arXiv

## Architecture

```text
External Sources
   ├── Hacker News
   └── arXiv
        ↓
Server-Side Fetching
        ↓
Article Normalization
        ↓
Supabase Persistence
        ↓
Next.js Application
        ↓
Interactive Feed / Saved State / Research Views
```

## Daily ingestion

`GET /api/ingest` reuses the Hacker News and arXiv clients to normalize and
store articles independently of visits to the feed. `vercel.json` schedules it
once daily with `0 9 * * *` (09:00 UTC). Vercel schedules production deployments;
on Hobby, execution may occur anywhere within the scheduled hour.

Before deploying, set a random `CRON_SECRET` of at least 16 characters in the
Vercel project's production environment, alongside the existing `SUPABASE_URL`
and `SUPABASE_SERVICE_ROLE_KEY`. Do not use a `NEXT_PUBLIC_` variable for secrets.
Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on cron calls.
For local use, configure these variables in `.env.local` and send the same header.
An unset secret returns 503; missing or incorrect authorization returns 401.
Neither case starts ingestion.

The JSON response contains `status` (`success`, `partial`, or `failed`),
`sources.hackerNews` and `sources.arxiv` (each with `status`, `fetched`, `stored`,
and an `error` on failure), plus `totalFetched` and `totalStored`.
`stored` counts only newly inserted rows, not existing articles. A successful
rerun can therefore report zero stored articles. Stable source-prefixed IDs and
`upsert` with `onConflict: "id", ignoreDuplicates: true` avoid duplicate rows and
leave existing saved/read flags, source summaries, and AI summaries untouched.

Each source fetch has a 15-second request timeout and HTTP error checks. Source
fetches retain their existing 600-second caches; ingestion responses are not
cached. Failures are logged with the source and stage (`fetch` or `store`). The
other source is still processed if one fails, including on database errors.
HTTP 200 with `status: "partial"` means one source completed; HTTP 500 means
neither completed. Logs contain failure details; responses contain safe error
summaries. Vercel does not automatically retry failed cron invocations; inspect
logs and rerun the authenticated endpoint if needed. Repeated invocations are
safe because existing rows are ignored.

No deployment or secret provisioning is performed by adding this configuration.
The existing feed, filter, preview, and read/save interactions remain in place.

Run the isolated ingestion checks with `node --test tests/ingestion.test.mjs`.
They mock external network/storage boundaries and do not alter production data.

References: [Vercel cron setup](https://vercel.com/docs/cron-jobs/quickstart)
and [cron authentication and operations](https://vercel.com/docs/cron-jobs/manage-cron-jobs).
