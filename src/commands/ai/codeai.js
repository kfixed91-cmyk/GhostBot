// .codeai — AI Coding Assistant
module.exports = {
  name: "codeai",
  aliases: ["code", "debug", "program"],
  category: "ai",
  description: "Get AI help with coding questions",
  usage: ".codeai <programming question>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}codeai <question>\nExample: ${config.PREFIX}codeai How to sort an array in JavaScript?`));

    await reply(sock, m, settings.wait("AI coder is working... 💻"));

    const { codeAI } = require("../../lib/aiProvider");
    const result = await codeAI(argsText);

    if (!result.ok) return reply(sock, m, settings.error(`Code AI Error: ${result.error}`));

    const resp = `╭━━〔 💻 *CODE AI* 〕━━⬣\n┃ ${result.result.split("\n").join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━⬣`;
    await reply(sock, m, resp);
  },
};
