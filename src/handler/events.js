// ╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
// ┃                   GhostBot — EVENTS (CONNECTION)                      ┃
// ╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

const { loadCommands } = require("./commandHandler");
const chalk = require("chalk");

/**
 * Handle connection-related events
 */
function handleConnectionUpdate(sock, update, startTime) {
  const { connection, lastDisconnect, qr } = update;

  if (qr) {
    // QR code received — user scans it
    return;
  }

  if (connection === "close") {
    const shouldReconnect =
      lastDisconnect?.error?.output?.statusCode !== 401; // 401 = logged out

    console.log(chalk.yellow(`[CONNECTION] Closed. Reconnecting: ${shouldReconnect}`));

    if (shouldReconnect) {
      // Attempt reconnection
      setTimeout(() => {
        console.log(chalk.cyan("[CONNECTION] Attempting reconnect..."));
        process.exit(1); // Let process manager restart
      }, 5000);
    } else {
      console.log(chalk.red("[CONNECTION] Session expired. Delete session files and re-scan."));
    }
  }

  if (connection === "open") {
    console.log(chalk.green.bold(`\n╔══════════════════════════════════╗`));
    console.log(chalk.green.bold(`║   🔥 ${"GhostBot".padEnd(24)}🔥 ║`));
    console.log(chalk.green.bold(`║   Bot is now ONLINE!             ║`));
    console.log(chalk.green.bold(`╚══════════════════════════════════╝\n`));

    // Reload commands on reconnect
    loadCommands();
  }

  if (update.isNewLogin) {
    console.log(chalk.green("[LOGIN] New login detected"));
  }
}

module.exports = { handleConnectionUpdate };
