// .demote — Demote admin to member
module.exports = {
  name: "demote",
  aliases: ["unadmin"],
  category: "group",
  description: "Demote an admin to regular member",
  usage: ".demote @user",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    if (args.length < 1) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}demote @user`));

    const target = args[0].replace("@", "") + "@s.whatsapp.net";

    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "demote");
      await reply(sock, m, settings.success(`✅ Admin demoted to member.`));
    } catch (e) {
      await reply(sock, m, settings.error(`Failed to demote. Bot must be admin.`));
    }
  },
};
