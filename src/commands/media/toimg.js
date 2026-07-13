// .toimg — Convert sticker to image
module.exports = {
  name: "toimg",
  aliases: ["stickertoimg", "simg"],
  category: "media",
  description: "Convert a sticker to an image",
  usage: ".toimg (reply to sticker)",
  async execute({ sock, m, config, settings }) {
    const { reply, sendImage } = require("../../lib/sendMessage");
    const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

    const quoted = m.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.quotedMessage?.stickerMessage) {
      return reply(sock, m, settings.error("Reply to a sticker with .toimg"));
    }

    await reply(sock, m, settings.wait("Converting sticker to image... 🖼️"));

    try {
      const stickerMsg = quoted.quotedMessage.stickerMessage;
      const stream = await downloadContentFromMessage(stickerMsg, "sticker");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Convert webp to png using the library
      // For Baileys 6.x, we send the sticker buffer as image (WhatsApp handles it)
      await sock.sendMessage(m.key.remoteJid, {
        image: buffer,
        caption: "✅ Sticker → Image",
      }, { quoted: m });
    } catch (e) {
      await reply(sock, m, settings.error(`Failed: ${e.message}`));
    }
  },
};
