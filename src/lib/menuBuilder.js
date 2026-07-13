// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — MENU BUILDER                             ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("../../config");
const moment = require("moment-timezone");
const { getUptime } = require("./utils");

/**
 * Build a full menu with categorized commands
 * @param {Array} commands - Array of command metadata objects
 * @param {Object} context - User context (pushName, uptime, etc.)
 * @param {string} category - Optional category filter
 */
function buildMenu(commands, context = {}, category = null) {
  const {
    pushName = "User",
    uptime = "N/A",
    totalCommands = 0,
    isPremium = false,
  } = context;

  const date = moment().tz(config.TIMEZONE).format("dddd, DD MMMM YYYY HH:mm");

  // Group commands by category
  const categories = {};
  for (const cmd of commands) {
    const cat = cmd.category || "other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  }

  // Sort categories
  const categoryOrder = [
    "ai", "downloader", "group", "media",
    "fun", "tools", "owner", "economy", "other",
  ];
  const sortedCategories = Object.keys(categories).sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
  );

  let menu = "";

  if (category && categories[category]) {
    // Single category menu
    menu += buildCategoryHeader(category, pushName);
    menu += buildCategoryBody(categories[category]);
  } else {
    // Full menu
    menu += buildMainHeader(pushName, date, uptime, totalCommands, isPremium);

    for (const cat of sortedCategories) {
      menu += `\n┃\n`;
      menu += `┃  📂 *${cat.toUpperCase()}* (${categories[cat].length})\n`;
      const cmdNames = categories[cat].map((c) => `${config.PREFIX}${c.name}`).join("  ");
      menu += `┃  ${cmdNames}\n`;
    }
  }

  menu += `\n${"═".repeat(38)}\n`;
  menu += `┃ 📌 Prefix: *${config.PREFIX}*  |  Mode: *${config.MODE}*\n`;
  menu += `┃ 👤 Owner: *${config.OWNER_NAME}*\n`;
  menu += `┃ ⏱️  Uptime: *${uptime}*\n`;
  menu += `┃ 📊 Total Commands: *${totalCommands}*\n`;
  menu += `┃ 💎 Premium: ${isPremium ? "*✅ Active*" : "*❌ Free*"}\n`;
  menu += `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\n`;
  menu += `┃ *Powered by ${config.BOT_NAME}*`;

  return menu;
}

function buildMainHeader(pushName, date, uptime, total, premium) {
  return `╔══════════════════════════════════════╗\n` +
    `║     🔥 *${config.BOT_NAME}* 🔥     ║\n` +
    `║     Owner: *${config.OWNER_NAME}*          ║\n` +
    `╚══════════════════════════════════════╝\n` +
    `┃ 👋 Welcome, *${pushName}*\n` +
    `┃ 📅 ${date}\n`;
}

function buildCategoryHeader(category, pushName) {
  const icons = {
    ai: "🤖",
    downloader: "📥",
    group: "👥",
    media: "🎬",
    fun: "🎮",
    tools: "🛠️",
    owner: "👑",
    economy: "💎",
    other: "📋",
  };
  const icon = icons[category] || "📌";
  return `╭━━〔 *${icon} ${category.toUpperCase()} MENU* 〕━━⬣\n` +
    `┃ 👤 User: *${pushName}*\n`;
}

function buildCategoryBody(commands) {
  let body = "";
  for (const cmd of commands) {
    body += `┃ 📎 *${config.PREFIX}${cmd.name}* — ${cmd.description || "No description"}\n`;
  }
  return body;
}

/**
 * Build a simple command usage message
 */
function buildUsage(command) {
  return `╭━━〔 *USAGE* 〕━━⬣\n` +
    `┃ Command: *${config.PREFIX}${command.name}*\n` +
    `┃ Usage: \`\`\`${command.usage || config.PREFIX + command.name}\`\`\`\n` +
    `┃ Description: ${command.description || "No description"}\n` +
    (command.aliases?.length ? `┃ Aliases: ${command.aliases.map((a) => config.PREFIX + a).join(", ")}\n` : "") +
    `╰━━━━━━━━━━━━━━━━━━⬣`;
}

/**
 * Build full allmenu (detailed)
 */
function buildAllMenu(commands, context = {}) {
  const { pushName = "User", uptime = "N/A", totalCommands = 0 } = context;

  const categories = {};
  for (const cmd of commands) {
    const cat = cmd.category || "other";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  }

  const categoryOrder = ["ai", "downloader", "group", "media", "fun", "tools", "owner", "economy", "other"];
  const sortedCats = Object.keys(categories).sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

  let menu = `╔══════════════════════════════════════╗\n`;
  menu += `║     🔥 *${config.BOT_NAME}* 🔥     ║\n`;
  menu += `╚══════════════════════════════════════╝\n`;
  menu += `┃ 👤 *${pushName}*  |  ⏱️ *${uptime}*\n`;
  menu += `┃ 📊 Total: *${totalCommands} commands*\n`;
  menu += `┃ ═══════════════════════════════════ \n`;

  for (const cat of sortedCats) {
    menu += `┃\n┃ 📂 *${cat.toUpperCase()}* (${categories[cat].length})\n`;
    for (const cmd of categories[cat]) {
      menu += `┃   ${config.PREFIX}${cmd.name.padEnd(14)} ${cmd.description || ""}\n`;
    }
  }

  menu += `┃\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;
  return menu;
}

module.exports = {
  buildMenu,
  buildUsage,
  buildAllMenu,
};
