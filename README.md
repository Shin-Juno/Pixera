# Pixera

Image resizing web app front-end.

## Run
1. `npm install`
2. `cp .env.example .env` (or create `.env` on Windows manually)
3. `npm run dev`

## API
- default: `http://localhost:4000/v1`
- override with `VITE_API_BASE` in `.env`

## Current Scope
- file upload UI with client-side validation
- resize options (width, height, quality, fit, format)
- backend flow:
  - `POST /uploads/presign`
  - upload to `uploadUrl` via `PUT`
  - `POST /jobs`
  - `GET /jobs/:jobId` polling
