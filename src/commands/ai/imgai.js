// .imgai — AI Image generation
module.exports = {
  name: "imgai",
  aliases: ["imagine", "dalle", "aiimage"],
  category: "ai",
  description: "Generate an AI image (requires OpenAI key)",
  usage: ".imgai <prompt>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply, sendImage } = require("../../lib/sendMessage");
    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}imgai <image description>`));

    await reply(sock, m, settings.wait("Generating image... 🎨"));

    const { imageAI } = require("../../lib/aiProvider");
    const result = await imageAI(argsText);

    if (result.imageUrl) {
      const { fetchBuffer } = require("../../lib/fetcher");
      const dl = await fetchBuffer(result.imageUrl);
      if (dl.ok) {
        await sendImage(sock, m.key.remoteJid, dl.buffer, result.result);
        return;
      }
    }

    await reply(sock, m,
      `╭━━〔 🎨 *AI IMAGE* 〕━━⬣\n┃ ${result.result}\n╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
