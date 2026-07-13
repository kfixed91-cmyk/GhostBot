// .ytmp3 — YouTube to MP3
module.exports = {
  name: "ytmp3",
  aliases: ["ytaudio", "yta"],
  category: "downloader",
  description: "Download YouTube video as MP3 audio",
  usage: ".ytmp3 <youtube_url>",
  async execute({ sock, m, args, config, settings }) {
    const { reply, sendAudio } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");
    const { isValidUrl } = require("../../lib/utils");

    const url = args[0];
    if (!url || !isValidUrl(url)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}ytmp3 <youtube_url>\nExample: ${config.PREFIX}ytmp3 https://youtube.com/watch?v=...`));

    await reply(sock, m, settings.wait("Downloading audio... 🎵"));

    try {
      const dlRes = await fetchJson(`https://api.agatz.xyz/api/ytmp3?url=${encodeURIComponent(url)}`);

      if (!dlRes.ok || !dlRes.data?.data?.downloadUrl) {
        return reply(sock, m, settings.error("Download failed. Check the URL or try again later."));
      }

      const buffer = await fetchBuffer(dlRes.data.data.downloadUrl);
      if (!buffer.ok) return reply(sock, m, settings.error("Failed to download file."));

      const title = dlRes.data.data.title || "Audio";
      await sendAudio(sock, m.key.remoteJid, buffer.buffer, {
        mimetype: "audio/mp4",
        ptt: false,
      });

      await reply(sock, m, settings.success(`✅ Downloaded: ${title}`));
    } catch (e) {
      return reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
