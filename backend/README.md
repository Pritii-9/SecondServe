# Backend Template

A minimal Node + TypeScript Express backend with MongoDB Atlas support.

## Setup

1. Copy `.env.example` to `.env`.
2. Replace the dummy Atlas URI values with your real credentials.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

## API

- `GET /api/health` — health check
- `GET /api/test` — returns one document from the `tests` collection
- `POST /api/test` — creates a document with `{ message }`
