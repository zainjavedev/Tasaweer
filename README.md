<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Supabase Setup (Private, E2EE-ready images)

This repo includes scaffolding to store user images privately in Supabase with client-side encryption (so even server admins cannot view content).

1) Create a Supabase project at https://supabase.com
2) In Project Settings → API, copy the project URL and anon key
3) Add env vars to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

4) In the Supabase SQL Editor, run the SQL in `supabase/schema.sql` to:
   - Create a private `images` storage bucket
   - Create `image_objects` and `user_keys` tables
   - Enable RLS so only the owner can access their data

5) Install client SDK locally:

```
npm install @supabase/supabase-js
```

6) Auth: enable at least one provider (email OTP, magic link, or OAuth). The app expects an authenticated session to upload.

Where the code lives:
- Supabase client: `lib/supabaseClient.ts`
- Encrypted storage helpers: `services/supabaseImages.ts`
- WebCrypto helpers (client-side encryption): `utils/crypto.ts`

Notes:
- By default, Camera/My Images still use local storage. Once your project is configured, we can wire the UI to encrypt client-side, upload ciphertext to Storage, and save metadata to Postgres using the helpers above.
- E2EE flow outline: generate a per-file AES key, encrypt bytes in the browser, upload ciphertext to Storage, store the wrapped file key and encrypted metadata to `image_objects`. Only the user can unwrap and decrypt.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Optional: Apparel Search API
- To enable internet apparel search on the Try Apparel page, set:
  - `GOOGLE_CSE_ID=...` (Custom Search Engine ID)
  - `GOOGLE_CSE_KEY=...` (API Key)
  in `.env.local`.
  The API route is at `/api/search/apparel`.

### Built‑in Apparel Suggestions
- To show clickable apparel suggestions in Try Apparel, add images under `public/apparels/`.
- Auto‑sequence to `1.jpg`, `2.jpg`, ... with:
  `npm run apparels:normalize`
  This converts all images to JPEG and renames them sequentially.

Optionally, provide labels via `public/apparels/manifest.json`:
```
[
  { "src": "/apparels/1.jpg", "label": "Black Jacket" },
  { "src": "/apparels/2.jpg", "label": "Red Hoodie" }
]
```
The sidebar renders these as small cards; Insert loads it into the Apparel section. Upload still works.
