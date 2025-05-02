const os = require("os");
const { exec } = require("child_process");
const settings = require("../settings.json");

module.exports = (register, issenderowner) => {
  // .ping
  register.command(".ping")
    .desc("Check bot response time")
    .function(async ({ sock, from }) => {
      const start = Date.now();
      const sentMsg = await sock.sendMessage(from, { text: "🏓 Pinging..." });
      const latency = Date.now() - start;
      await sock.sendMessage(from, { text: `🏓 Pong! ${latency}ms` });
    });

  // .specs
  register.command(".specs")
    .desc("Show system info")
    .function(async ({ sock, from }) => {
      const uptime = os.uptime();
      const ram = (os.totalmem() - os.freemem()) / os.totalmem() * 100;
      const text = `🧠 *Bot Specs*\n\n` +
        `🖥 Platform: ${os.platform()} ${os.arch()}\n` +
        `⏱ Uptime: ${Math.floor(uptime / 60)} min\n` +
        `📊 CPU: ${os.cpus()[0].model}\n` +
        `📈 RAM Usage: ${ram.toFixed(2)}%`;
      await sock.sendMessage(from, { text });
    });

  // .restart
  register.command(".restart")
    .desc("Restart the bot (owner only)")
    .function(async ({ sock, from }) => {
      const sender = from.replace(/[^0-9]/g, "");

      checkOwner(sender).then(async () => {
        await sock.sendMessage(from, { text: "♻️ Restarting bot..." });
        setTimeout(() => {
          process.exit(0); // Let your process manager (pm2 or nodemon) handle restart
        }, 1000);
      }).else(() => {
        sock.sendMessage(from, { text: "🚫 Only the bot owner can use this command." });
      });
    });
};
