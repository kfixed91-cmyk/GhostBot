// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                        GhostBot — CONFIG                              ┃
// ┃                         Owner: King Fixed                                  ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

module.exports = {
  // ======================== BOT IDENTITY ========================
  BOT_NAME: "GhostBot",
  OWNER_NAME: "King Fixed",
  OWNER_NUMBER: ["50955394345"], // Add owner WhatsApp numbers with country code (no +, no spaces)
  PREFIX: ".",

  // ======================== BOT MODE ========================
  MODE: "public", // "public" = everyone can use | "private" = owner + allowed users only
  ALLOWED_USERS: [], // JIDs of users allowed in private mode (leave empty to auto-detect from OWNER_NUMBER)

  // ======================== AUTO BEHAVIORS ========================
  AUTO_READ: true,       // Mark messages as read
  AUTO_TYPING: false,    // Show typing indicator before replies
  AUTO_RECORDING: false, // Show recording indicator before replies
  AUTO_STATUS_READ: true, // Auto-read status updates
  AUTO_BIO: false,       // Auto-update bio
  ALWAYS_ONLINE: false,  // Keep the bot always online

  // ======================== GROUP DEFAULTS ========================
  WELCOME: true,         // Welcome new members
  GOODBYE: true,         // Say goodbye to leaving members
  ANTI_LINK: false,      // Delete group invite links
  ANTI_SPAM: true,       // Anti-spam protection
  ANTI_BADWORD: false,   // Filter bad words
  ANTI_DELETE: false,    // Repost deleted messages
  ANTI_BOT: false,       // Kick other bots
  ANTI_VIRTEX: true,     // Anti-crash protection
  MUTE_DURATION: 300,    // Default mute duration in seconds (5 min)

  // ======================== COMMAND SETTINGS ========================
  COOLDOWN_ENABLED: true,
  COOLDOWN_DURATION: 3000, // 3 seconds between commands
  DISABLED_COMMANDS: [],    // Commands to disable globally

  // ======================== API KEYS ========================
  // AI APIs
  OPENAI_API_KEY: "",     // https://platform.openai.com/api-keys
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",     // https://aistudio.google.com/apikey
  AI_PROVIDER: "gemini",  // "openai" | "gemini" | "custom"

  // Downloader APIs (optional — will use public APIs when empty)
  YTDL_API: "",           // Custom YouTube download API
  TIKTOK_API: "",         // Custom TikTok download API

  // Other APIs
  REMOVEBG_API_KEY: "",   // https://remove.bg/api
  OPENWEATHER_API_KEY: "",// https://openweathermap.org/api
  OCR_API_KEY: "",        // https://ocr.space/ocrapi

  // ======================== STICKER SETTINGS ========================
  STICKER_PACK: "GhostBot",
  STICKER_AUTHOR: "King Fixed",
  STICKER_MAX_VIDEO_DURATION: 10, // seconds

  // ======================== TIMEZONE ========================
  TIMEZONE: "America/Port-au-Prince",

  // ======================== LANGUAGE ========================
  LANGUAGE: "en", // "en" | "fr" | "ht"

  // ======================== REACTIONS ========================
  ENABLE_REACTIONS: true, // React to commands with emojis
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
  SESSION_DIR: "./session",
  USE_PAIRING_CODE: true, // true = pairing code | false = QR code

  // ======================== RE-READ THESE WHEN CHANGING ========================
  // After changing config, restart the bot with: node main.js
};
