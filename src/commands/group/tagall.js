// .tagall — Tag all group members
module.exports = {
  name: "tagall",
  aliases: ["everyone", "all"],
  category: "group",
  description: "Tag all group members",
  usage: ".tagall <message>",
  adminOnly: true,
  groupOnly: true,
  async execute({ sock, m, argsText, config, settings }) {
    const { reply, sendText } = require("../../lib/sendMessage");

    try {
      const groupMeta = await sock.groupMetadata(m.key.remoteJid);
      const members = groupMeta.participants.map((p) => p.id);

      const message = argsText || "Attention everyone! 📢";

      const text =
        `╭━━〔 📢 *TAG ALL* 〕━━⬣\n` +
        `┃ ${message}\n` +
        `┃ From: @${m.key.participant?.split("@")[0] || m.key.remoteJid.split("@")[0]}\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`;

      await sock.sendMessage(m.key.remoteJid, { text, mentions: members });
    } catch (e) {
      await reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
