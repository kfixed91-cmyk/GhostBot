// .menu — Main menu
module.exports = {
  name: "menu",
  aliases: ["help", "commands"],
  category: "fun",
  description: "Show main menu with all command categories",
  usage: ".menu",
  async execute({ sock, m, config, pushName, getAllCommands, command }) {
    const { reply } = require("../../lib/sendMessage");
    const { getUptime } = require("../../lib/utils");
    const { isPremium } = require("../../lib/database");
    const { buildMenu } = require("../../lib/menuBuilder");

    const allCmds = getAllCommands();
    const uptime = getUptime(global.__BOT_START_TIME || Date.now());
    const premium = isPremium(m.key.participant || m.key.remoteJid);

    const menu = buildMenu(allCmds, {
      pushName,
      uptime,
      totalCommands: allCmds.length,
      isPremium: premium,
    });

    await reply(sock, m, menu);
  },
};
