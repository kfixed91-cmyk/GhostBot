// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║         👻  GhostBot  👻                                                 ║
// ║         Premium WhatsApp Multi-Device Bot + WEB DASHBOARD               ║
// ║         Owner: King Fixed                                                ║
// ║         Version: 7.1.0  (Connection Fix)                                ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
  makeCacheableSignalKeyStore,   // ← CRITICAL: prevents "Logging in..." hang
  isJidBroadcast,
} = require("@whiskeysockets/baileys");

const pino    = require("pino");
const chalk   = require("chalk");
const path    = require("path");
const fs      = require("fs-extra");
const express = require("express");
const http    = require("http");
const { Server } = require("socket.io");
const QRCode  = require("qrcode");

const config        = require("./config");
const { messageHandler }            = require("./src/handler/message");
const { ensureDB, getBotSetting }   = require("./src/lib/database");
const { loadCommands, getAllCommands } = require("./src/handler/commandHandler");

// ═══════════════════════════════════════════════════════════════
// LOAD PERSISTED SETTINGS
// ═══════════════════════════════════════════════════════════════

ensureDB();
const savedMode = getBotSetting("botMode");
if (savedMode) config.MODE = savedMode;

// ═══════════════════════════════════════════════════════════════
// SILENT LOGGER — Baileys internal noise → /dev/null
// ═══════════════════════════════════════════════════════════════

const logger = pino({ level: "silent" });

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════

global.__BOT_START_TIME = Date.now();
global.__BOT_STATE = {
  connection: "close",
  qr:          null,
  pairingCode: null,
  phoneNumber: null,
  userJid:     null,
  userName:    null,
  logs:        [],
  stats: {
    messagesProcessed: 0,
    commandsExecuted:  0,
    errors:            0,
    startTime:         Date.now(),
  },
};

// ── Runtime variables ──────────────────────────────────────────
let sock             = null;
global.__sock        = null;

let reconnectAttempts  = 0;
let reconnectTimer     = null;
let isManualDisconnect = false;

// Pairing state — persists across the 515-restart that happens right
// after the code is accepted, but is cleared once connection opens.
let isPairingMode      = false;
let pairingPhoneNumber = null;

// ── Logging helper ─────────────────────────────────────────────
function addLog(level, msg) {
  const entry = { time: new Date().toISOString(), level, msg };
  global.__BOT_STATE.logs.unshift(entry);
  if (global.__BOT_STATE.logs.length > 400) global.__BOT_STATE.logs.pop();
  if (global.__io) global.__io.emit("log", entry);
}

// ═══════════════════════════════════════════════════════════════
// WEB SERVER
// ═══════════════════════════════════════════════════════════════

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: "*" } });
global.__io  = io;

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "web")));
app.use(express.json());

// ── GET /api/state ────────────────────────────────────────────
app.get("/api/state", (req, res) => {
  res.json({
    ...global.__BOT_STATE,
    config: {
      BOT_NAME:   config.BOT_NAME,
      OWNER_NAME: config.OWNER_NAME,
      PREFIX:     config.PREFIX,
      MODE:       config.MODE,
      TIMEZONE:   config.TIMEZONE,
    },
    uptime:        Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
    totalCommands: getAllCommands().length,
  });
});

// ── POST /api/restart ─────────────────────────────────────────
app.post("/api/restart", (req, res) => {
  res.json({ ok: true, msg: "Restarting..." });
  setTimeout(() => process.exit(1), 1000);
});

