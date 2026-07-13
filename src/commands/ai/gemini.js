// .gemini — Google Gemini AI
module.exports = {
  name: "gemini",
  aliases: ["bard", "google"],
  category: "ai",
  description: "Chat with Google Gemini AI",
  usage: ".gemini <question>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}gemini <question>`));

    await reply(sock, m, settings.wait());

    const { ai } = require("../../lib/aiProvider");
    const result = await ai(argsText, "gemini");

    if (!result.ok) return reply(sock, m, settings.error(`Gemini Error: ${result.error}`));

    const resp = `╭━━〔 🤖 *GEMINI* 〕━━⬣\n┃ ${result.result.split("\n").join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━⬣`;
    await reply(sock, m, resp);
  },
};
