# Sunya WhatsApp Bot

![banner](https://files.catbox.moe/t2w6c0.png)

A modular WhatsApp bot built with [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys).
Supports dynamic plugin loading, owner-only commands, and a built-in `.menu` system.

---

## ✨ Features

* Dynamic plugin system
* Auto reconnect
* Owner-only command support
* JSON-based configuration
* Optional proxy support (via environment variable)
* Built-in `.menu` command
* Modular architecture

---

## 📦 Installation

```bash
npm install
```

---

## 🚀 Run the Bot

```bash
node index.js
```

For production (recommended):

```bash
pm2 start index.js --name sunya-bot
```

---

## ⚙️ Configuration

Edit `settings.json`:

```json
{
  "botname": "Sunya Bot",
  "prefix": ".",
  "botbanner": "",
  "owner": ["628123456789"]
}
```

---

## 📁 Plugin System

Create `.js` files inside the `./plugins` folder.

Example:

```js
// plugins/hello.js
module.exports = (register) => {

  register.command("hello")
    .desc("Say hello")
    .function(async ({ sock, from }) => {
      await sock.sendMessage(from, {
        text: "👋 Hello!"
      });
    });

};
```

### Command Structure

```js
register.command("commandName")
  .desc("Command description")
  .function(async ({ sock, from, msg, text, args }) => {
    // your code here
  });
```

---

## 🔐 Owner-Only Commands

Use:

```js
register.command("restart")
  .desc("Restart the bot")
  .owner()
  .function(async ({ sock, from }) => {
    await sock.sendMessage(from, { text: "Restarting..." });
    process.exit(0);
  });
```

---

## 📌 Built-in Commands

* `.menu` — Display available commands

---

## 🌍 Optional Proxy

Set environment variable:

```bash
PROXY_URL=socks5://user:pass@host:port
```


