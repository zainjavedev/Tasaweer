<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Real Estate Photo Pro

AI visual editor focused on real estate photos — clean up rooms, remove clutter, replace objects, and generate on‑brand visuals faster. Built with Next.js and powered by the Gemini API, with optional private cloud storage using Supabase and client‑side encryption.

## Features

- Photo Restoration: fix lighting, noise, and blemishes.
- Object Replace/Remove: declutter and swap items in a scene.
- Text‑to‑Image: generate new visuals from a prompt.
- Camera Upload + My Images library.
- Optional private sync with Supabase (E2EE‑ready).

## Quick Start

Prerequisites: Node.js

1) Install dependencies: `npm install`
2) Configure environment in `.env.local` (see `.env.example`):
   - `GEMINI_API_KEY` (required)
   - `AUTH_USERS` (JSON array of users for simple auth, optional). Example:
     `AUTH_USERS=[{"username":"admin","password":"secret"},{"username":"guest","password":"guestpass"}]`
   - Optional Supabase keys if you want private sync
3) Run the app: `npm run dev`

## Optional: Supabase (Private, E2EE‑ready images)

This project includes scaffolding to store user images privately in Supabase with client‑side encryption, so even server admins cannot view content.

1) Create a project at https://supabase.com
2) In Project Settings → API, copy the project URL and anon key
3) Add to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4) In the Supabase SQL Editor, run `supabase/schema.sql` to:
   - Create a private `images` storage bucket
   - Create `image_objects` and `user_keys` tables
   - Enable RLS so only the owner can access their data

5) Install the client SDK locally:

```
npm install @supabase/supabase-js
```

Where the code lives:
- Supabase client: `lib/supabaseClient.ts`
- Encrypted storage helpers: `services/supabaseImages.ts`
- WebCrypto helpers (client‑side encryption): `utils/crypto.ts`

Notes:
- By default, Camera/My Images can run locally. With Supabase configured, you can encrypt client‑side, upload ciphertext to Storage, and save metadata to Postgres.
- E2EE outline: generate per‑file AES key, encrypt in browser, upload ciphertext to Storage, store wrapped key + encrypted metadata in `image_objects`. Only the user can decrypt.

## Tech Stack

- Next.js App Router
- Tailwind (via CDN for simplicity)
- Google Gemini API for image edit/generation
- Supabase (optional) for private storage

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – build for production
- `npm start` – run the production build

## Testing & Checklist

This project uses Node’s built‑in test runner to verify critical endpoints and image generation.

- Run the checklist with fake AI responses (no external calls):
  - `npm run checklist`
  - Sets `GEMINI_FAKE=1` so image endpoints return a tiny data URL.

- Run tests directly:
  - `npm test`

When running tests without `GEMINI_FAKE=1`, you must set `GEMINI_API_KEY`. If `AUTH_USERS` is unset or empty, APIs allow anonymous access and the login page is bypassed automatically. The endpoint `GET /api/auth/status` reports whether auth is required.

---

Questions or want to tailor the workflow to your brokerage/brand? Open an issue or start a discussion.

## Optional Samples

You can show clickable sample images/prompts on the Photo Editor and Text→Image pages. They are off by default.

- Add images to `public/samples/` (create the folder if needed).
- Edit `lib/samples.ts` and populate:
  - `photoEditingSamples`: array of image paths like `/samples/living-room.jpg`.
  - `textToImageSamples`: array of `{ prompt, preview? }` entries; `preview` is optional.

If these arrays are left empty, the UI hides the sample sections automatically.
