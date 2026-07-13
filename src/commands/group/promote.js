// .promote — Promote member to admin
module.exports = {
  name: "promote",
  aliases: ["admin"],
  category: "group",
  description: "Promote a member to group admin",
  usage: ".promote @user",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    if (args.length < 1) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}promote @user`));

    const target = args[0].replace("@", "") + "@s.whatsapp.net";

    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "promote");
      await reply(sock, m, settings.success(`✅ User promoted to admin.`));
    } catch (e) {
      await reply(sock, m, settings.error(`Failed to promote user. Bot must be admin.`));
    }
  },
};