// ── POST /api/pairing ─────────────────────────────────────────
// User submits their phone number → we clear session + restart Baileys
// in pairing-code mode. No number is persisted anywhere.
app.post("/api/pairing", async (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.json({ ok: false, msg: "Missing phone number" });

  const clean = phoneNumber.replace(/\D/g, "");
  addLog("info", `📱 Pairing requested for +${clean}`);

  // Set pairing flags BEFORE restarting
  isPairingMode      = true;
  pairingPhoneNumber = clean;

  // Clear old UI state
  global.__BOT_STATE.phoneNumber  = clean;
  global.__BOT_STATE.pairingCode  = null;
  global.__BOT_STATE.qr           = null;
  global.__BOT_STATE.connection   = "connecting";
  io.emit("connectionState", { state: "connecting" });

  // Tear down current socket cleanly
  _destroySock();

  // Delete session so Baileys starts fresh (no leftover creds)
  try {
    fs.removeSync(config.SESSION_DIR);
    fs.ensureDirSync(config.SESSION_DIR);
    addLog("info", "Session cleared for fresh pairing");
  } catch (e) {
    addLog("warn", `Session clear warning: ${e.message}`);
  }

  res.json({ ok: true, msg: "Generating pairing code..." });

  // Short delay then fresh start
  await new Promise(r => setTimeout(r, 1500));
  reconnectAttempts = 0;
  startBot();
});

// ── POST /api/logout ──────────────────────────────────────────
app.post("/api/logout", async (req, res) => {
  addLog("info", "🔒 Logout requested");
  isManualDisconnect = true;
  isPairingMode      = false;
  pairingPhoneNumber = null;

  if (sock) {
    try { await sock.logout(); } catch (_) {}
  }
  _destroySock();

  try {
    fs.removeSync(config.SESSION_DIR);
    fs.ensureDirSync(config.SESSION_DIR);
  } catch (_) {}

  Object.assign(global.__BOT_STATE, {
    connection: "close", qr: null, pairingCode: null,
    phoneNumber: null,   userJid: null, userName: null,
  });
  io.emit("connectionState", { state: "close" });
  addLog("info", "✅ Logged out — session cleared");
  res.json({ ok: true, msg: "Successfully logged out!" });

  setTimeout(() => {
    isManualDisconnect = false;
    reconnectAttempts  = 0;
    startBot();
  }, 2000);
});

// ── GET /api/commands ─────────────────────────────────────────
app.get("/api/commands", (req, res) => {
  const all  = getAllCommands();
  const cats = {};
  for (const cmd of all) {
    if (!cats[cmd.category]) cats[cmd.category] = [];
    cats[cmd.category].push({
      name:        cmd.name,
      aliases:     cmd.aliases,
      description: cmd.description,
    });
  }
  res.json({ total: all.length, categories: cats });
});

// ── GET /api/groups ───────────────────────────────────────────
app.get("/api/groups", async (req, res) => {
  if (global.__BOT_STATE.connection !== "open" || !sock) {
    return res.json({ ok: false, msg: "Not connected", groups: [] });
  }
  try {
    const groups  = await sock.groupFetchAllParticipating();
    const { getGroupSettings } = require("./src/lib/database");
    const groupList = Object.values(groups).map(g => {
      const s = getGroupSettings(g.id);
      return {
        id:         g.id,
        subject:    g.subject,
        size:       g.participants?.length || 0,
        botEnabled: s.botEnabled !== false,
        autoReact:  s.autoReact === true,
      };
    });
    res.json({ ok: true, groups: groupList });
  } catch (e) {
    res.json({ ok: false, error: e.message, groups: [] });
  }
});

// ── POST /api/groups/toggle ───────────────────────────────────
app.post("/api/groups/toggle", (req, res) => {
  const { id, setting } = req.body;
  if (!id || !setting) return res.json({ ok: false, msg: "Missing parameters" });
  const { getGroupSettings, saveGroupSettings } = require("./src/lib/database");
  const cur    = getGroupSettings(id);
  const newVal = !cur[setting];
  saveGroupSettings(id, { [setting]: newVal });
  res.json({ ok: true, newVal });
});

// ── Socket.IO ─────────────────────────────────────────────────
io.on("connection", (socket) => {
  addLog("info", "📡 Dashboard client connected");
  socket.emit("state", _buildState());

  socket.on("requestState", () => {
    socket.emit("state", _buildState());
  });
});

