// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — SETTINGS / STRINGS                       ┃
// ┃              Customize all bot messages, headers, footers                  ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("./config");

// ═══════════════════════════════════════════════════════════════
// MESSAGE STYLES
// ═══════════════════════════════════════════════════════════════

const HEADER = `╭━━〔 ${config.BOT_NAME} 〕━━⬣`;
const FOOTER = `╰━━━━━━━━━━━━━━━━━━⬣`;
const FOOTER_FULL = `╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;

// Success message
function success(text) {
  return `${HEADER}\n┃ ✅ ${text}\n${FOOTER}`;
}

// Error message
function error(text) {
  return `╭━━〔 ${config.BOT_NAME} - ERROR 〕━━⬣\n┃ ❌ ${text}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;
}

// Warning message
function warning(text) {
  return `╭━━〔 ${config.BOT_NAME} - WARNING 〕━━⬣\n┃ ⚠️ ${text}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;
}

// Info message
function info(text) {
  return `╭━━〔 ${config.BOT_NAME} - INFO 〕━━⬣\n┃ ℹ️ ${text}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;
}

// Wait message
function wait(text = "Processing, please wait...") {
  return `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n┃ ⏳ ${text}\n${FOOTER}`;
}

// Admin only restriction
function adminOnly() {
  return error("This command can only be used by group admins.");
}

// Owner only restriction
function ownerOnly() {
  return error("This command can only be used by the bot owner.");
}

// Group only restriction
function groupOnly() {
  return error("This command can only be used in groups.");
}

// Private only restriction
function privateOnly() {
  return error("This command can only be used in private chat.");
}

// Premium only restriction
function premiumOnly() {
  return error("This command is for premium users only. Contact the owner to upgrade.");
}

// Bot name banner
function banner() {
  return `╔══════════════════════════════╗\n║     🔥 ${config.BOT_NAME} 🔥      ║\n║     Owner: ${config.OWNER_NAME}     ║\n╚══════════════════════════════╝`;
}

// Footer line used in menus
function footerLine(extra = "") {
  return `\n${FOOTER_FULL}\n${extra ? `┃ ${extra}\n${FOOTER}` : ""}`;
}

module.exports = {
  HEADER,
  FOOTER,
  FOOTER_FULL,
  success,
  error,
  warning,
  info,
  wait,
  adminOnly,
  ownerOnly,
  groupOnly,
  privateOnly,
  premiumOnly,
  banner,
  footerLine,
};
