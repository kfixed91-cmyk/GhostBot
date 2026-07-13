// .play — Search & play music
module.exports = {
  name: "play",
  aliases: ["song", "music", "audio"],
  category: "downloader",
  description: "Search and download music/audio",
  usage: ".play <song name>",
  async execute({ sock, m, argsText, config, settings }) {
    const { reply, sendAudio } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");

    if (!argsText) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}play <song name>\nExample: ${config.PREFIX}play Shape of You`));

    await reply(sock, m, settings.wait(`Searching: "${argsText}"... 🔍`));

    try {
      // Use a public YouTube search + download API
      const searchRes = await fetchJson(
        `https://api.agatz.xyz/api/ytsearch?message=${encodeURIComponent(argsText)}`
      );

      if (!searchRes.ok || !searchRes.data?.data?.[0]) {
        return reply(sock, m, settings.error("No results found. Try a different search term."));
      }

      const video = searchRes.data.data[0];
      const title = video.title || "Unknown";
      const url = video.url;

      // Download audio
      const dlRes = await fetchJson(
        `https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(url)}`
      );

      if (!dlRes.ok || !dlRes.data?.data?.downloadUrl) {
        return reply(sock, m, settings.error("Download failed. The API may be unavailable."));
      }

      const audioBuffer = await fetchBuffer(dlRes.data.data.downloadUrl);

      if (!audioBuffer.ok) {
        return reply(sock, m, settings.error("Failed to download audio file."));
      }

      const caption = `🎵 *${title}*\n┃ 🎧 Downloaded via ${config.BOT_NAME}`;
      await sendAudio(sock, m.key.remoteJid, audioBuffer.buffer, {
        mimetype: "audio/mp4",
        ptt: false,
        contextInfo: { externalAdReply: { title: title, body: config.BOT_NAME, showAdAttribution: true } },
      });
    } catch (e) {
      return reply(sock, m, settings.error(`Play error: ${e.message}\n\nTry using .ytmp3 <url> for direct URLs.`));
    }
  },
};
