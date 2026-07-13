// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                        GhostBot — CONFIG                              ┃
// ┃                         Owner: King Fixed                                  ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

module.exports = {
  // ======================== BOT IDENTITY ========================
  BOT_NAME: process.env.BOT_NAME || "GhostBot",
  OWNER_NAME: process.env.OWNER_NAME || "King Fixed",
  OWNER_NUMBER: (process.env.OWNER_NUMBER || "50955394345").split(",").map(n => n.trim()),
  PREFIX: process.env.PREFIX || ".",

  // ======================== BOT MODE ========================
  // "public" = everyone can use | "private" = owner + allowed users only
  // Runtime changes via .mode command are saved to database/settings.json
  MODE: process.env.BOT_MODE || "public",
  ALLOWED_USERS: [],

  // ======================== AUTO BEHAVIORS ========================
  AUTO_READ: true,
  AUTO_TYPING: false,
  AUTO_RECORDING: false,
  AUTO_STATUS_READ: true,
  AUTO_BIO: false,
  ALWAYS_ONLINE: false,

  // ======================== GROUP DEFAULTS ========================
  WELCOME: true,
  GOODBYE: true,
  ANTI_LINK: false,
  ANTI_SPAM: true,
  ANTI_BADWORD: false,
  ANTI_DELETE: false,
  ANTI_BOT: false,
  ANTI_VIRTEX: true,
  MUTE_DURATION: 300,

  // ======================== COMMAND SETTINGS ========================
  COOLDOWN_ENABLED: true,
  COOLDOWN_DURATION: 3000,
  DISABLED_COMMANDS: [],

  // ======================== API KEYS ========================
  // All keys are read from environment variables — never hardcode them here
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  AI_PROVIDER: process.env.AI_PROVIDER || "gemini",

  YTDL_API: process.env.YTDL_API || "",
  TIKTOK_API: process.env.TIKTOK_API || "",

  REMOVEBG_API_KEY: process.env.REMOVEBG_API_KEY || "",
  OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || "",
  OCR_API_KEY: process.env.OCR_API_KEY || "",

  // ======================== STICKER SETTINGS ========================
  STICKER_PACK: process.env.STICKER_PACK || "GhostBot",
  STICKER_AUTHOR: process.env.STICKER_AUTHOR || "King Fixed",
  STICKER_MAX_VIDEO_DURATION: 10,

  // ======================== TIMEZONE ========================
  TIMEZONE: process.env.TIMEZONE || "America/Port-au-Prince",

  // ======================== LANGUAGE ========================
  LANGUAGE: process.env.LANGUAGE || "en",

  // ======================== REACTIONS ========================
  ENABLE_REACTIONS: true,
  SUCCESS_REACTION: "✅",
  ERROR_REACTION: "❌",
  PROCESSING_REACTION: "⏳",

  // ======================== ECONOMY DEFAULTS ========================
  DAILY_REWARD: 500,
  WORK_MIN: 200,
  WORK_MAX: 800,
  STARTING_BALANCE: 1000,
  CURRENCY_SYMBOL: "💎",

  // ======================== SESSION ========================
  // On Render: set SESSION_DIR=/opt/render/project/src/data/session
  // On local:  defaults to ./session
  SESSION_DIR: process.env.SESSION_DIR || "./session",
  USE_PAIRING_CODE: process.env.USE_PAIRING_CODE !== "false",
};
