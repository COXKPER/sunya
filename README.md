
![Logo](https://files.catbox.moe/luftrz.png)


# Sunya Whatsapp Bot

A modular WhatsApp bot using [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) with dynamic command plugins and a `.menu` system.

---

## 📦 Installation

```bash
npm install
````

## 🚀 Start the Bot

```bash
node index.js
```

---

## ⚙️ Configuration

Edit `settings.json`:

```json
{
  "botname": "Test Bot",
  "botbanner": "https://example.com/banner.jpg",
  "owner": ["628123456789"]
}
```

---

## 📁 Plugin System

Add `.js` files to the `./plugins` folder like this:

```js
// plugins/hello.js
module.exports = (register) => {
  register.command(".hello")
    .desc("Say hello")
    .function(async ({ sock, from }) => {
      await sock.sendMessage(from, { text: "👋 Hello!" });
    });
};
```

Each plugin uses:

```js
register.command(".yourcommand")
  .desc("your description")
  .function(async ({ sock, from, msg, text }) => {
    // your code here
  });
```

---

## 🧠 Owner Check

Use this utility to check if sender is an owner:

```js
issenderowner(sender).then(() => {
  // do if owner
}).else(() => {
  // do if not owner
});
```

---

## 🧾 Built-in Commands

* `.menu` — Show command list with banner image

---

## 📌 Notes

* Dynamic plugin loading
* JSON-based settings


