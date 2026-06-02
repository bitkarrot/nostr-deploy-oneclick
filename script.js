import { nip19, SimplePool } from "https://esm.sh/nostr-tools@2.10.4";

const loginButton = document.getElementById("loginButton");
const copyButton = document.getElementById("copyButton");
const themeToggle = document.getElementById("themeToggle");
const statusEl = document.getElementById("status");
const copyStatusEl = document.getElementById("copyStatus");
const targetInput = document.getElementById("targetInput");
const usernameInput = document.getElementById("usernameInput");
const relayNameInput = document.getElementById("relayNameInput");
const swarmRepoInput = document.getElementById("swarmRepoInput");
const swarmBranchInput = document.getElementById("swarmBranchInput");
const cmsRepoInput = document.getElementById("cmsRepoInput");
const cmsBranchInput = document.getElementById("cmsBranchInput");
const pubkeyHexInput = document.getElementById("pubkeyHexInput");
const pubkeyNpubInput = document.getElementById("pubkeyNpubInput");
const promptOutput = document.getElementById("promptOutput");

const relays = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://relay.nostr.band",
];

let currentPubkeyHex = "";
let currentPubkeyNpub = "";

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light Mode" : "Dark Mode";
}

function initTheme() {
  const saved = localStorage.getItem("theme");
  applyTheme(saved === "light" ? "light" : "dark");
}

function defaultPrompt() {
  const target =
    targetInput.value === "exedev"
      ? "exe.dev"
      : targetInput.value === "vps"
        ? "General VPS"
        : "Zeabur";
  const commonHeader = `I need you to deploy a Meetup Space stack for me on ${target}.

Use these operator details:
- username: ${usernameInput.value || "<username>"}
- pubkey (hex): ${currentPubkeyHex || "<hex_pubkey>"}
- pubkey (npub): ${currentPubkeyNpub || "<npub>"}

Deployment details:
- relay name: ${relayNameInput.value || "MyRelay"}
- target platform: ${target}

Use these exact source repositories and branches (do not search alternatives):
- swarm repo: ${swarmRepoInput.value || "https://github.com/hivetalk/swarm"}
- swarm branch: ${swarmBranchInput.value || "zeabur-dashboard"}
- cms repo: ${cmsRepoInput.value || "https://github.com/bitkarrot/nostr-cms"}
- cms branch: ${cmsBranchInput.value || "main"}`;

  if (target === "exe.dev") {
    return `${commonHeader}

Follow these rules exactly:
1) Do NOT use Docker.
2) Use exact repos/branches above. Do not search alternatives.
3) Working directory must be: /home/exedev/meetup-space
4) IMPORTANT: make exe.dev port public BEFORE external testing, otherwise you will loop on failed health checks.

Execution plan:
A) Prereqs: install go, node, nginx.
B) First run exe.dev port sharing:
   - ssh exe.dev share port $(hostname) 80
   - ssh exe.dev share set-public $(hostname)
   - Use DOMAIN=https://$(hostname).exe.xyz
   - If exe.dev requires interactive SSH registration/login, STOP and ask user to complete it first.
C) Clone and build swarm:
   - git clone -b ${swarmBranchInput.value || "zeabur-dashboard"} ${swarmRepoInput.value || "https://github.com/hivetalk/swarm"}
   - go build
D) Configure swarm with Badger and persistent paths (db/public/blossom).
E) Create nostr.json owned by relay in swarm public well-known path.
F) Clone/build CMS from exact repo/branch above and wire env to DOMAIN.
G) Configure nginx with single-domain routing:
   - / => CMS static dist
   - /api/* => swarm
   - websocket upgrades => swarm
   - /.well-known/nostr.json => proxy to swarm /public/.well-known/nostr.json
     (critical nuance: swarm serves nostr.json under /public/.well-known/)
H) Create systemd service for swarm and enable/start it.

Hard requirements:
- Set RELAY_PUBKEY to my hex pubkey above.
- Keep nostr.json ACL on swarm.
- Use nostr-cms as admin UI.
- Do not mark task complete until all verification checks pass.

Required verification gates (must all pass):
1) GET / returns CMS (200)
2) /.well-known/nostr.json returns valid JSON with names object
3) NIP-11 response works via Accept: application/nostr+json
4) WSS connection works externally on generated domain

When done, return:
- final public URL
- exact files created/edited (.env, nginx conf, systemd unit)
- outputs of all verification gates`;
  }

  if (target === "Zeabur") {
    return `${commonHeader}

Follow these rules exactly:
1) Use exact repos/branches above. Do not search alternatives.
2) Deploy both services in one Zeabur project.
3) Use Zeabur auto-generated domain for first successful verification.
4) Do not mark success until all verification gates pass.

Execution plan:
A) Clone/import swarm from exact repo + branch.
B) Clone/import nostr-cms from exact repo + branch.
C) Configure swarm runtime with Badger storage and persistent volumes.
D) Configure routing so one domain handles:
   - / => nostr-cms
   - /api/* => swarm
   - websocket upgrades => swarm
   - /.well-known/nostr.json => swarm
E) Ensure RELAY_PUBKEY uses my hex pubkey above.
F) Ensure nostr.json ACL remains relay-owned on swarm.
G) Ensure CMS admin uses relay-served nostr.json for auth/roles.

Hard requirements:
- persistent storage must be mounted for swarm at minimum:
  - /app/db
  - /app/public
  - /app/blossom
- if Zeabur requires explicit public routing/port exposure, configure it before running external verification.
- do not switch away from Badger unless user explicitly requests it.

Required verification gates (must all pass):
1) GET / returns CMS (200)
2) /.well-known/nostr.json returns valid JSON with names object
3) NIP-11 response works via Accept: application/nostr+json
4) WSS connection works on the generated domain

When done, return:
- final public URL
- exact env/config values applied
- volume mounts configured
- outputs of all verification gates`;
  }

  if (target === "General VPS") {
    return `${commonHeader}

Follow these rules exactly:
1) Use exact repos/branches above. Do not search alternatives.
2) Do not use Vercel or other static-only hosting for relay runtime.
3) Choose a standard VPS setup (Ubuntu 22.04+ preferred) with a public domain.
4) Do not mark success until all verification gates pass.

Execution plan:
A) Install prerequisites: git, curl, nginx, Go (1.22+), Node LTS.
B) Create working directory, clone both repos from exact URL/branch values above.
C) Build swarm relay binary.
D) Configure swarm for Badger + persistent storage paths.
E) Create relay-owned nostr.json ACL in swarm public well-known path.
F) Build nostr-cms static output with env values pointing to the same public domain.
G) Configure reverse proxy (nginx or equivalent) for one-domain routing:
   - / => nostr-cms static files
   - /api/* => swarm
   - websocket upgrades => swarm
   - /.well-known/nostr.json => relay-served ACL
H) Configure swarm as a persistent service (systemd or platform equivalent).
I) Obtain/enable TLS and ensure both https:// and wss:// work on the same domain.

Hard requirements:
- Set RELAY_PUBKEY to my hex pubkey above.
- Keep nostr.json ACL on swarm.
- Use nostr-cms as admin UI.
- Keep Badger unless user explicitly requests a different DB engine.
- Persistent storage must exist for relay paths equivalent to:
  - /app/db
  - /app/public
  - /app/blossom

Required verification gates (must all pass):
1) GET / returns CMS (200)
2) /.well-known/nostr.json returns valid JSON with names object
3) NIP-11 response works via Accept: application/nostr+json
4) WSS connection works on the public domain
5) Admin login in CMS works with my Nostr key

When done, return:
- final public domain
- exact files created/edited (.env, proxy config, service unit)
- exact commands used for build/start
- outputs of all verification gates`;
  }

  return `${commonHeader}

Requirements:
1) Deploy swarm relay and nostr-cms together.
2) Use the auto-generated domain from ${target} (do not ask me to provide a domain).
3) One-domain routing on that generated domain:
   - https://<generated-domain>/ => nostr-cms
   - https://<generated-domain>/api/* => swarm
   - wss://<generated-domain>/ => swarm
   - https://<generated-domain>/.well-known/nostr.json => swarm
4) nostr.json ACL must live on swarm.
5) Set RELAY_PUBKEY to my hex pubkey above.
6) Use nostr-cms as the admin panel UI.
7) Use Badger DB for relay storage and configure persistent disk volumes.
8) Mount persistent paths at minimum:
   - /app/db
   - /app/public
   - /app/blossom
9) Generate exact env values, volume settings, routing setup, and startup commands.
10) Do not use Vercel for the relay service.

After deploy, provide a checklist to verify:
- relay websocket reachable
- nostr-cms admin page reachable
- /.well-known/nostr.json served from relay
- owner login works with my Nostr key`;
}

