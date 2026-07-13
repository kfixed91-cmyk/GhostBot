// .mediafire — MediaFire downloader
module.exports = {
  name: "mediafire",
  aliases: ["mf", "mfdl"],
  category: "downloader",
  description: "Download file from MediaFire",
  usage: ".mediafire <mediafire_url>",
  async execute({ sock, m, args, config, settings }) {
    const { reply, sendDocument } = require("../../lib/sendMessage");
    const { fetchJson, fetchBuffer } = require("../../lib/fetcher");
    const { isValidUrl, formatSize } = require("../../lib/utils");

    const url = args[0];
    if (!url || !isValidUrl(url)) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}mediafire <mediafire_url>`));

    await reply(sock, m, settings.wait("Fetching MediaFire file... 📁"));

    try {
      const apiRes = await fetchJson(`https://api.agatz.xyz/api/mediafire?url=${encodeURIComponent(url)}`);

      if (!apiRes.ok || !apiRes.data?.data?.downloadUrl) {
        return reply(sock, m, settings.error("Download failed. The file may have been removed."));
      }

      const file = apiRes.data.data;
      await reply(sock, m,
        `╭━━〔 📁 *MEDIAFIRE* 〕━━⬣\n` +
        `┃ Name: ${file.filename || "Unknown"}\n` +
        `┃ Size: ${file.size || "Unknown"}\n` +
        `┃ Type: ${file.filetype || "Unknown"}\n` +
        `┃ ⏳ Downloading...\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`
      );

      const buffer = await fetchBuffer(file.downloadUrl);
      if (!buffer.ok) return reply(sock, m, settings.error("Failed to download file."));

      await sendDocument(sock, m.key.remoteJid, buffer.buffer,
        file.filename || "file",
        buffer.contentType || "application/octet-stream"
      );

      await reply(sock, m, settings.success("File downloaded successfully!"));
    } catch (e) {
      return reply(sock, m, settings.error(`Error: ${e.message}`));
    }
  },
};
