// ╔══════════════════════════════════════════════════════════════════════════╗
// ║                                                                          ║
// ║         👻  GhostBot  👻                                                 ║
// ║         Premium WhatsApp Multi-Device Bot + WEB DASHBOARD                 ║
// ║         Owner: King Fixed                                                ║
// ║         Version: 7.0.0                                                   ║
// ║                                                                          ║
// ╚══════════════════════════════════════════════════════════════════════════╝

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const moment = require("moment-timezone");
const path = require("path");
const fs = require("fs-extra");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const QRCode = require("qrcode");

const config = require("./config");
const { messageHandler } = require("./src/handler/message");
const { ensureDB, readDB, getBotSetting } = require("./src/lib/database");
const { loadCommands, getAllCommands } = require("./src/handler/commandHandler");

// ═══════════════════════════════════════════════════════════════
// LOAD PERSISTED SETTINGS (e.g. mode changed via .mode command)
// ═══════════════════════════════════════════════════════════════

ensureDB();
const savedMode = getBotSetting("botMode");
if (savedMode) config.MODE = savedMode;

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATE (shared with dashboard)
// ═══════════════════════════════════════════════════════════════

global.__BOT_START_TIME = Date.now();
global.__BOT_STATE = {
  connection: "close",   // start offline — user must enter their number
  qr: null,
  pairingCode: null,
  phoneNumber: null,
  userJid: null,
  userName: null,
  logs: [],
  stats: {
    messagesProcessed: 0,
    commandsExecuted: 0,
    errors: 0,
    startTime: Date.now(),
  },
};

function addLog(level, msg) {
  const entry = { time: new Date().toISOString(), level, msg };
  global.__BOT_STATE.logs.unshift(entry);
  if (global.__BOT_STATE.logs.length > 200) global.__BOT_STATE.logs.pop();
  if (global.__io) global.__io.emit("log", entry);
}

// Override console.log to capture logs for the dashboard
const origLog = console.log;
const origError = console.error;
console.log = (...args) => {
  origLog(...args);
  addLog("info", args.join(" "));
};
console.error = (...args) => {
  origError(...args);
  addLog("error", args.join(" "));
};

// ═══════════════════════════════════════════════════════════════
// WEB SERVER SETUP
// ═══════════════════════════════════════════════════════════════

const app = express();
const server = http.createServer(app);
const io = new Server(server);
global.__io = io;

const PORT = process.env.PORT || 3000;

// Serve static files from web directory
app.use(express.static(path.join(__dirname, "web")));
app.use(express.json());

// API: Get bot state
app.get("/api/state", (req, res) => {
  res.json({
    ...global.__BOT_STATE,
    config: {
      BOT_NAME: config.BOT_NAME,
      OWNER_NAME: config.OWNER_NAME,
      PREFIX: config.PREFIX,
      MODE: config.MODE,
      TIMEZONE: config.TIMEZONE,
    },
    uptime: Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
    totalCommands: getAllCommands().length,
  });
});

// API: Restart bot connection
app.post("/api/restart", (req, res) => {
  res.json({ ok: true, msg: "Restarting..." });
  setTimeout(() => process.exit(1), 1000);
});

// API: Request pairing code (clears session and restarts in pairing mode)
app.post("/api/pairing", (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.json({ ok: false, msg: "Missing phone number" });

  global.__MANUAL_DISCONNECT = true;

  if (global.__sock) {
    try { global.__sock.end(); } catch (e) {}
  }

  try {
    fs.removeSync(config.SESSION_DIR);
    fs.ensureDirSync(config.SESSION_DIR);
  } catch (e) {}

  global.__BOT_STATE.phoneNumber = phoneNumber;
  global.__BOT_STATE.pairingCode = null;
  global.__BOT_STATE.qr = null;
  global.__BOT_STATE.connection = "connecting";

  process.env.PAIRING_MODE = "true";
  process.env.PAIRING_NUMBER = phoneNumber;

  res.json({ ok: true, msg: "Pairing code requested. Generating..." });

  setTimeout(() => {
    global.__MANUAL_DISCONNECT = false;
    // Ensure old socket is fully cleaned up before starting new one
    if (global.__sock) { try { global.__sock.end(); } catch(e) {} global.__sock = null; }
    startBot();
  }, 2000);
});

