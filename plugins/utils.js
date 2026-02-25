const os = require("os");

module.exports = (register, isOwner) => {

  // ================= PING =================

  register.command("ping")
    .desc("Check bot response time")
    .function(async ({ sock, from }) => {

      const start = Date.now();

      await sock.sendMessage(from, {
        text: "🏓 Pinging..."
      });

      const latency = Date.now() - start;

      await sock.sendMessage(from, {
        text: `🏓 Pong! ${latency}ms`
      });

    });


  // ================= SPECS =================

  register.command("specs")
    .desc("Show system info")
    .function(async ({ sock, from }) => {

      const uptime = os.uptime();
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedRamPercent =
        ((totalMem - freeMem) / totalMem) * 100;

      const text =
        `🧠 *Bot Specs*\n\n` +
        `🖥 Platform: ${os.platform()} ${os.arch()}\n` +
        `⏱ Uptime: ${Math.floor(uptime / 60)} minutes\n` +
        `📊 CPU: ${os.cpus()[0].model}\n` +
        `📈 RAM Usage: ${usedRamPercent.toFixed(2)}%`;

      await sock.sendMessage(from, { text });

    });


  // ================= RESTART =================

  register.command("restart")
    .desc("Restart the bot (owner only)")
    .owner() // pakai sistem owner bawaan core
    .function(async ({ sock, from }) => {

      await sock.sendMessage(from, {
        text: "♻️ Restarting bot..."
      });

      setTimeout(() => {
        process.exit(0);
      }, 1000);

    });

};