// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — STICKER MAKER                           ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs-extra");
const { writeExif } = require("./uploader") || {};

/**
 * Create a sticker from an image or video buffer
 * Uses Baileys' built-in sticker generation
 */
async function createSticker(sock, mediaBuffer, options = {}) {
  try {
    // Baileys can auto-generate webp stickers from images/videos
    // The sock.sendMessage with sticker type handles conversion
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
    const quoted = m.message?.extendedTextMessage?.contextInfo;
    if (!quoted) return { ok: false, error: "No quoted message found" };

    const msgType = Object.keys(quoted.quotedMessage || {})[0];
    if (!msgType) return { ok: false, error: "Quoted message has no media" };

    const messageContent = quoted.quotedMessage[msgType];
    const stream = await downloadContentFromMessage(messageContent, msgType.replace("Message", ""));
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
 * Utility to download content from a message
 */
async function downloadContentFromMessage(messageContent, type) {
  try {
    // Use Baileys downloadContentFromMessage
    const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
    return downloadContentFromMessage(messageContent, type);
  } catch (e) {
    throw new Error(`Download failed: ${e.message}`);
  }
}

/**
 * Buffer to sticker: process image/video to webp sticker
 * This uses a simple approach - for Baileys 6.x, just send as sticker
 */
async function bufferToSticker(buffer, options = {}) {
  // Baileys 6.x handles webp conversion internally when sending as sticker
  return buffer;
}

/**
 * Extract sticker metadata
 */
function parseStickerMetadata(quoted, args) {
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
  downloadContentFromMessage,
  bufferToSticker,
  parseStickerMetadata,
};
