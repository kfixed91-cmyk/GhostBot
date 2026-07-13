// .kick — Kick a member from group
module.exports = {
  name: "kick",
  aliases: ["remove", "out"],
  category: "group",
  description: "Kick/remove a member from group",
  usage: ".kick @user",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    if (args.length < 1) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}kick @user`));

    const target = args[0].replace("@", "") + "@s.whatsapp.net";

    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
      await reply(sock, m, settings.success(`✅ User removed from group.`));
    } catch (e) {
      await reply(sock, m, settings.error(`Failed to remove user. Make sure the bot is admin.`));
    }
  },
};
