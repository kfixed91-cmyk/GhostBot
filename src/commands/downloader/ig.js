// .ig — Instagram downloader
module.exports = {
  name: "ig",
  aliases: ["instagram", "igdl", "insta"],
  category: "downloader",
  description: "Download Instagram photo/video/reel",
  usage: ".ig <instagram_url>",
  async execute({ sock, m, args, config, settings }) {
    const { reply, sendVideo, sendImage } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");
    const { isValidUrl } = require("../../lib/utils");

    const url = args[0];
    if (!url || !isValidUrl(url)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}ig <instagram_url>`));

    await reply(sock, m, settings.wait("Downloading from Instagram... 📸"));

    try {
      const apiRes = await fetchJson(`https://api.agatz.xyz/api/instagram?url=${encodeURIComponent(url)}`);

      if (!apiRes.ok || !apiRes.data?.data?.[0]) {
        return reply(sock, m, settings.error("Download failed. The post may be private or URL may be invalid."));
      }

      for (const media of apiRes.data.data) {
        const buffer = await fetchBuffer(media.url || media.downloadUrl);
        if (!buffer.ok) continue;

        if (media.type === "video" || media.url?.includes(".mp4")) {
          await sendVideo(sock, m.key.remoteJid, buffer.buffer, "📸 Instagram Download");
        } else {
          await sendImage(sock, m.key.remoteJid, buffer.buffer, "📸 Instagram Download");
        }
      }
    } catch (e) {
      return reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
