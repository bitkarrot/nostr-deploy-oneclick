# Architecture Overview

This repo is a **static onboarding helper UI** for non-technical users.

It does **not** host the relay. It helps users:

1. Login with Nostr (NIP-07)
2. Capture username + pubkey
3. Generate a copy/paste AI deployment prompt
4. Deploy relay stack to Zeabur or exe.dev

## Runtime

- Hosting: static (Vercel)
- Frontend: plain HTML + CSS + JS
- Nostr auth: browser extension (`window.nostr`)
- Nostr profile lookup: `nostr-tools` + public relays

## Flow

```text
User browser
  -> Login with Nostr extension (NIP-07)
  -> Get pubkey (hex + npub)
  -> Optionally fetch kind:0 profile for username
  -> Generate AI deploy prompt
  -> Copy prompt into Zeabur/exe.dev AI assistant
```

## Prompt intent

The generated prompt tells AI to deploy `swarm` + `nostr-cms` together with:

- Single-domain routing
- `nostr.json` ACL on `swarm`
- `nostr-cms` as admin UI
- Persistent storage (Badger + media paths)
- Auto-generated platform domain (Zeabur/exe.dev)

## Important constraint

`swarm` uses Badger by default and needs persistent volumes (`/app/db`, `/app/public`, `/app/blossom`).

So Vercel is appropriate for this helper page only, not for hosting relay services.