function _buildState() {
  return {
    ...global.__BOT_STATE,
    uptime:        Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
    totalCommands: getAllCommands().length,
    config: {
      BOT_NAME:   config.BOT_NAME,
      OWNER_NAME: config.OWNER_NAME,
      PREFIX:     config.PREFIX,
      MODE:       config.MODE,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// PROCESS SIGNALS
// ═══════════════════════════════════════════════════════════════

process.on("uncaughtException",  e => addLog("error", `Uncaught: ${e.message}`));
process.on("unhandledRejection", r => addLog("error", `Unhandled: ${String(r)}`));

process.on("SIGINT",  async () => { _destroySock(); process.exit(0); });
process.on("SIGTERM", async () => { _destroySock(); process.exit(0); });

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function _destroySock() {
  if (sock) {
    try { sock.ev.removeAllListeners(); } catch (_) {}
    try { sock.end();                   } catch (_) {}
    sock            = null;
    global.__sock   = null;
  }
}

// ═══════════════════════════════════════════════════════════════
// BOT CORE
// ═══════════════════════════════════════════════════════════════

async function startBot() {
  // Cancel any pending reconnect timer
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }

  addLog("info", "═".repeat(48));
  addLog("info", `🚀 GhostBot v7.1.0 — attempt #${reconnectAttempts + 1}`);
  addLog("info", `🔑 Mode: ${isPairingMode ? `Pairing (${pairingPhoneNumber})` : "QR Code"}`);

  try {
    ensureDB();
    fs.ensureDirSync(config.SESSION_DIR);

    // ── Auth state ─────────────────────────────────────────────
    // makeCacheableSignalKeyStore is REQUIRED in Baileys 6.7+.
    // Without it, signal keys are not cached and credential saves
    // can race → "Logging in..." hangs forever after QR/pairing.
    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);

    const { version, isLatest } = await fetchLatestBaileysVersion();
    addLog("info", `Baileys ${version.join(".")} ${isLatest ? "✓ latest" : "(update avail)"}`);
    addLog("info", `Session registered: ${state.creds.registered}`);

    // Clean up any stale socket
    _destroySock();

    // ── Create socket ──────────────────────────────────────────
    sock = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        // ← THE FIX: cacheable signal store prevents credential race conditions
        keys: makeCacheableSignalKeyStore(state.keys, logger),
      },
      // Always false — we render QR/code in the dashboard
      printQRInTerminal: false,
      // Stable browser fingerprint that WhatsApp accepts
      browser: ["GhostBot", "Chrome", "120.0.6099.71"],
      logger,
      keepAliveIntervalMs:       10_000,   // send keep-alive every 10s
      emitOwnEvents:             false,    // prevents doubled message events
      markOnlineOnConnect:       false,    // don't auto-mark online
      syncFullHistory:           false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs:          60_000,
      defaultQueryTimeoutMs:     0,        // no timeout on queries (avoids hangs)
      // getMessage is required for decrypting retry messages after connect
      getMessage: async (key) => {
        return { conversation: "" };
      },
    });

    global.__sock = sock;
    addLog("info", "🔌 Socket created — waiting for WhatsApp handshake...");

    // ── Save credentials every time they change ────────────────
    // MUST be passed directly (not wrapped) so Baileys can await it.
    sock.ev.on("creds.update", saveCreds);

    // ── Track pairing code request within this session ─────────
    // Prevents requesting a 2nd code if the qr event fires twice.
    let pairingCodeRequested = false;

    // ── CONNECTION UPDATES ─────────────────────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr, isOnline, isNewLogin, receivedPendingNotifications } = update;

      // ── QR generated → either request pairing code or display QR ──
      if (qr) {
        if (isPairingMode && pairingPhoneNumber && !sock.authState.creds.registered && !pairingCodeRequested) {
          // ── PAIRING CODE PATH ──────────────────────────────────
          // Call requestPairingCode INSIDE the qr event.
          // This is the CORRECT timing — the WS handshake has completed
          // and WhatsApp is waiting for auth. Calling earlier = invalid code.
          pairingCodeRequested = true;
          addLog("info", `📲 Requesting pairing code for +${pairingPhoneNumber}...`);
          try {
            const code = await sock.requestPairingCode(pairingPhoneNumber);
            const formatted = code?.match(/.{1,4}/g)?.join("-") || code;
            global.__BOT_STATE.pairingCode  = code;
            global.__BOT_STATE.phoneNumber  = pairingPhoneNumber;
            global.__BOT_STATE.qr           = null;
            global.__BOT_STATE.connection   = "connecting";
            io.emit("pairingCode", { code, phoneNumber: pairingPhoneNumber });
            addLog("success", `✅ PAIRING CODE: ${formatted}`);
            console.log(chalk.green.bold(`\n📱 PAIRING CODE: ${chalk.yellow.bold(formatted)}\n`));
            console.log(chalk.cyan("→ Open WhatsApp → Linked Devices → Link with phone number\n"));
          } catch (err) {
            addLog("error", `❌ Pairing code error: ${err.message}`);
            io.emit("pairingError", { msg: err.message });
          }

        } else if (!isPairingMode) {
          // ── QR CODE PATH ───────────────────────────────────────
          addLog("info", "📷 QR Code generated — scan with WhatsApp");
          console.log(chalk.cyan.bold("\n📷 Scan the QR code in the dashboard\n"));
          QRCode.toDataURL(qr, (err, url) => {
            if (err) { addLog("error", `QR gen failed: ${err.message}`); return; }
            global.__BOT_STATE.qr           = url;
            global.__BOT_STATE.pairingCode  = null;
            global.__BOT_STATE.connection   = "qr";
            io.emit("qr", url);
          });
        }
      }

      // ── Bot is online (not yet "open" but WS is ready) ────────
      if (isOnline) {
        addLog("info", "🌐 WhatsApp WS connection established");
      }

      // ── New login event — creds are being finalized ────────────
      if (isNewLogin) {
        addLog("success", "🆕 New login — credentials being saved...");
        // saveCreds is called automatically via creds.update event
      }

      // ── Pending notifications flushed ─────────────────────────
      if (receivedPendingNotifications) {
        addLog("info", "📬 Pending notifications received");
      }

      // ── CONNECTED ─────────────────────────────────────────────
      if (connection === "open") {
        reconnectAttempts  = 0;
        // Clear pairing flags — bot is now live
        isPairingMode      = false;
        pairingPhoneNumber = null;
        pairingCodeRequested = false;

        const jid  = sock.user?.id  || null;
        const name = sock.user?.name || null;

        Object.assign(global.__BOT_STATE, {
          connection:  "open",
          qr:          null,
          pairingCode: null,
          phoneNumber: null,   // never store number in memory after connect
          userJid:     jid,
          userName:    name,
        });

        io.emit("connectionState", { state: "open", user: sock.user });
        addLog("success", `✅ CONNECTED! JID: ${jid}`);
        console.log(chalk.green.bold(`\n👻 GhostBot — ONLINE! (${jid})\n`));

        try { loadCommands(); } catch (e) {
          addLog("error", `Command load error: ${e.message}`);
        }
      }

      // ── CONNECTING ────────────────────────────────────────────
      if (connection === "connecting") {
        addLog("info", "🔄 Connecting to WhatsApp servers...");
        global.__BOT_STATE.connection = "connecting";
        io.emit("connectionState", { state: "connecting" });
      }

      // ── CLOSED ────────────────────────────────────────────────
      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const reason     = lastDisconnect?.error?.message || "unknown";
        addLog("warn", `⬇️  Connection closed | code=${statusCode} | ${reason}`);
        global.__BOT_STATE.connection = "close";

        // ── 401: Session invalidated by WhatsApp ───────────────
        if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
          addLog("error", "🚫 Logged out by WhatsApp — session cleared");
          _destroySock();
          _clearSession();
          isPairingMode      = false;
          pairingPhoneNumber = null;
          io.emit("connectionState", { state: "close" });
          reconnectAttempts = 0;
          setTimeout(startBot, 3000);

        // ── 515: WhatsApp asks us to restart after pairing ────
        } else if (statusCode === 515 || statusCode === DisconnectReason.restartRequired) {
          addLog("info", "🔄 WhatsApp restart signal (515) — reconnecting with saved session...");
          // Keep isPairingMode AS IS — the 515 happens right after pairing code
          // is accepted; we do NOT re-request a code on the next startBot call
          // because sock.authState.creds.registered will now be true.
          reconnectAttempts = 0;
          setTimeout(startBot, 2000);

        // ── 408 / 503: Timeout / service unavailable ──────────
        } else if (
          statusCode === DisconnectReason.connectionLost   ||
          statusCode === DisconnectReason.timedOut         ||
          statusCode === 408 || statusCode === 503
        ) {
          addLog("warn", `⏳ Connection lost (${statusCode}) — reconnecting...`);
          reconnectAttempts = 0;
          setTimeout(startBot, 5000);

        // ── Manual disconnect ──────────────────────────────────
        } else if (isManualDisconnect) {
          addLog("info", "✋ Manual disconnect — standby");
          isManualDisconnect = false;
          io.emit("connectionState", { state: "close" });

        // ── Any other error → exponential back-off ─────────────
        } else {
          reconnectAttempts++;
          const waitSec = Math.min(Math.pow(2, reconnectAttempts), 30);
          addLog("info", `⏳ Reconnecting in ${waitSec}s (attempt ${reconnectAttempts})...`);
          io.emit("connectionState", { state: "connecting" });
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            startBot();
          }, waitSec * 1000);
        }
      }
    });

    // ── MESSAGES ───────────────────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return; // skip history syncs
      for (const m of messages) {
        if (!m.message) continue;
        global.__BOT_STATE.stats.messagesProcessed++;
        try {
          await messageHandler(sock, m);
        } catch (e) {
          global.__BOT_STATE.stats.errors++;
          addLog("error", `Handler: ${e.message}`);
        }
      }
      io.emit("stats", global.__BOT_STATE.stats);
    });

    // ── GROUP PARTICIPANT EVENTS ───────────────────────────────
    sock.ev.on("group-participants.update", async ({ id, participants, action }) => {
      try {
        const { getGroupSettings }  = require("./src/lib/database");
        const groupMeta = await sock.groupMetadata(id);
        const settings  = getGroupSettings(id);

        if (action === "add" && settings.welcome) {
          for (const jid of participants) {
            await sock.sendMessage(id, {
              text:
                `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n` +
                `┃ 👋 *WELCOME!*\n` +
                `┃ Welcome to *${groupMeta.subject}*, @${jid.split("@")[0]} 🎉\n` +
                `╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }

        if (action === "remove" && settings.goodbye) {
          for (const jid of participants) {
            await sock.sendMessage(id, {
              text:
                `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n` +
                `┃ 😢 *GOODBYE*\n` +
                `┃ @${jid.split("@")[0]} has left. We'll miss you! 💔\n` +
                `╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }
      } catch (_) { /* non-critical */ }
    });

  } catch (e) {
    addLog("error", `💥 startBot fatal: ${e.message}`);
    console.error(e);

    // Clear corrupted sessions
    if (e.message?.includes("bad-request") ||
        e.message?.includes("conflict")    ||
        e.message?.includes("invalid")     ||
        e.message?.includes("No such file")) {
      addLog("warn", "Session may be corrupted — clearing...");
      _clearSession();
    }

    reconnectAttempts++;
    const wait = Math.min(reconnectAttempts * 5, 30);
    addLog("info", `Retrying in ${wait}s...`);
    reconnectTimer = setTimeout(startBot, wait * 1000);
  }
}

// ── Clear session helper ───────────────────────────────────────
function _clearSession() {
  try {
    fs.removeSync(config.SESSION_DIR);
    fs.ensureDirSync(config.SESSION_DIR);
  } catch (_) {}
}

// ═══════════════════════════════════════════════════════════════
// LAUNCH
// ═══════════════════════════════════════════════════════════════

server.listen(PORT, "0.0.0.0", () => {
  console.log(chalk.magenta.bold(`\n🌐 Dashboard → http://0.0.0.0:${PORT}`));
  console.log(chalk.magenta.bold(`📁 Session  → ${config.SESSION_DIR}`));
  console.log(chalk.magenta.bold(`💾 DB       → ${process.env.DB_DIR || "src/database"}\n`));
  addLog("info", `Dashboard running on port ${PORT}`);
});

startBot();
