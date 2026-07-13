// .add — Add a member to group
module.exports = {
  name: "add",
  aliases: ["invite"],
  category: "group",
  description: "Add a member to the group",
  usage: ".add 509xxxxxxx",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    if (args.length < 1) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}add <number>\nExample: ${config.PREFIX}add 50912345678`));

    try {
      const num = args[0].replace(/\D/g, "");
      const jid = num + "@s.whatsapp.net";
      await sock.groupParticipantsUpdate(m.key.remoteJid, [jid], "add");
      await reply(sock, m, settings.success(`✅ User added to group.`));
    } catch (e) {
      await reply(sock, m, settings.error(`Failed to add user: ${e.message}`));
    }
  },
};
