// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                 GhostBot — COMMAND HANDLER                            ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const config = require("../../config");
const settings = require("../../settings");
const { parseArgs, getArgs, isGroup, isPrivate, getSender } = require("../lib/utils");
const { reply, sendReaction, sendTyping, sendRecording } = require("../lib/sendMessage");
const { isPremium } = require("../lib/database");
const { isOnCooldown } = require("../lib/database");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");

// Load all commands
const commands = new Map();

function loadCommands() {
  commands.clear();
  const commandsDir = path.join(__dirname, "..", "commands");
  const categories = fs.readdirSync(commandsDir).filter((f) =>
    fs.statSync(path.join(commandsDir, f)).isDirectory()
  );

  let totalLoaded = 0;

  for (const category of categories) {
    const catDir = path.join(commandsDir, category);
    const files = fs.readdirSync(catDir).filter((f) => f.endsWith(".js"));

    for (const file of files) {
      try {
        const cmdPath = path.join(catDir, file);
        // Clear require cache for hot-reload support
        delete require.cache[require.resolve(cmdPath)];
        const command = require(cmdPath);

        if (command.name) {
          command.category = category;

          // Register main name and aliases
          const names = [command.name, ...(command.aliases || [])];
          for (const name of names) {
            commands.set(name.toLowerCase(), command);
          }

          totalLoaded++;
        }
      } catch (e) {
        console.error(chalk.red(`[CMD LOAD] Error loading ${category}/${file}: ${e.message}`));
      }
    }
  }

  console.log(chalk.green(`[CMD] Loaded ${totalLoaded} commands across ${categories.length} categories`));
  return totalLoaded;
}

// Get all unique commands (by primary name)
function getAllCommands() {
  const seen = new Set();
  const all = [];
  for (const cmd of commands.values()) {
    if (!seen.has(cmd.name)) {
      seen.add(cmd.name);
      all.push(cmd);
    }
  }
  return all;
}

// Get commands by category
function getCommandsByCategory(category) {
  const all = getAllCommands();
  return all.filter((c) => c.category === category);
}

/**
 * Main command handler
 */
async function commandHandler(sock, m, context) {
  const { text, sender, chatId, pushName, groupChat, privateChat } = context;

  try {
    // Parse command name
    const withoutPrefix = text.slice(config.PREFIX.length);
    const parts = withoutPrefix.trim().split(/ +/);
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);
    const argsText = args.join(" ");

    // Find command
    const command = commands.get(cmdName);
    if (!command) return; // Unknown command — silently ignore

    // Check if command is disabled
    if (config.DISABLED_COMMANDS.includes(command.name)) return;

    // Cooldown check
    if (config.COOLDOWN_ENABLED) {
      const { onCooldown, remaining } = isOnCooldown(sender, command.name, config.COOLDOWN_DURATION);
      if (onCooldown) {
        await sendReaction(sock, chatId, "⏱️", m.key);
        return;
      }
    }

    // Restriction checks
    if (command.ownerOnly) {
      const isOwner = config.OWNER_NUMBER.some(
        (num) => sender.includes(num) || sender.includes(num.replace(/^0+/, ""))
      );
      if (!isOwner) {
        await reply(sock, m, settings.ownerOnly());
        await sendReaction(sock, chatId, config.ERROR_REACTION, m.key);
        return;
      }
    }

    if (command.adminOnly && groupChat) {
      const groupMeta = await sock.groupMetadata(chatId).catch(() => null);
      if (groupMeta) {
        const participant = groupMeta.participants.find((p) => p.id === sender);
        if (!participant || (participant.admin !== "admin" && participant.admin !== "superadmin")) {
          await reply(sock, m, settings.adminOnly());
          await sendReaction(sock, chatId, config.ERROR_REACTION, m.key);
          return;
        }
      }
    }

    if (command.groupOnly && !groupChat) {
      await reply(sock, m, settings.groupOnly());
      await sendReaction(sock, chatId, config.ERROR_REACTION, m.key);
      return;
    }

    if (command.privateOnly && !privateChat) {
      await reply(sock, m, settings.privateOnly());
      await sendReaction(sock, chatId, config.ERROR_REACTION, m.key);
      return;
    }

    if (command.premiumOnly) {
      const isOwner = config.OWNER_NUMBER.some(
        (num) => sender.includes(num) || sender.includes(num.replace(/^0+/, ""))
      );
      if (!isOwner && !isPremium(sender)) {
        await reply(sock, m, settings.premiumOnly());
        await sendReaction(sock, chatId, config.ERROR_REACTION, m.key);
        return;
      }
    }

    // Auto typing/recording
    if (config.AUTO_TYPING) await sendTyping(sock, chatId);
    if (config.AUTO_RECORDING) await sendRecording(sock, chatId);

    // React
    if (config.ENABLE_REACTIONS) {
      await sendReaction(sock, chatId, config.PROCESSING_REACTION, m.key);
    }

    // Execute command
    const execContext = {
      sock,
      m,
      args,
      argsText,
      text,
      sender,
      chatId,
      pushName,
      groupChat,
      privateChat,
      config,
      settings,
      command,
      getAllCommands,
      getCommandsByCategory,
    };

    await command.execute(execContext);

    // Success reaction
    if (config.ENABLE_REACTIONS) {
      await sendReaction(sock, chatId, config.SUCCESS_REACTION, m.key);
    }
  } catch (e) {
    console.error(chalk.red(`[CMD ERROR] ${cmdName || "unknown"}: ${e.message}`));
    console.error(chalk.gray(e.stack));

    if (config.ENABLE_REACTIONS) {
      await sendReaction(sock, chatId, config.ERROR_REACTION, m.key).catch(() => {});
    }

    await reply(sock, m,
      `╭━━〔 ${config.BOT_NAME} - ERROR 〕━━⬣\n` +
      `┃ ❌ An error occurred while executing the command.\n` +
      `┃ Error: ${e.message.slice(0, 100)}\n` +
      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━⬣`
    ).catch(() => {});
  }
}

// Initial load
loadCommands();

module.exports = {
  commandHandler,
  commands,
  loadCommands,
  getAllCommands,
  getCommandsByCategory,
};