// API: Logout and clear session
app.post("/api/logout", (req, res) => {
  global.__MANUAL_DISCONNECT = true;

  if (global.__sock) {
    try { global.__sock.end(); } catch (e) {}
  }

  try {
    fs.removeSync(config.SESSION_DIR);
    fs.ensureDirSync(config.SESSION_DIR);
  } catch (e) {}

  global.__BOT_STATE.connection = "close";
  global.__BOT_STATE.qr = null;
  global.__BOT_STATE.pairingCode = null;
  global.__BOT_STATE.userJid = null;
  global.__BOT_STATE.userName = null;

  io.emit("connectionState", { state: "close" });
  res.json({ ok: true, msg: "Successfully logged out!" });

  setTimeout(() => {
    global.__MANUAL_DISCONNECT = false;
    if (global.__sock) { try { global.__sock.end(); } catch(e) {} global.__sock = null; }
    startBot();
  }, 2000);
});

// API: Get command list
app.get("/api/commands", (req, res) => {
  const all = getAllCommands();
  const cats = {};
  for (const cmd of all) {
    if (!cats[cmd.category]) cats[cmd.category] = [];
    cats[cmd.category].push({
      name: cmd.name,
      aliases: cmd.aliases,
      description: cmd.description,
    });
  }
  res.json({ total: all.length, categories: cats });
});

// API: Get all groups the bot is in
app.get("/api/groups", async (req, res) => {
  if (global.__BOT_STATE.connection !== "open" || !global.__sock) {
    return res.json({ ok: false, msg: "Bot not connected to WhatsApp yet", groups: [] });
  }
  try {
    const sock = global.__sock;
    const groups = await sock.groupFetchAllParticipating();
    const { getGroupSettings } = require("./src/lib/database");
    const groupList = Object.values(groups).map((g) => {
      const settings = getGroupSettings(g.id);
      return {
        id: g.id,
        subject: g.subject,
        size: g.participants ? g.participants.length : 0,
        botEnabled: settings.botEnabled !== false,
        autoReact: settings.autoReact === true,
      };
    });
    res.json({ ok: true, groups: groupList });
  } catch (e) {
    res.json({ ok: false, error: e.message, groups: [] });
  }
});

// API: Toggle group settings (botEnabled or autoReact)
app.post("/api/groups/toggle", (req, res) => {
  const { id, setting } = req.body;
  if (!id || !setting) return res.json({ ok: false, msg: "Missing parameters" });

  const { getGroupSettings, saveGroupSettings } = require("./src/lib/database");
  const settings = getGroupSettings(id);
  const newVal = !settings[setting];
  saveGroupSettings(id, { [setting]: newVal });
  res.json({ ok: true, newVal });
});

