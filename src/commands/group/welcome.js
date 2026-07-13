// .welcome toggle
module.exports = {
  name: "welcome",
  aliases: ["wc", "wel"],
  category: "group",
  description: "Toggle welcome message for new members",
  usage: ".welcome on/off",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { saveGroupSettings } = require("../../lib/database");
    const opt = args[0]?.toLowerCase();
    if (!opt || !["on", "off"].includes(opt)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}welcome on/off`));
    saveGroupSettings(m.key.remoteJid, { welcome: opt === "on" });
    await reply(sock, m, settings.success(`Welcome message is now *${opt === "on" ? "ON 👋" : "OFF 🔓"}*`));
  },
};
