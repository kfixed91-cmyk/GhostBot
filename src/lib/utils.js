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
 * Format file size
 */
function formatSize(bytes) {
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Pick a random element from an array
 */
function randomPick(arr) {
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
  return "";
}

/**
 * Extract quoted message
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
  return null;
}

/**
 * Get message type
 */
function getMessageType(m) {
  if (!m || !m.message) return "unknown";
  const msg = m.message;
  const keys = Object.keys(msg);
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
 * Parse arguments from a command
 */
function parseArgs(text, prefix) {
  if (!text) return [];
  // Remove prefix and command name, get args
  const withoutPrefix = text.startsWith(prefix) ? text.slice(prefix.length) : text;
  const parts = withoutPrefix.trim().split(/ +/);
  parts.shift(); // Remove command name
  return parts;
}

/**
 * Get args as a single string (after command)
 */
function getArgs(text, prefix) {
  if (!text) return "";
  const withoutPrefix = text.startsWith(prefix) ? text.slice(prefix.length) : text;
  const spaceIdx = withoutPrefix.indexOf(" ");
  if (spaceIdx === -1) return "";
  return withoutPrefix.slice(spaceIdx + 1).trim();
}

/**
 * Get system info
 */
function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    totalRAM: formatSize(os.totalmem()),
    freeRAM: formatSize(os.freemem()),
    uptime: formatDuration(os.uptime() * 1000),
    cpus: os.cpus().length,
  };
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate a random ID
 */
function generateId(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Truncate text
 */
function truncate(text, maxLength = 100) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

module.exports = {
  formatDate,
  getTimestamp,
  formatDuration,
  getUptime,
  formatSize,
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
  getArgs,
  getSystemInfo,
  isValidUrl,
  generateId,
  truncate,
};
