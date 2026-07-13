// .weather — Get weather info
module.exports = {
  name: "weather",
  aliases: ["meteo", "tan"],
  category: "tools",
  description: "Get current weather for a city",
  usage: ".weather <city>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { fetchJson } = require("../../lib/fetcher");

    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}weather <city>\nExample: ${config.PREFIX}weather Port-au-Prince`));

    const apiKey = config.OPENWEATHER_API_KEY;
    if (!apiKey) {
      // Try free weather API
      try {
        const res = await fetchJson(`https://wttr.in/${encodeURIComponent(argsText)}?format=j1`);
        if (!res.ok) throw new Error("Failed");

        const w = res.data.current_condition?.[0];
        const loc = res.data.nearest_area?.[0];

        const resp =
          `╭━━〔 🌤️ *WEATHER* 〕━━⬣\n` +
          `┃ 📍 ${loc?.areaName?.[0]?.value || argsText}, ${loc?.country?.[0]?.value || ""}\n` +
          `┃ 🌡️  Temp: ${w?.temp_C || "N/A"}°C (${w?.temp_F || "N/A"}°F)\n` +
          `┃ 💧 Humidity: ${w?.humidity || "N/A"}%\n` +
          `┃ 🌬️  Wind: ${w?.windspeedKmph || "N/A"} km/h\n` +
          `┃ ☁️  Condition: ${w?.weatherDesc?.[0]?.value || "N/A"}\n` +
          `╰━━━━━━━━━━━━━━━━━━⬣`;

        return reply(sock, m, resp);
      } catch (e) {
        return reply(sock, m, settings.error("Add OPENWEATHER_API_KEY in config.js for weather feature. Get one free at https://openweathermap.org/api"));
      }
    }

    await reply(sock, m, settings.wait("Fetching weather... 🌤️"));

    try {
      const res = await fetchJson(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(argsText)}&appid=${apiKey}&units=metric`
      );

      if (!res.ok || !res.data?.main) return reply(sock, m, settings.error(`City not found: "${argsText}"`));

      const d = res.data;
      const resp =
        `╭━━〔 🌤️ *WEATHER* 〕━━⬣\n` +
        `┃ 📍 ${d.name}, ${d.sys?.country || ""}\n` +
        `┃ 🌡️  Temp: ${d.main.temp}°C (feels ${d.main.feels_like}°C)\n` +
        `┃ 💧 Humidity: ${d.main.humidity}%\n` +
        `┃ 🌬️  Wind: ${d.wind?.speed || "N/A"} m/s\n` +
        `┃ ☁️  ${d.weather?.[0]?.description || "N/A"}\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`;

      await reply(sock, m, resp);
    } catch (e) {
      await reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
