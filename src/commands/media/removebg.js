// .removebg — Remove background from image
module.exports = {
  name: "removebg",
  aliases: ["nobg", "rmbg"],
  category: "media",
  description: "Remove background from an image (requires remove.bg API key)",
  usage: ".removebg (reply to image)",
  async execute({ sock, m, config, settings }) {
    const { reply, sendImage } = require("../../lib/sendMessage");
    const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

    if (!config.REMOVEBG_API_KEY) {
      return reply(sock, m, settings.error("This feature requires a remove.bg API key. Add REMOVEBG_API_KEY in config.js.\nGet one at: https://remove.bg/api"));
    }

    const quoted = m.message?.extendedTextMessage?.contextInfo;
    if (!quoted?.quotedMessage?.imageMessage) {
      return reply(sock, m, settings.error("Reply to an image with .removebg"));
    }

    await reply(sock, m, settings.wait("Removing background... 🎨"));

    try {
      const imgMsg = quoted.quotedMessage.imageMessage;
      const stream = await downloadContentFromMessage(imgMsg, "image");
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      const FormData = require("form-data");
      const fetch = require("node-fetch");
      const form = new FormData();
      form.append("image_file", buffer, { filename: "image.png" });
      form.append("size", "auto");

      const res = await fetch("https://api.remove.bg/v1.0/removebg", {
        method: "POST",
        headers: { "X-Api-Key": config.REMOVEBG_API_KEY },
        body: form,
      });

      if (!res.ok) {
        const err = await res.json();
        return reply(sock, m, settings.error(`Remove.bg error: ${err.errors?.[0]?.title || "Unknown error"}`));
      }

      const resultBuffer = await res.buffer();
      await sendImage(sock, m.key.remoteJid, resultBuffer, "✅ Background removed!");
    } catch (e) {
      await reply(sock, m, settings.error(`Failed: ${e.message}`));
    }
  },
};
