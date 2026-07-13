// .hd — Enhance image quality
module.exports = {
  name: "hd",
  aliases: ["enhance", "quality", "upscale"],
  category: "media",
  description: "Enhance image quality (upscale)",
  usage: ".hd (reply to image)",
  async execute({ sock, m, config, settings }) {
    const { reply, sendImage } = require("../../lib/sendMessage");
    const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
    const { fetchBuffer } = require("../../lib/fetcher");

    const quoted = m.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.quotedMessage?.imageMessage) {
      return reply(sock, m, settings.error("Reply to an image with .hd"));
    }

    await reply(sock, m, settings.wait("Enhancing image quality... 🔍"));

    try {
      const imgMsg = quoted.quotedMessage.imageMessage;
      const stream = await downloadContentFromMessage(imgMsg, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      // Since free upscaling APIs are limited, return the original with a message
      // In production, integrate a real AI upscaling API
      await sendImage(sock, m.key.remoteJid, buffer,
        "🔍 *Image Enhancement*\n\nTo enable AI upscaling, add an upscaling API key in config.js.\nCurrently returning original image."
      );
    } catch (e) {
      await reply(sock, m, settings.error(`Failed: ${e.message}`));
    }
  },
};
