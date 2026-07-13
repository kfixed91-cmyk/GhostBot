// .alive — Bot alive/status check
module.exports = {
  name: "alive",
  aliases: ["status", "bot"],
  category: "fun",
  description: "Check if bot is alive and view status",
  usage: ".alive",
  async execute({ sock, m, config, pushName, startTime, getAllCommands }) {
    const { reply } = require("../../lib/sendMessage");
    const { getUptime, getSystemInfo } = require("../../lib/utils");
    const sys = getSystemInfo();
    const totalCmds = getAllCommands ? getAllCommands().length : 0;

    const text =
      `╔══════════════════════════════╗\n` +
      `║     🔥 *${config.BOT_NAME}* 🔥     ║\n` +
      `╚══════════════════════════════╝\n` +
      `┃ ✅ Bot is *ALIVE & ACTIVE*\n` +
      `┃ 👤 Owner: *${config.OWNER_NAME}*\n` +
      `┃ ⏱️  Uptime: *${getUptime(global.__BOT_START_TIME || Date.now())}*\n` +
      `┃ 💻 Platform: *${sys.platform}*\n` +
      `┃ 🖥️  RAM: *${sys.freeRAM} / ${sys.totalRAM}*\n` +
      `┃ 📊 Commands: *${totalCmds}*\n` +
      `┃ 🔧 Prefix: *${config.PREFIX}*\n` +
      `┃ 🌐 Mode: *${config.MODE}*\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣\n` +
      `┃ *Powered by ${config.BOT_NAME}*`;

    await reply(sock, m, text);
  },
};
