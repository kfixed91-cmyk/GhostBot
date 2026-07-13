// .calc — Calculator
module.exports = {
  name: "calc",
  aliases: ["calculate", "math"],
  category: "tools",
  description: "Calculate a mathematical expression",
  usage: ".calc <expression>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");

    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}calc <expression>\nExample: ${config.PREFIX}calc 2 + 2 * 3`));

    try {
      // Sanitize: only allow safe math expressions
      const sanitized = argsText.replace(/[^0-9+\-*/().%^ ]/g, "");
      const result = eval(sanitized); // Safe because we sanitized

      await reply(sock, m,
        `╭━━〔 🧮 *CALCULATOR* 〕━━⬣\n` +
        `┃ Expression: ${argsText}\n` +
        `┃ Result: *${result}*\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`
      );
    } catch (e) {
      await reply(sock, m, settings.error(`Invalid expression. Use only numbers and + - * / ( ) % . ^`));
    }
  },
};
