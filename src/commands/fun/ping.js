// .ping — Check bot response speed
module.exports = {
  name: "ping",
  aliases: ["speed", "p"],
  category: "fun",
  description: "Check bot response speed",
  usage: ".ping",
  async execute({ sock, m, settings, config }) {
    const start = Date.now();
    const { reply } = require("../../lib/sendMessage");
    const end = Date.now();
    const speed = end - start;
    const text = settings.success(`🏓 Pong! Response: *${speed}ms*`);
    await reply(sock, m, text);
  },
};
