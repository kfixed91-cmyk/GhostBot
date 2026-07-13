// .mode — Change bot mode (public/private)
// Mode is saved to database so it survives restarts on Render
module.exports = {
  name: "mode",
  aliases: ["publicmode", "privatemode"],
  category: "owner",
  description: "Change bot mode to public or private",
  usage: ".mode public/private",
  ownerOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { setBotSetting } = require("../../lib/database");

    const mode = args[0]?.toLowerCase();
    if (!mode || !["public", "private"].includes(mode)) {
      return reply(sock, m, settings.error(
        `Usage: ${config.PREFIX}mode public/private\nCurrent mode: *${config.MODE}*`
      ));
    }

    // Persist the mode change so it survives restarts
    setBotSetting("botMode", mode);

    // Update in-memory config immediately (no restart needed)
    config.MODE = mode;

    await reply(sock, m, settings.success(
      `✅ Bot mode changed to: *${mode.toUpperCase()}*\n` +
      `┃ This setting is saved and will persist after restarts.`
    ));
  },
};
