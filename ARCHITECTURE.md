# Meetup Space Architecture (CMS + Relay)

This document describes the current setup across:

- `nostr-cms` (frontend CMS/admin)
- `swarm` (relay + API + ACL source)

## High-level topology

```text
                     https://<domain>
                           |
             +-------------+-------------+
             |                           |
      / and /admin/*                 /api/* + wss://
             |                           |
      +------v-------+            +------v----------------+
      | nostr-cms    |            | swarm                 |
      | React/Vite   |            | Go relay + HTTP API   |
      | Admin UI     |            | Nostr websocket relay |
      +------+-------+            +------+-----------------+
             |                           |
             +---- calls /api/admin/* --->|
                                         ACL source:
                                         /.well-known/nostr.json
```

## Routing model (single domain)

- `https://<domain>/` -> `nostr-cms`
- `https://<domain>/admin/*` -> `nostr-cms`
- `https://<domain>/api/*` -> `swarm`
- `wss://<domain>/` -> `swarm`
- `https://<domain>/.well-known/nostr.json` -> `swarm`

## Auth and authorization model

1. User logs into CMS with Nostr key (NIP-07 signer).
2. CMS reads relay-served `nostr.json`.
3. Admin authorization is derived from pubkeys in `nostr.json`.
4. Super-user is the relay owner (`_` entry / `RELAY_PUBKEY`).
5. CMS performs privileged actions through `swarm` admin APIs.

## API migration note

`swarm` currently supports:

- Legacy: `/api/dashboard/*`
- New alias: `/api/admin/*`

This allows migration of admin UI from relay dashboard to CMS without breaking old paths.

## Storage and persistence

`swarm` default runtime uses Badger + local media paths and requires persistent storage:

- `/app/db` (Badger database)
- `/app/public` (`nostr.json` and public artifacts)
- `/app/blossom` (media/blob data)

## Setup tooling

In `swarm`:

- `setup/install-meetup-space.sh`
  - `--mode manual` (print steps)
  - `--mode prompt` (interactive)
  - `--mode agent` (non-interactive)
- `setup/meetup-space-init.sh` (legacy wrapper to prompt mode)
- `setup/nginx-meetup-space.conf` (reverse-proxy template)
