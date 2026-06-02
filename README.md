# Nostr One-Click Deploy Prompt

A single-page website for non-technical users:

1. Login with Nostr (NIP-07 extension)
2. Auto-fill pubkey + username
3. Generate a deployment prompt
4. Copy/paste into an AI deploy assistant

Architecture details: see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Deploy this helper page to Vercel

Vercel hosts this static helper UI only.

The generated prompt is for deploying the relay stack to **Zeabur** or **exe.dev** because `swarm` (Badger DB + media paths) requires persistent storage.

Vercel should **not** be used to host the relay service.

## Deploy helper page to Vercel

### Option A: Import in Vercel UI

- Push this folder as a Git repo
- In Vercel, click **Add New Project**
- Import the repo
- Framework preset: **Other**
- Deploy

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

No build step is required (static site).

## Local run

Use any static server from this folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## Notes

- Requires a browser Nostr extension with NIP-07 support (`window.nostr`).
- Username is resolved from profile metadata (kind `0`) when available; user can edit it manually.
- The generated prompt includes:
  - username
  - pubkey in hex
  - pubkey in npub
  - relay name + domain
  - one-domain deployment requirements
