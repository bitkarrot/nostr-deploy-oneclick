import { nip19, SimplePool } from "https://esm.sh/nostr-tools@2.10.4";

const loginButton = document.getElementById("loginButton");
const copyButton = document.getElementById("copyButton");
const themeToggle = document.getElementById("themeToggle");
const statusEl = document.getElementById("status");
const copyStatusEl = document.getElementById("copyStatus");
const targetInput = document.getElementById("targetInput");
const usernameInput = document.getElementById("usernameInput");
const relayNameInput = document.getElementById("relayNameInput");
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
  const target = targetInput.value === "exedev" ? "exe.dev" : "Zeabur";

  return `I need you to deploy a Meetup Space stack for me on ${target}.

Use these operator details:
- username: ${usernameInput.value || "<username>"}
- pubkey (hex): ${currentPubkeyHex || "<hex_pubkey>"}
- pubkey (npub): ${currentPubkeyNpub || "<npub>"}

Deployment details:
- relay name: ${relayNameInput.value || "MyRelay"}
- target platform: ${target}

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

[targetInput, usernameInput, relayNameInput].forEach((el) => {
  el.addEventListener("input", renderPrompt);
});

initTheme();
renderPrompt();
