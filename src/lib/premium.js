// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — PREMIUM SYSTEM                           ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const db = require("./database");
const config = require("../../config");
const moment = require("moment-timezone");

/**
 * Check if a user is premium
 */
function checkPremium(jid) {
  return db.isPremium(jid);
}

/**
 * Get premium status details
 */
function getPremiumStatus(jid) {
  const allPremium = db.getPremiumUsers();
  const entry = allPremium[jid];

  if (!entry) {
    return { isPremium: false, expires: null, remaining: null };
  }

  if (entry.expires === "permanent") {
    return { isPremium: true, expires: "Permanent ♾️", remaining: "Unlimited" };
  }

  const now = Date.now();
  if (now >= entry.expires) {
    return { isPremium: false, expires: "Expired", remaining: "Expired" };
  }

  const remaining = entry.expires - now;
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  return {
    isPremium: true,
    expires: moment(entry.expires).tz(config.TIMEZONE).format("DD/MM/YYYY HH:mm"),
    remaining: `${days}d ${hours}h`,
  };
}

/**
 * Add a premium user
 * @param {string} jid - User JID
 * @param {string|number} duration - "permanent" or number of days
 */
function givePremium(jid, duration = "permanent") {
  let dur = duration;
  if (typeof duration === "string" && duration.endsWith("d")) {
    dur = parseInt(duration);
  }
  return db.addPremium(jid, dur);
}

/**
 * Remove premium from a user
 */
function revokePremium(jid) {
  return db.removePremium(jid);
}

/**
 * Get all premium users with expiry info
 */
function listPremiumUsers() {
  const allPremium = db.getPremiumUsers();
  const list = [];

  for (const [jid, entry] of Object.entries(allPremium)) {
    const status = getPremiumStatus(jid);
    if (status.isPremium) {
      list.push({ jid, ...entry, ...status });
    }
  }

  return list;
}

/**
 * Clean expired premiums
 */
function cleanExpired() {
  const allPremium = db.getPremiumUsers();
  const now = Date.now();
  let cleaned = 0;

  for (const [jid, entry] of Object.entries(allPremium)) {
    if (entry.expires !== "permanent" && now >= entry.expires) {
      delete allPremium[jid];
      cleaned++;
    }
  }

  if (cleaned > 0) {
    db.writeDB("premium.json", allPremium);
  }

  return cleaned;
}

module.exports = {
  checkPremium,
  getPremiumStatus,
  givePremium,
  revokePremium,
  listPremiumUsers,
  cleanExpired,
};
