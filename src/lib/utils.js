// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — UTILITY FUNCTIONS                        ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const moment = require("moment-timezone");
const config = require("../../config");
const os = require("os");

/**
 * Format a date using the configured timezone
 */
function formatDate(date = new Date(), format = "DD/MM/YYYY HH:mm:ss") {
  return moment(date).tz(config.TIMEZONE).format(format);
}

/**
 * Get current timestamp formatted
 */
function getTimestamp() {
  return moment().tz(config.TIMEZONE).format("HH:mm:ss DD/MM/YYYY");
}

/**
 * Format milliseconds to human-readable duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Get bot uptime
 */
function getUptime(startTime) {
  return formatDuration(Date.now() - startTime);
}

/**
 * Format file size in bytes to human-readable
 */
function formatSize(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Get system information (used by .alive command)
 */
function getSystemInfo() {
  const totalRAM = os.totalmem();
  const freeRAM = os.freemem();
  const usedRAM = totalRAM - freeRAM;
  return {
    platform: os.platform(),
    arch: os.arch(),
    totalRAM: formatSize(totalRAM),
    freeRAM: formatSize(freeRAM),
    usedRAM: formatSize(usedRAM),
    cpuCount: os.cpus().length,
    nodeVersion: process.version,
    hostname: os.hostname(),
  };
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(str) {
  if (!str || typeof str !== "string") return false;
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Pick a random element from an array
 */
function randomPick(arr) {
  if (!arr || !arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Sleep / delay
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract text from a WhatsApp message
 */
function extractText(m) {
  if (!m || !m.message) return "";
  const msg = m.message;
  if (msg.conversation) return msg.conversation;
  if (msg.extendedTextMessage) return msg.extendedTextMessage.text || "";
  if (msg.imageMessage) return msg.imageMessage.caption || "";
  if (msg.videoMessage) return msg.videoMessage.caption || "";
  if (msg.documentMessage) return msg.documentMessage.caption || "";
  if (msg.viewOnceMessage) {
    const inner = msg.viewOnceMessage.message;
    if (!inner) return "";
    const type = Object.keys(inner)[0];
    return inner[type]?.caption || inner[type]?.text || "";
  }
  return "";
}

/**
 * Extract quoted message context
 */
function getQuoted(m) {
  if (!m || !m.message) return null;
  const msg = m.message;
  if (msg.extendedTextMessage?.contextInfo?.quotedMessage) {
    return msg.extendedTextMessage.contextInfo;
  }
  if (msg.imageMessage?.contextInfo?.quotedMessage) {
    return msg.imageMessage.contextInfo;
  }
  if (msg.videoMessage?.contextInfo?.quotedMessage) {
    return msg.videoMessage.contextInfo;
  }
  if (msg.audioMessage?.contextInfo?.quotedMessage) {
    return msg.audioMessage.contextInfo;
  }
  if (msg.documentMessage?.contextInfo?.quotedMessage) {
    return msg.documentMessage.contextInfo;
  }
  return null;
}

/**
 * Get message type
 */
function getMessageType(m) {
  if (!m || !m.message) return "unknown";
  const keys = Object.keys(m.message);
  return keys[0] || "unknown";
}

/**
 * Check if message is from a group
 */
function isGroup(m) {
  return m?.key?.remoteJid?.endsWith("@g.us") || false;
}

/**
 * Check if message is from a private chat
 */
function isPrivate(m) {
  return m?.key?.remoteJid?.endsWith("@s.whatsapp.net") || false;
}

/**
 * Get sender JID
 */
function getSender(m) {
  return m?.key?.participant || m?.key?.remoteJid || "";
}

/**
 * Get chat JID
 */
function getChatId(m) {
  return m?.key?.remoteJid || "";
}

/**
 * Get push name (display name)
 */
function getPushName(m) {
  return m?.pushName || "User";
}

/**
 * Parse arguments from a command text
 */
function parseArgs(text, prefix) {
  if (!text) return { command: "", args: [], argsText: "" };
  const body = text.startsWith(prefix) ? text.slice(prefix.length).trim() : text.trim();
  const parts = body.split(/\s+/);
  const command = parts[0]?.toLowerCase() || "";
  const args = parts.slice(1);
  const argsText = args.join(" ");
  return { command, args, argsText };
}

/**
 * Check if user is owner
 */
function isOwner(sender, ownerNumbers) {
  if (!sender || !ownerNumbers) return false;
  const senderNum = sender.replace("@s.whatsapp.net", "").replace(/\D/g, "");
  return ownerNumbers.some((n) => n.replace(/\D/g, "") === senderNum);
}

/**
 * Truncate text to a max length
 */
function truncate(text, maxLen = 100) {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

module.exports = {
  formatDate,
  getTimestamp,
  formatDuration,
  getUptime,
  formatSize,
  getSystemInfo,
  isValidUrl,
  randomPick,
  sleep,
  extractText,
  getQuoted,
  getMessageType,
  isGroup,
  isPrivate,
  getSender,
  getChatId,
  getPushName,
  parseArgs,
  isOwner,
  truncate,
};