// WebSocket: Send full state on client connection
io.on("connection", (socket) => {
  socket.emit("state", {
    ...global.__BOT_STATE,
    uptime: Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
    totalCommands: getAllCommands().length,
    config: {
      BOT_NAME: config.BOT_NAME,
      OWNER_NAME: config.OWNER_NAME,
      PREFIX: config.PREFIX,
      MODE: config.MODE,
    },
  });

  socket.on("requestState", () => {
    socket.emit("state", {
      ...global.__BOT_STATE,
      uptime: Math.floor((Date.now() - global.__BOT_START_TIME) / 1000),
      totalCommands: getAllCommands().length,
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// GLOBAL PROCESS EVENT HANDLERS (registered once, outside startBot)
// ═══════════════════════════════════════════════════════════════

process.on("uncaughtException", (e) => {
  addLog("error", `Uncaught: ${e.message}`);
  console.error(e);
});
process.on("unhandledRejection", (r) => {
  addLog("error", `Unhandled rejection: ${r}`);
});
process.on("SIGINT", async () => {
  addLog("info", "Shutting down (SIGINT)...");
  if (global.__sock) {
    try { await global.__sock.end(); } catch (e) {}
  }
  process.exit(0);
});
process.on("SIGTERM", async () => {
  addLog("info", "Shutting down (SIGTERM)...");
  if (global.__sock) {
    try { await global.__sock.end(); } catch (e) {}
  }
  process.exit(0);
});

// ═══════════════════════════════════════════════════════════════
// BOT SETUP
// ═══════════════════════════════════════════════════════════════

async function startBot() {
  try {
    ensureDB();
    fs.ensureDirSync(config.SESSION_DIR);

    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    // Pairing mode ONLY when user explicitly triggers it via /api/pairing
    // Never auto-pair with OWNER_NUMBER — this is a public bot
    const usePairing = process.env.PAIRING_MODE === "true";
    const phoneNumber = process.env.PAIRING_NUMBER || null; // only from user input, no fallback

    addLog("info", `Starting GhostBot v7.0...`);
    addLog("info", `Session dir: ${config.SESSION_DIR}`);
    addLog("info", `Auth mode: ${usePairing && phoneNumber ? "Pairing Code" : "QR Code"}`);

    // Cleanup any existing socket first to avoid event listener leaks
    if (global.__sock && global.__sock !== sock) {
      try { global.__sock.end(); } catch (e) {}
    }

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: !usePairing,
      browser: ["Chrome (Linux)", "", ""],
      logger: pino({ level: "silent" }),
      defaultQueryTimeoutMs: undefined,
      connectTimeoutMs: undefined,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: true,
      markOnlineOnConnect: config.ALWAYS_ONLINE,
      syncFullHistory: false,
    });

    global.__sock = sock;

    // Normalize phone number: digits only, no + or spaces
    const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, "") : null;

    sock.ev.on("creds.update", saveCreds);

    // Track whether we already requested a pairing code this session
    let pairingRequested = false;

    // ── Connection Updates ──────────────────────────────────
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        if (usePairing && cleanPhone && !pairingRequested) {
          // ── Pairing Code path ─────────────────────────────
          // Wait for socket to be fully ready then request pairing code.
          // requestPairingCode must be called AFTER WS connection is established.
          pairingRequested = true;
          addLog("info", `Requesting pairing code for +${cleanPhone}`);
          try {
            // Small delay to ensure WebSocket is fully initialized
            await new Promise(r => setTimeout(r, 1500));
            const code = await sock.requestPairingCode(cleanPhone);
            global.__BOT_STATE.pairingCode = code;
            global.__BOT_STATE.phoneNumber = cleanPhone;
            global.__BOT_STATE.connection = "connecting";
            io.emit("pairingCode", { code, phoneNumber: cleanPhone });
            addLog("success", `Pairing code ready: ${code}`);
            console.log(chalk.green.bold(`\n📱 PAIRING CODE: ${chalk.yellow.bold(code)}\n`));
          } catch (e) {
            addLog("error", `Pairing code error: ${e.message}`);
            global.__BOT_STATE.connection = "close";
            io.emit("pairingError", { msg: e.message });
            // Reset so user can retry without restarting the bot
            pairingRequested = false;
          }
        } else if (!usePairing) {
          // ── QR Code path ─────────────────────────────────
          QRCode.toDataURL(qr, (err, url) => {
            if (!err) {
              global.__BOT_STATE.qr = url;
              global.__BOT_STATE.connection = "qr";
              io.emit("qr", url);
              addLog("info", "QR Code generated — scan with WhatsApp");
            }
          });
        }
      }

      if (connection === "open") {
        global.__BOT_STATE.connection = "open";
        global.__BOT_STATE.qr = null;
        global.__BOT_MPTE.pairingCode = null;
        global.__BOT_STATE.phoneNumber = null; // clear — never keep number in memory
        global.__BOT_STATE.userJid = sock.user?.id;
        global.__BOT_STATE.userName = sock.user?.name;
        // Clear pairing env vars so a restart doesn't re-request a code
        delete process.env.PAIRING_MODE;
        delete process.env.PAIRING_NUMBER;
        io.emit("connectionState", { state: "open", user: sock.user });
        addLog("success", `✅ Bot connected! (${sock.user?.id})`);
        console.log(chalk.green.bold(`\n👻 GhostBot — ONLINE!\n`));
        loadCommands();
      }

      if (connection === "close") {
        global.__BOT_STATE.connection = "close";
        io.emit("connectionState", { state: "close" });
        const code = lastDisconnect?.error?.output?.statusCode;
        addLog("warn", `Connection closed (code: ${code})`);

        if (code === 401) {
          addLog("error", "Session expired (401). Clearing session and restarting...");
          try {
            if (global.__sock) { try { global.__sock.end(); } catch(e) {} }
            fs.removeSync(config.SESSION_DIR);
            fs.ensureDirSync(config.SESSION_DIR);
          } catch(e) {}
          setTimeout(() => startBot(), 3000);
        } else if (!global.__MANUAL_DISCONNECT) {
          addLog("info", "Reconnecting in 5s...");
          setTimeout(() => {
            if (global.__sock) { try { global.__sock.end(); } catch(e) {} }
            startBot();
          }, 5000);
        }
      }

      if (connection === "connecting") {
        global.__BOT_STATE.connection = "connecting";
        io.emit("connectionState", { state: "connecting" });
      }
    });

    // ── Messages ────────────────────────────────────────────
    sock.ev.on("messages.upsert", async ({ messages }) => {
      for (const m of messages) {
        global.__BOT_STATE.stats.messagesProcessed++;
        try {
          await messageHandler(sock, m);
        } catch (e) {
          global.__BOT_STATE.stats.errors++;
          addLog("error", `Message handler error: ${e.message}`);
        }
      }
      io.emit("stats", global.__BOT_STATE.stats);
    });

    // ── Group participant events ─────────────────────────────
    sock.ev.on("group-participants.update", async (update) => {
      const { id, participants, action } = update;
      try {
        const { getGroupSettings } = require("./src/lib/database");
        const groupMeta = await sock.groupMetadata(id);
        const settings = getGroupSettings(id);

        if (action === "add" && settings.welcome) {
          for (const jid of participants) {
            const name = `@${jid.split("@")[0]}`;
            await sock.sendMessage(id, {
              text:
                `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n` +
                `┃ 👋 *WELCOME!*\n` +
                `┃ Welcome to *${groupMeta.subject}*,\n` +
                `┃ ${name} 🎉\n` +
                `╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }

        if (action === "remove" && settings.goodbye) {
          for (const jid of participants) {
            const name = `@${jid.split("@")[0]}`;
            await sock.sendMessage(id, {
              text:
                `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n` +
                `┃ 😢 *GOODBYE*\n` +
                `┃ ${name} has left.\n` +
                `┃ We'll miss you! 💔\n` +
                `╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }
      } catch (e) { /* group events are non-critical */ }
    });

  } catch (e) {
    addLog("error", `Fatal error in startBot: ${e.message}`);
    console.error(e);
    setTimeout(() => process.exit(1), 5000);
  }
}

// ═══════════════════════════════════════════════════════════════
// LAUNCH
// ═══════════════════════════════════════════════════════════════

server.listen(PORT, "0.0.0.0", () => {
  console.log(chalk.magenta.bold(`\n🌐 WEB DASHBOARD: http://localhost:${PORT}`));
  console.log(chalk.magenta.bold(`📡 Session dir: ${config.SESSION_DIR}\n`));
});

startBot();
