module.exports = {
  name: "addprem",
  aliases: ["addpremium"],
  category: "owner",
  description: "Add a user to premium",
  usage: ".addprem @user <days/permanent>",
  ownerOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { givePremium } = require("../../lib/premium");
    if (args.length < 1) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}addprem @user <days>\nExample: ${config.PREFIX}addprem @user 30d`));
    const target = args[0].replace("@", "") + "@s.whatsapp.net";
    const duration = args[1] || "permanent";
    givePremium(target, duration);
    await reply(sock, m, settings.success(`✅ Premium added for @${target.split("@")[0]}. Duration: ${duration}`));
  },
};
