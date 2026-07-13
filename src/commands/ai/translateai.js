// .translateai — AI Translation
module.exports = {
  name: "translateai",
  aliases: ["aitranslate", "aitr"],
  category: "ai",
  description: "Translate text using AI (more natural translation)",
  usage: ".translateai <target_lang> <text>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    const parts = argsText.split(" ");
    if (parts.length < 2) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}translateai <language> <text>\nExample: ${config.PREFIX}translateai french Hello, how are you?`));

    const lang = parts[0];
    const text = parts.slice(1).join(" ");

    await reply(sock, m, settings.wait("Translating... 🌐"));

    const { translateAI } = require("../../lib/aiProvider");
    const result = await translateAI(text, lang);

    if (!result.ok) return reply(sock, m, settings.error(`Translate Error: ${result.error}`));

    const resp = `╭━━〔 🌐 *AI TRANSLATION* (to ${lang}) 〕━━⬣\n┃ Original: ${text.slice(0, 80)}\n┃ Translation: ${result.result}\n╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`;
    await reply(sock, m, resp);
  },
};
