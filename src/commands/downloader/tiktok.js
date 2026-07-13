// .tiktok — TikTok video downloader
module.exports = {
  name: "tiktok",
  aliases: ["tt", "ttdl"],
  category: "downloader",
  description: "Download TikTok video without watermark",
  usage: ".tiktok <tiktok_url>",
  async execute({ sock, m, args, config, settings }) {
    const { reply, sendVideo } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");
    const { isValidUrl } = require("../../lib/utils");

    const url = args[0];
    if (!url || !isValidUrl(url)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}tiktok <tiktok_url>`));

    await reply(sock, m, settings.wait("Downloading TikTok... 🎵"));

    try {
      const apiRes = await fetchJson(`https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`);

      if (!apiRes.ok || !apiRes.data?.data?.no_watermark) {
        return reply(sock, m, settings.error("Download failed. Make sure the URL is from a public TikTok video."));
      }

      const videoUrl = apiRes.data.data.no_watermark;
      const title = apiRes.data.data.title || "TikTok Video";
      const buffer = await fetchBuffer(videoUrl);

      if (!buffer.ok) return reply(sock, m, settings.error("Failed to download video file."));

      await sendVideo(sock, m.key.remoteJid, buffer.buffer, `🎵 *${title}*\n📱 Downloaded from TikTok`);
    } catch (e) {
      return reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
