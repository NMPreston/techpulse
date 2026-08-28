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
