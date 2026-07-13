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
const { ensureDB } = require("./src/lib/database");
const { loadCommands, getAllCommands } = require("./src/handler/commandHandler");

// ═══════════════════════════════════════════════════════════════
// GLOBAL STATE (shared with dashboard)
// ═══════════════════════════════════════════════════════════════

global.__BOT_START_TIME = Date.now();
global.__BOT_STATE = {
  connection: "connecting", // connecting | open | close | qr
  qr: null,                // QR code data URL (base64 PNG)
  pairingCode: null,       // pairing code if using that method
  phoneNumber: null,       // phone for pairing
  userJid: null,           // bot's own JID
  userName: null,          // bot's WhatsApp name
  logs: [],                // recent log entries [{time, level, msg}]
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

// Override console.log to capture logs
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
    qr: global.__BOT_STATE.qr,
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

// API: Get pairing code (clears session and restarts in pairing mode)
app.post("/api/pairing", (req, res) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) return res.json({ ok: false, msg: "Missing phone number" });
  
  global.__MANUAL_DISCONNECT = true;

  if (global.__sock) {
    try { global.__sock.end(); } catch(e){}
  }

  try {
    fs.removeSync(config.SESSION_DIR);
    fs.ensureDirSync(config.SESSION_DIR);
  } catch(e){}

  global.__BOT_STATE.phoneNumber = phoneNumber;
  global.__BOT_STATE.pairingCode = null;
  global.__BOT_STATE.qr = null;
  global.__BOT_STATE.connection = "connecting";

  process.env.PAIRING_MODE = "true";
  process.env.PAIRING_NUMBER = phoneNumber;

  res.json({ ok: true, msg: "Pairing code requested. Generating..." });

  setTimeout(() => {
    global.__MANUAL_DISCONNECT = false;
    startBot();
  }, 1000);
});

// API: Logout and clear session
app.post("/api/logout", (req, res) => {
  global.__MANUAL_DISCONNECT = true;

  if (global.__sock) {
    try { global.__sock.end(); } catch(e){}
  }

  try {
    fs.removeSync(config.SESSION_DIR);
    fs.ensureDirSync(config.SESSION_DIR);
  } catch(e){}

  global.__BOT_STATE.connection = "close";
  global.__BOT_STATE.qr = null;
  global.__BOT_STATE.pairingCode = null;
  global.__BOT_STATE.userJid = null;
  global.__BOT_STATE.userName = null;

  io.emit("connectionState", { state: "close" });
  res.json({ ok: true, msg: "Successfully logged out!" });

  setTimeout(() => {
    global.__MANUAL_DISCONNECT = false;
    startBot();
  }, 1000);
});

// API: Get command list
app.get("/api/commands", (req, res) => {
  const all = getAllCommands();
  const cats = {};
  for (const cmd of all) {
    if (!cats[cmd.category]) cats[cmd.category] = [];
    cats[cmd.category].push({ name: cmd.name, aliases: cmd.aliases, description: cmd.description });
  }
  res.json({ total: all.length, categories: cats });
});

