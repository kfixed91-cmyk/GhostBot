// .gpt — ChatGPT AI
module.exports = {
  name: "gpt",
  aliases: ["chatgpt", "openai"],
  category: "ai",
  description: "Chat with ChatGPT (OpenAI)",
  usage: ".gpt <question>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}gpt <question>`));

    await reply(sock, m, settings.wait());

    const { ai } = require("../../lib/aiProvider");
    const result = await ai(argsText, "openai");

    if (!result.ok) return reply(sock, m, settings.error(`GPT Error: ${result.error}`));

    const resp = `╭━━〔 🤖 *CHATGPT* 〕━━⬣\n┃ ${result.result.split("\n").join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━⬣`;
    await reply(sock, m, resp);
  },
};
