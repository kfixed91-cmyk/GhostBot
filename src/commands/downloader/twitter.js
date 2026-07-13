// .twitter — Twitter/X video downloader
module.exports = {
  name: "twitter",
  aliases: ["x", "twdl", "xvideo"],
  category: "downloader",
  description: "Download Twitter/X video",
  usage: ".twitter <twitter_url>",
  async execute({ sock, m, args, config, settings }) {
    const { reply, sendVideo } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");
    const { isValidUrl } = require("../../lib/utils");

    const url = args[0];
    if (!url || !isValidUrl(url)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}twitter <twitter_url>`));

    await reply(sock, m, settings.wait("Downloading from Twitter/X... 🐦"));

    try {
      const apiRes = await fetchJson(`https://api.agatz.xyz/api/twitter?url=${encodeURIComponent(url)}`);

      if (!apiRes.ok || !apiRes.data?.data?.url) {
        return reply(sock, m, settings.error("Download failed. Tweet may be private or deleted."));
      }

      const videoUrl = apiRes.data.data.url;
      const buffer = await fetchBuffer(videoUrl);

      if (!buffer.ok) return reply(sock, m, settings.error("Failed to download video."));

      await sendVideo(sock, m.key.remoteJid, buffer.buffer, "🐦 Twitter/X Video Download");
    } catch (e) {
      return reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
