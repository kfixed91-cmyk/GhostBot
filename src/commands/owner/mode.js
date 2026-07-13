// .mode — Change bot mode (public/private)
module.exports = {
  name: "mode",
  aliases: ["publicmode"],
  category: "owner",
  description: "Change bot mode to public or private",
  usage: ".mode public/private",
  ownerOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const fs = require("fs-extra");
    const path = require("path");

    const mode = args[0]?.toLowerCase();
    if (!mode || !["public", "private"].includes(mode)) {
      return reply(sock, m, settings.error(`Usage: ${config.PREFIX}mode public/private\nCurrent mode: *${config.MODE}*`));
    }

    try {
      const configPath = path.join(__dirname, "..", "..", "..", "config.js");
      let content = fs.readFileSync(configPath, "utf8");
      content = content.replace(/MODE:\s*"[^"]*"/, `MODE: "${mode}"`);
      fs.writeFileSync(configPath, content);

      config.MODE = mode;
      await reply(sock, m, settings.success(`Bot mode changed to: *${mode.toUpperCase()}*`));
    } catch (e) {
      await reply(sock, m, settings.error(`Failed to change mode: ${e.message}`));
    }
  },
};
