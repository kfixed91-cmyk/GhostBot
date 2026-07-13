// .time — Check time in a location
module.exports = {
  name: "time",
  aliases: ["date", "clock"],
  category: "tools",
  description: "Check current time in a city/country",
  usage: ".time <city>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const moment = require("moment-timezone");

    if (!argsText) {
      // Show current bot time
      const now = moment().tz(config.TIMEZONE);
      return reply(sock, m,
        `╭━━〔 🕐 *BOT TIME* 〕━━⬣\n` +
        `┃ 📅 ${now.format("dddd, DD MMMM YYYY")}\n` +
        `┃ ⏰ ${now.format("HH:mm:ss")}\n` +
        `┃ 🌍 ${config.TIMEZONE}\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`
      );
    }

    // Try to find timezone by city name
    const tzNames = moment.tz.names();
    const search = argsText.toLowerCase();
    const match = tzNames.find((tz) => tz.toLowerCase().includes(search));

    if (!match) {
      return reply(sock, m, settings.error(`Timezone not found for "${argsText}". Try a major city like "New York", "London", "Tokyo", etc.`));
    }

    const now = moment().tz(match);
    await reply(sock, m,
      `╭━━〔 🕐 *WORLD TIME* 〕━━⬣\n` +
      `┃ 📍 ${match}\n` +
      `┃ 📅 ${now.format("dddd, DD MMMM YYYY")}\n` +
      `┃ ⏰ ${now.format("HH:mm:ss")}\n` +
      `╰━━━━━━━━━━━━━━━━━━⬣`
    );
  },
};