function renderPrompt() {
  promptOutput.value = defaultPrompt();
}

async function fetchProfile(pubkeyHex) {
  const pool = new SimplePool();

  try {
    const event = await Promise.race([
      pool.get(relays, { kinds: [0], authors: [pubkeyHex] }),
      new Promise((resolve) => setTimeout(() => resolve(null), 3500)),
    ]);

    if (!event?.content) return null;

    const profile = JSON.parse(event.content);
    const fromNip05 = typeof profile.nip05 === "string" && profile.nip05.includes("@")
      ? profile.nip05.split("@")[0]
      : "";

    return profile.name || profile.display_name || fromNip05 || null;
  } catch {
    return null;
  } finally {
    try {
      pool.close(relays);
    } catch {
      // ignore
    }
  }
}

async function loginWithNostr() {
  if (!window.nostr || typeof window.nostr.getPublicKey !== "function") {
    statusEl.textContent = "Nostr extension not found. Install Alby or nos2x.";
    return;
  }

  statusEl.textContent = "Requesting Nostr pubkey...";

  try {
    const pubkeyHex = await window.nostr.getPublicKey();
    currentPubkeyHex = pubkeyHex;
    currentPubkeyNpub = nip19.npubEncode(pubkeyHex);

    pubkeyHexInput.value = currentPubkeyHex;
    pubkeyNpubInput.value = currentPubkeyNpub;

    const profileName = await fetchProfile(pubkeyHex);
    if (profileName && !usernameInput.value.trim()) {
      usernameInput.value = profileName;
    }

    statusEl.textContent = "Connected with Nostr.";
    renderPrompt();
  } catch (error) {
    statusEl.textContent = `Login failed: ${error?.message || "unknown error"}`;
  }
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(promptOutput.value);
    copyStatusEl.textContent = "Prompt copied. Paste it into your AI deploy tool.";
  } catch {
    copyStatusEl.textContent = "Copy failed. Select the prompt text and copy manually.";
  }
}

loginButton.addEventListener("click", loginWithNostr);
copyButton.addEventListener("click", copyPrompt);
themeToggle.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme") === "light" ? "light" : "dark";
  applyTheme(current === "dark" ? "light" : "dark");
});

[
  targetInput,
  usernameInput,
  relayNameInput,
  swarmRepoInput,
  swarmBranchInput,
  cmsRepoInput,
  cmsBranchInput,
].forEach((el) => {
  el.addEventListener("input", renderPrompt);
});

initTheme();
renderPrompt();
