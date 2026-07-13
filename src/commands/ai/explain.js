// .explain — AI topic explanation
module.exports = {
  name: "explain",
  aliases: ["whatis", "defineai"],
  category: "ai",
  description: "Get AI to explain a topic",
  usage: ".explain <topic>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}explain <topic>`));

    await reply(sock, m, settings.wait());

    const { explainAI } = require("../../lib/aiProvider");
    const result = await explainAI(argsText);

    if (!result.ok) return reply(sock, m, settings.error(`Explain Error: ${result.error}`));

    const resp = `╭━━〔 📚 *EXPLANATION: ${argsText.slice(0, 30)}* 〕━━⬣\n┃ ${result.result.split("\n").join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;
    await reply(sock, m, resp);
  },
};
