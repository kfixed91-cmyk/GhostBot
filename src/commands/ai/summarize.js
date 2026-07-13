// .summarize — AI text summarization
module.exports = {
  name: "summarize",
  aliases: ["tldr", "summary", "resume"],
  category: "ai",
  description: "Summarize a text using AI",
  usage: ".summarize <text>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}summarize <text to summarize>`));

    await reply(sock, m, settings.wait("Summarizing... 📝"));

    const { summarizeAI } = require("../../lib/aiProvider");
    const result = await summarizeAI(argsText);

    if (!result.ok) return reply(sock, m, settings.error(`Summarize Error: ${result.error}`));

    const resp = `╭━━〔 📝 *SUMMARY* 〕━━⬣\n┃ ${result.result.split("\n").join("\n┃ ")}\n╰━━━━━━━━━━━━━━━━━━⬣`;
    await reply(sock, m, resp);
  },
};
