// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                    GhostBot — SEND MESSAGE UTILS                       ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("../../config");
const chalk = require("chalk");

/**
 * Send a text message with optional mention
 */
async function sendText(sock, jid, text, options = {}) {
  try {
    const msg = {
      text: text,
      ...options,
    };
    await sock.sendMessage(jid, msg);
    return true;
  } catch (e) {
    console.error(chalk.red(`[SEND ERROR] ${e.message}`));
    return false;
  }
}

/**
 * Send an image with caption
 */
async function sendImage(sock, jid, imageBuffer, caption = "", options = {}) {
  try {
    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: caption,
      ...options,
    });
    return true;
  } catch (e) {
    console.error(chalk.red(`[SEND IMAGE ERROR] ${e.message}`));
    return false;
  }
}

/**
 * Send a video with caption
 */
async function sendVideo(sock, jid, videoBuffer, caption = "", options = {}) {
  try {
    await sock.sendMessage(jid, {
      video: videoBuffer,
      caption: caption,
      gifPlayback: options.gifPlayback || false,
      ...options,
    });
    return true;
  } catch (e) {
    console.error(chalk.red(`[SEND VIDEO ERROR] ${e.message}`));
    return false;
  }
}

/**
 * Send an audio file
 */
async function sendAudio(sock, jid, audioBuffer, options = {}) {
  try {
    await sock.sendMessage(jid, {
      audio: audioBuffer,
      mimetype: "audio/mp4",
      ptt: options.ptt || false, // true = voice note
      ...options,
    });
    return true;
  } catch (e) {
    console.error(chalk.red(`[SEND AUDIO ERROR] ${e.message}`));
    return false;
  }
}

/**
 * Send a sticker
 */
async function sendSticker(sock, jid, stickerBuffer, options = {}) {
  try {
    await sock.sendMessage(jid, {
      sticker: stickerBuffer,
      ...options,
    });
    return true;
  } catch (e) {
    console.error(chalk.red(`[SEND STICKER ERROR] ${e.message}`));
    return false;
  }
}

/**
 * Send a document/file
 */
async function sendDocument(sock, jid, buffer, filename, mimetype, options = {}) {
  try {
    await sock.sendMessage(jid, {
      document: buffer,
      fileName: filename,
      mimetype: mimetype,
      ...options,
    });
    return true;
  } catch (e) {
    console.error(chalk.red(`[SEND DOC ERROR] ${e.message}`));
    return false;
  }
}

/**
 * Send a reaction to a message
 */
async function sendReaction(sock, jid, reaction, messageKey) {
  try {
    await sock.sendMessage(jid, {
      react: {
        text: reaction,
        key: messageKey,
      },
    });
    return true;
  } catch (e) {
    // Silently fail for reactions
    return false;
  }
}

/**
 * Reply to a message with text (quoted)
 */
async function reply(sock, m, text) {
  try {
    await sock.sendMessage(m.key.remoteJid, {
      text: text,
    }, {
      quoted: m,
    });
    return true;
  } catch (e) {
    console.error(chalk.red(`[REPLY ERROR] ${e.message}`));
    return false;
  }
}

/**
 * Send typing presence
 */
async function sendTyping(sock, jid) {
  try {
    await sock.sendPresenceUpdate("composing", jid);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Send recording presence
 */
async function sendRecording(sock, jid) {
  try {
    await sock.sendPresenceUpdate("recording", jid);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  sendText,
  sendImage,
  sendVideo,
  sendAudio,
  sendSticker,
  sendDocument,
  sendReaction,
  reply,
  sendTyping,
  sendRecording,
};
