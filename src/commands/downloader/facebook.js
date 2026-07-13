// .facebook — Facebook video downloader
module.exports = {
  name: "facebook",
  aliases: ["fb", "fbdl", "fbvideo"],
  category: "downloader",
  description: "Download Facebook video",
  usage: ".facebook <facebook_url>",
  async execute({ sock, m, args, config, settings }) {
    const { reply, sendVideo } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");
    const { isValidUrl } = require("../../lib/utils");

    const url = args[0];
    if (!url || !isValidUrl(url)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}facebook <facebook_video_url>`));

    await reply(sock, m, settings.wait("Downloading from Facebook... 📘"));

    try {
      const apiRes = await fetchJson(`https://api.agatz.xyz/api/facebook?url=${encodeURIComponent(url)}`);

      if (!apiRes.ok || !apiRes.data?.data?.url) {
        return reply(sock, m, settings.error("Download failed. The video may be private or URL invalid."));
      }

      const videoUrl = apiRes.data.data.url;
      const buffer = await fetchBuffer(videoUrl);

      if (!buffer.ok) return reply(sock, m, settings.error("Failed to download video."));

      await sendVideo(sock, m.key.remoteJid, buffer.buffer, "📘 Facebook Video Download");
    } catch (e) {
      return reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