// API: Get all groups (active/inactive and auto-react settings)
app.get("/api/groups", async (req, res) => {
  if (global.__BOT_STATE.connection !== "open" || !global.__sock) {
    return res.json({ ok: false, msg: "Bot not connected to WhatsApp yet", groups: [] });
  }
  try {
    const sock = global.__sock;
    const groups = await sock.groupFetchAllParticipating();
    const groupList = Object.values(groups).map(g => {
      const settings = require("./src/lib/database").getGroupSettings(g.id);
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
  const { id, setting } = req.body; // setting: 'botEnabled' | 'autoReact'
  if (!id || !setting) return res.json({ ok: false, msg: "Missing parameters" });
  
  const settings = require("./src/lib/database").getGroupSettings(id);
  const currentVal = settings[setting];
  const newVal = !currentVal;
  
  require("./src/lib/database").saveGroupSettings(id, { [setting]: newVal });
  res.json({ ok: true, newVal });
});

// WebSocket: Send state on connection
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
// BOT SETUP
// ═══════════════════════════════════════════════════════════════

async function startBot() {
  try {
    ensureDB();
    fs.ensureDirSync(config.SESSION_DIR);

    const { state, saveCreds } = await useMultiFileAuthState(config.SESSION_DIR);
    const { version } = await fetchLatestBaileysVersion();

    const usePairing = process.env.PAIRING_MODE === "true" || config.USE_PAIRING_CODE;
    const phoneNumber = process.env.PAIRING_NUMBER || config.OWNER_NUMBER[0];

    addLog("info", `Starting GhostBot...`);
    addLog("info", `Mode: ${usePairing ? "Pairing Code" : "QR Code"}`);

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: !usePairing,
      browser: Browsers.ubuntu("Chrome"),
      logger: pino({ level: "silent" }),
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000,
      emitOwnEvents: true,
      markOnlineOnConnect: config.ALWAYS_ONLINE,
      syncFullHistory: false,
    });

    // Save globally so endpoints can access
    global.__sock = sock;

    sock.ev.on("creds.update", saveCreds);

    // ── Handle Pairing Code ──────────────────────────────────
    if (usePairing && phoneNumber && !sock.authState.creds.registered) {
      addLog("info", `Requesting pairing code for +${phoneNumber}`);
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        global.__BOT_STATE.pairingCode = code;
        global.__BOT_STATE.phoneNumber = phoneNumber;
        io.emit("pairingCode", { code, phoneNumber });
        addLog("success", `Pairing code generated: ${code}`);
        console.log(chalk.green.bold(`\n📱 PAIRING CODE: ${chalk.yellow.bold(code)}`));
      } catch (e) {
        addLog("error", `Pairing error: ${e.message}`);
      }
    }

    // ── Connection Updates ──────────────────────────────────
    sock.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        QRCode.toDataURL(qr, (err, url) => {
          if (!err) {
            global.__BOT_STATE.qr = url;
            global.__BOT_STATE.connection = "qr";
            io.emit("qr", url);
            addLog("info", "QR Code generated — scan with WhatsApp");
          }
        });
      }

      if (connection === "open") {
        global.__BOT_STATE.connection = "open";
        global.__BOT_STATE.qr = null;
        global.__BOT_STATE.userJid = sock.user?.id;
        global.__BOT_STATE.userName = sock.user?.name;
        io.emit("connectionState", { state: "open", user: sock.user });
        addLog("success", "✅ Bot connected to WhatsApp!");
        console.log(chalk.green.bold(`\n👻 GhostBot — ONLINE!\n`));
        loadCommands();
      }

      if (connection === "close") {
        global.__BOT_STATE.connection = "close";
        io.emit("connectionState", { state: "close" });
        const code = lastDisconnect?.error?.output?.statusCode;
        addLog("warn", `Connection closed (code: ${code})`);
        if (code !== 401) {
          if (global.__MANUAL_DISCONNECT) {
            addLog("info", "Manual disconnect. Skipping auto-restart.");
          } else {
            addLog("info", "Reconnecting in 5s...");
            setTimeout(() => process.exit(1), 5000);
          }
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
        }
      }
      io.emit("stats", global.__BOT_STATE.stats);
    });

    // ── Group Events ────────────────────────────────────────
    sock.ev.on("group-participants.update", async (update) => {
      const { id, participants, action } = update;
      try {
        const groupMeta = await sock.groupMetadata(id);
        const settings = require("./src/lib/database").getGroupSettings(id);
        if (action === "add" && settings.welcome) {
          for (const jid of participants) {
            const name = `@${jid.split("@")[0]}`;
            await sock.sendMessage(id, {
              text: `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n┃ 👋 *WELCOME!*\n┃ Welcome to *${groupMeta.subject}*,\n┃ ${name} 🎉\n╰━━━━━━━━━━━━━━━━━━⬣`,
              mentions: [jid],
            });
          }
        }
      } catch (e) { /* silent */ }
    });

    // ── Graceful Shutdown ───────────────────────────────────
    const shutdown = async () => {
      addLog("info", "Shutting down...");
      await sock.end();
      process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
    process.on("uncaughtException", (e) => addLog("error", `Uncaught: ${e.message}`));
    process.on("unhandledRejection", (r) => addLog("error", `Unhandled: ${r}`));
  } catch (e) {
    addLog("error", `Fatal: ${e.message}`);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// LAUNCH BOTH SERVERS
// ═══════════════════════════════════════════════════════════════

server.listen(PORT, "0.0.0.0", () => {
  console.log(chalk.magenta.bold(`\n🌐 WEB DASHBOARD: http://localhost:${PORT}`));
  console.log(chalk.magenta.bold(`🌐 (Use your Replit URL or public IP)\n`));
});

startBot();
