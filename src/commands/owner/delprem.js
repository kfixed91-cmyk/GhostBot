module.exports = {
  name: "delprem",
  aliases: ["removeprem", "unpremium"],
  category: "owner",
  description: "Remove premium from a user",
  usage: ".delprem @user",
  ownerOnly: true,
  async execute({ sock, m, args, config, settings }) {
    const { reply } = require("../../lib/sendMessage");
    const { revokePremium } = require("../../lib/premium");
    if (args.length < 1) return reply(sock, m, settings.error(`Usage: ${config.PREFIX}delprem @user`));
    const target = args[0].replace("@", "") + "@s.whatsapp.net";
    revokePremium(target);
    await reply(sock, m, settings.success(`✅ Premium removed from @${target.split("@")[0]}`));
  },
};
