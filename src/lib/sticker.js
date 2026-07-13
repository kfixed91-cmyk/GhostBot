// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — STICKER MAKER                           ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const path = require("path");
const fs = require("fs-extra");

/**
 * Create a sticker from an image or video buffer.
 * Baileys 6.x handles webp conversion internally when sending as sticker.
 */
async function createSticker(sock, mediaBuffer, options = {}) {
  try {
    const stickerMessage = await sock.sendMessage(options.jid || "status@broadcast", {
      sticker: mediaBuffer,
      packname: options.packname || "GhostBot",
      author: options.author || "King Fixed",
      categories: options.categories || [],
    });
    return { ok: true, message: stickerMessage };
  } catch (e) {
    console.error("[STICKER ERROR]", e.message);
    return { ok: false, error: e.message };
  }
}

/**
 * Download media from a quoted message
 */
async function downloadQuotedMedia(sock, m) {
  try {
    const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

    const quoted = m.message?.extendedTextMessage?.contextInfo;
    if (!quoted) return { ok: false, error: "No quoted message found" };

    const msgType = Object.keys(quoted.quotedMessage || {})[0];
    if (!msgType) return { ok: false, error: "Quoted message has no media" };

    const messageContent = quoted.quotedMessage[msgType];
    const mediaType = msgType.replace("Message", "");

    const stream = await downloadContentFromMessage(messageContent, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    return { ok: true, buffer, type: msgType };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/**
 * Buffer to sticker — Baileys 6.x handles conversion internally
 */
async function bufferToSticker(buffer, options = {}) {
  return buffer;
}

/**
 * Extract sticker metadata from args
 */
function parseStickerMetadata(args) {
  const argStr = args.join(" ");
  let packname = "GhostBot";
  let author = "King Fixed";

  if (argStr.includes("|")) {
    const parts = argStr.split("|");
    packname = parts[0].trim() || packname;
    author = parts[1].trim() || author;
  }

  return { packname, author };
}

module.exports = {
  createSticker,
  downloadQuotedMedia,
  bufferToSticker,
  parseStickerMetadata,
};
