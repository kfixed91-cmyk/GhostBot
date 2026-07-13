// .ytmp4 — YouTube to MP4
module.exports = {
  name: "ytmp4",
  aliases: ["ytvideo", "ytv", "youtube"],
  category: "downloader",
  description: "Download YouTube video as MP4",
  usage: ".ytmp4 <youtube_url>",
  async execute({ sock, m, args, config, settings }) {
    const { reply, sendVideo } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");
    const { isValidUrl } = require("../../lib/utils");

    const url = args[0];
    if (!url || !isValidUrl(url)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}ytmp4 <youtube_url>`));

    await reply(sock, m, settings.wait("Downloading video... 🎬"));

    try {
      const dlRes = await fetchJson(`https://api.agatz.xyz/api/ytmp4?url=${encodeURIComponent(url)}`);

      if (!dlRes.ok || !dlRes.data?.data?.downloadUrl) {
        return reply(sock, m, settings.error("Download failed. Check URL or try again."));
      }

      const buffer = await fetchBuffer(dlRes.data.data.downloadUrl);
      if (!buffer.ok) return reply(sock, m, settings.error("Failed to download video."));

      const title = dlRes.data.data.title || "Video";
      await sendVideo(sock, m.key.remoteJid, buffer.buffer, `🎬 *${title}*`);

      await reply(sock, m, settings.success(`✅ Downloaded: ${title}`));
    } catch (e) {
      return reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
