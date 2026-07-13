// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                     GhostBot — DATABASE WRAPPER                       ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const fs = require("fs-extra");
const path = require("path");

// On Render: set DB_DIR=/opt/render/project/src/data/database
// On local:  defaults to ./src/database (relative to project root)
const DB_DIR = process.env.DB_DIR || path.join(__dirname, "..", "database");

// Ensure database directory and files exist
function ensureDB() {
  fs.ensureDirSync(DB_DIR);
  const files = ["users.json", "groups.json", "settings.json", "premium.json", "economy.json"];
  for (const f of files) {
    const fp = path.join(DB_DIR, f);
    if (!fs.existsSync(fp)) {
      fs.writeJsonSync(fp, {}, { spaces: 2 });
    }
  }
}

// Read a database file
function readDB(filename) {
  ensureDB();
  try {
    const fp = path.join(DB_DIR, filename);
    if (!fs.existsSync(fp)) {
      fs.writeJsonSync(fp, {}, { spaces: 2 });
      return {};
    }
    return fs.readJsonSync(fp);
  } catch (e) {
    console.error(`[DB] Error reading ${filename}:`, e.message);
    return {};
  }
}

// Write a database file
function writeDB(filename, data) {
  ensureDB();
  try {
    const fp = path.join(DB_DIR, filename);
    fs.writeJsonSync(fp, data, { spaces: 2 });
    return true;
  } catch (e) {
    console.error(`[DB] Error writing ${filename}:`, e.message);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// USER HELPERS
// ═══════════════════════════════════════════════════════════════

function getUser(jid) {
  const users = readDB("users.json");
  return users[jid] || null;
}

function saveUser(jid, data) {
  const users = readDB("users.json");
  users[jid] = { ...users[jid], ...data };
  return writeDB("users.json", users);
}

function getAllUsers() {
  return readDB("users.json");
}

function userExists(jid) {
  const users = readDB("users.json");
  return !!users[jid];
}

// ═══════════════════════════════════════════════════════════════
// GROUP HELPERS
// ═══════════════════════════════════════════════════════════════

function getGroup(jid) {
  const groups = readDB("groups.json");
  return groups[jid] || null;
}

function saveGroup(jid, data) {
  const groups = readDB("groups.json");
  groups[jid] = { ...groups[jid], ...data };
  return writeDB("groups.json", groups);
}

function getAllGroups() {
  return readDB("groups.json");
}

function groupExists(jid) {
  const groups = readDB("groups.json");
  return !!groups[jid];
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS HELPERS
// ═══════════════════════════════════════════════════════════════

function getGroupSettings(jid) {
  const settings = readDB("settings.json");
  const defaults = {
    welcome: true,
    goodbye: true,
    antiLink: false,
    antiSpam: true,
    antiBadword: false,
    antiDelete: false,
    antiBot: false,
    muteAll: false,
    mutedUsers: [],
    botEnabled: true,
    autoReact: false,
  };
  return settings[jid] ? { ...defaults, ...settings[jid] } : defaults;
}

function saveGroupSettings(jid, data) {
  const settings = readDB("settings.json");
  settings[jid] = { ...getGroupSettings(jid), ...data };
  return writeDB("settings.json", settings);
}

// Read/write a generic bot-level setting (key prefixed with __ to avoid JID collisions)
function getBotSetting(key, defaultValue = null) {
  const settings = readDB("settings.json");
  return settings[`__${key}`] !== undefined ? settings[`__${key}`] : defaultValue;
}

function setBotSetting(key, value) {
  const settings = readDB("settings.json");
  settings[`__${key}`] = value;
  return writeDB("settings.json", settings);
}

// ═══════════════════════════════════════════════════════════════
// PREMIUM HELPERS
// ═══════════════════════════════════════════════════════════════

function getPremiumUsers() {
  return readDB("premium.json");
}

function isPremium(jid) {
  const premium = readDB("premium.json");
  if (!premium[jid]) return false;
  if (premium[jid].expires === "permanent") return true;
  return Date.now() < premium[jid].expires;
}

function addPremium(jid, duration = "permanent") {
  const premium = readDB("premium.json");
  let expires = "permanent";
  if (typeof duration === "number") {
    expires = Date.now() + duration * 24 * 60 * 60 * 1000;
  }
  premium[jid] = { addedAt: Date.now(), expires, by: "owner" };
  return writeDB("premium.json", premium);
}

function removePremium(jid) {
  const premium = readDB("premium.json");
  delete premium[jid];
  return writeDB("premium.json", premium);
}

// ═══════════════════════════════════════════════════════════════
// ECONOMY HELPERS
// ═══════════════════════════════════════════════════════════════

function getEconomy(jid) {
  const economy = readDB("economy.json");
  if (!economy[jid]) {
    economy[jid] = {
      balance: 1000,
      bank: 0,
      xp: 0,
      level: 1,
      lastDaily: 0,
      lastWork: 0,
      totalEarned: 0,
    };
    writeDB("economy.json", economy);
  }
  return economy[jid];
}

function saveEconomy(jid, data) {
  const economy = readDB("economy.json");
  economy[jid] = { ...getEconomy(jid), ...data };
  return writeDB("economy.json", economy);
}

function addXP(jid, amount = 5) {
  const eco = getEconomy(jid);
  eco.xp += amount;
  const xpNeeded = eco.level * 100;
  if (eco.xp >= xpNeeded) {
    eco.xp -= xpNeeded;
    eco.level += 1;
  }
  return saveEconomy(jid, eco);
}

// ═══════════════════════════════════════════════════════════════
// COOLDOWN HELPERS
// ═══════════════════════════════════════════════════════════════

const cooldowns = new Map();

function isOnCooldown(jid, commandName, cooldownMs = 3000) {
  const key = `${jid}_${commandName}`;
  const now = Date.now();
  if (cooldowns.has(key)) {
    const remaining = cooldowns.get(key) - now;
    if (remaining > 0) return { onCooldown: true, remaining };
  }
  cooldowns.set(key, now + cooldownMs);
  return { onCooldown: false, remaining: 0 };
}

module.exports = {
  ensureDB,
  readDB,
  writeDB,
  getUser,
  saveUser,
  getAllUsers,
  userExists,
  getGroup,
  saveGroup,
  getAllGroups,
  groupExists,
  getGroupSettings,
  saveGroupSettings,
  getBotSetting,
  setBotSetting,
  getPremiumUsers,
  isPremium,
  addPremium,
  removePremium,
  getEconomy,
  saveEconomy,
  addXP,
  isOnCooldown,
};
