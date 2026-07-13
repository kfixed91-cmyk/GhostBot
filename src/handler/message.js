// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                     GHOSTBOT — MESSAGE HANDLER                            ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("../../config");
const { extractText, isGroup, isPrivate, getSender, getChatId, getPushName } = require("../lib/utils");
const { sendReaction } = require("../lib/sendMessage");
const { commandHandler } = require("./commandHandler");
const { groupEventHandler } = require("./groupHandler");
const chalk = require("chalk");

// In-memory database for View Once messages
global.__VIEW_ONCE_DB = global.__VIEW_ONCE_DB || {};

/**
 * Main message handler — routes incoming messages to the appropriate handler
 */
async function messageHandler(sock, m) {
  try {
    // ── Auto-read status updates ────────────────────────────
    if (m.key.remoteJid === "status@broadcast") {
      if (config.AUTO_STATUS_READ) {
        await sock.readMessages([m.key]);
        console.log(chalk.green(`[STATUS] Auto-read status from: ${m.key.participant || "unknown"}`));
      }
      return;
    }

    const chatId = getChatId(m);
    const sender = getSender(m);
    const pushName = getPushName(m);
    const text = extractText(m);
    const groupChat = isGroup(m);
    const privateChat = isPrivate(m);

    // Skip null/empty messages (but still log presence)
    if (!m.message) return;

    const msgType = Object.keys(m.message)[0];

    // Skip protocol messages (encryption, etc.)
    if (msgType === "protocolMessage" || msgType === "senderKeyDistributionMessage") return;

    // ── Auto-read regular messages ──────────────────────────
    if (config.AUTO_READ) {
      await sock.readMessages([m.key]);
    }

    // ── Intercept View Once (vue unique) Messages ───────────
    let isViewOnce = false;
    if (m.message) {
      const type = Object.keys(m.message)[0];
      if (type === "viewOnceMessage" || type === "viewOnceMessageV2" || m.message[type]?.viewOnce === true) {
        isViewOnce = true;
        global.__VIEW_ONCE_DB[m.key.id] = m;
        console.log(chalk.magenta(`[VIEW ONCE] Intercepted & saved View Once message ${m.key.id} from ${sender}`));
      }
    }

    // ── Handle View Once Bypass (.vv / vv reply) ────────────
    const cleanText = text ? text.trim().toLowerCase() : "";
    if (cleanText === "vv" || cleanText === ".vv") {
      const quotedId = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
      if (quotedId && global.__VIEW_ONCE_DB[quotedId]) {
        console.log(chalk.green(`[VIEW ONCE] Recovering View Once message for ${chatId}`));
        const saved = global.__VIEW_ONCE_DB[quotedId];
        const msgCopy = JSON.parse(JSON.stringify(saved.message));
        const type = Object.keys(msgCopy)[0];
        
        if (type === "viewOnceMessage" || type === "viewOnceMessageV2") {
          const actualMsg = msgCopy[type].message;
          const actualType = Object.keys(actualMsg)[0];
          if (actualMsg[actualType]) {
            actualMsg[actualType].viewOnce = false;
          }
          await sock.sendMessage(chatId, actualMsg, { quoted: m });
        } else {
          if (msgCopy[type]) {
            msgCopy[type].viewOnce = false;
          }
          await sock.sendMessage(chatId, msgCopy, { quoted: m });
        }
        return; // Stop processing further for this bypass command
      }
    }

    // ── Group Settings & Checks ──────────────────────────────
    if (groupChat) {
      const settings = require("../lib/database").getGroupSettings(chatId);

      // ── Auto-React ─────────────────────────────────────────
      if (settings.autoReact && text && !text.startsWith(config.PREFIX)) {
        const emojis = ["👻", "⚡", "😈", "🔥", "✨", "👀", "👽", "👾"];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        try {
          await sock.sendMessage(chatId, { react: { text: randomEmoji, key: m.key } });
        } catch (e) { /* ignore */ }
      }

      // ── Bot Enabled check ──────────────────────────────────
      if (!settings.botEnabled) {
        const isOwner = config.OWNER_NUMBER.some(
          (num) => sender.includes(num) || sender.includes(num.replace(/^0+/, ""))
        );
        // If bot is disabled in group, only let the owner execute commands (to allow re-enabling)
        if (!isOwner) {
          return;
        }
      }

      // Check for group events (add, remove, promote, demote, etc.)
      if (msgType === "groupStatusMessage" || msgType === "groupNotificationMessage") {
        await groupEventHandler(sock, m);
        return;
      }
    }

    // ── Command Processing ──────────────────────────────────────
    if (text && text.startsWith(config.PREFIX)) {
      // Check mode
      if (config.MODE === "private") {
        const isOwner = config.OWNER_NUMBER.some(
          (num) => sender.includes(num) || sender.includes(num.replace(/^0+/, ""))
        );
        const isAllowed = config.ALLOWED_USERS.includes(sender);
        if (!isOwner && !isAllowed) {
          // Silently ignore in private mode
          return;
        }
      }

      // Process the command
      await commandHandler(sock, m, { text, sender, chatId, pushName, groupChat, privateChat });
    }
  } catch (e) {
    console.error(chalk.red(`[MSG HANDLER ERROR] ${e.message}`));
  }
}

module.exports = { messageHandler };
