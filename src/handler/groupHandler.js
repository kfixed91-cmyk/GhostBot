// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                 GhostBot — GROUP EVENT HANDLER                        ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("../../config");
const { getGroupSettings } = require("../lib/database");
const { sendText, reply } = require("../lib/sendMessage");
const chalk = require("chalk");

/**
 * Handle group-related events:
 * - Member added (welcome)
 * - Member removed (goodbye)
 * - Anti-bot detection
 */
async function groupEventHandler(sock, m) {
  try {
    const chatId = m.key.remoteJid;
    const settings = getGroupSettings(chatId);

    // ── Group participants update ────────────────────────────────
    if (m.message?.groupStatusMessage?.add) {
      const added = m.message.groupStatusMessage.add;
      await handleMemberAdd(sock, chatId, added, settings);
    }

    if (m.message?.groupStatusMessage?.remove) {
      const removed = m.message.groupStatusMessage.remove;
      await handleMemberRemove(sock, chatId, removed, settings);
    }
  } catch (e) {
    console.error(chalk.red(`[GROUP EVENT ERROR] ${e.message}`));
  }
}

/**
 * Handle member added to group (Welcome)
 */
async function handleMemberAdd(sock, groupId, addedList, settings) {
  if (!settings.welcome) return;

  try {
    const groupMeta = await sock.groupMetadata(groupId);
    const groupName = groupMeta.subject || "Group";
    const memberCount = groupMeta.participants.length;

    for (const jid of addedList) {
      // Anti-bot check
      if (settings.antiBot && jid.includes("bot")) {
        try {
          await sock.groupParticipantsUpdate(groupId, [jid], "remove");
          console.log(chalk.yellow(`[ANTI-BOT] Removed bot: ${jid}`));
        } catch (e) {
          // May fail if not admin
        }
        continue;
      }

      const name = `@${jid.split("@")[0]}`;

      const welcomeMsg =
        `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n` +
        `┃ 👋 *WELCOME!*\n` +
        `┃ Welcome to *${groupName}*,\n` +
        `┃ ${name} 🎉\n` +
        `┃ You are member #*${memberCount}*\n` +
        `┃ Enjoy your stay! 🔥\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`;

      await sock.sendMessage(groupId, {
        text: welcomeMsg,
        mentions: [jid],
      });
    }
  } catch (e) {
    console.error(chalk.red(`[WELCOME ERROR] ${e.message}`));
  }
}

/**
 * Handle member removed from group (Goodbye)
 */
async function handleMemberRemove(sock, groupId, removedList, settings) {
  if (!settings.goodbye) return;

  try {
    for (const jid of removedList) {
      const name = `@${jid.split("@")[0]}`;

      const goodbyeMsg =
        `╭━━〔 ${config.BOT_NAME} 〕━━⬣\n` +
        `┃ 😢 *GOODBYE*\n` +
        `┃ ${name} has left the group.\n` +
        `┃ We'll miss you! 💔\n` +
        `╰━━━━━━━━━━━━━━━━━━⬣`;

      await sock.sendMessage(groupId, {
        text: goodbyeMsg,
        mentions: [jid],
      });
    }
  } catch (e) {
    console.error(chalk.red(`[GOODBYE ERROR] ${e.message}`));
  }
}

module.exports = { groupEventHandler };
