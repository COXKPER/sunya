const fs = require('fs');
const axios = require('axios');
const pino = require('pino');
const path = require('path');
const { HttpsProxyAgent } = require('https-proxy-agent');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const checkOwner = require('./issenderowner');

// Proxy setup
const proxy = 'socks5://frpax2oj6spziip-country-us:n9y230w2brf7t5w@rp.proxyscrape.com:6060';
const agent = new HttpsProxyAgent(proxy);

// Command storage
const commands = [];

// Command registration interface
const register = {
  command(cmd) {
    const entry = { cmd, description: '', callback: () => {} };
    commands.push(entry);
    return {
      desc(text) {
        entry.description = text;
        return this;
      },
      function(func) {
        entry.callback = func;
        return this;
      }
    };
  }
};

// Load plugins dynamically
function loadPlugins() {
  const pluginDir = './plugins';
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);
  const pluginFiles = fs.readdirSync(pluginDir).filter(file => file.endsWith('.js'));
  for (const file of pluginFiles) {
    try {
      require(path.join(__dirname, pluginDir, file))(register);
      console.log(`✅ Loaded plugin: ${file}`);
    } catch (err) {
      console.error(`❌ Failed to load plugin ${file}:`, err);
    }
  }
}

// Main WhatsApp bot
async function ZyyPairing() {
  const sessionName = 'auth-info';
  const { state, saveCreds } = await useMultiFileAuthState('./' + sessionName);

  const socket = makeWASocket({
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['Chrome (Linux)', '', ''],
    auth: state,
  });

  // Load plugins
  loadPlugins();

  // Default .menu command
register.command('.menu')
  .desc('Show all commands')
  .function(async ({ sock, from }) => {
    const list = commands.map(c => `${c.cmd} - ${c.description}`).join('\n');
    const settings = require('./settings.json');
    const bannerUrl = settings.botbanner;

    try {
      const response = await axios.get(bannerUrl, { responseType: 'arraybuffer' });
      await sock.sendMessage(from, {
        image: Buffer.from(response.data),
        caption: `🤖 *${settings.botname}*\n\n📜 *Available Commands:*\n\n${list}`
      });
    } catch (err) {
      console.error("Failed to fetch banner image:", err);
      await sock.sendMessage(from, {
        text: `🤖 *${settings.botname}*\n\n📜 *Available Commands:*\n\n${list}`
      });
    }
  });


  socket.ev.on('messages.upsert', async (msg) => {
    const m = msg.messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;
    const text = m.message.conversation || m.message?.extendedTextMessage?.text || '';
    const command = commands.find(c => text.startsWith(c.cmd));
    if (command) {
      try {
        await command.callback({ sock: socket, msg: m, from, text });
      } catch (err) {
        console.error('Command error:', err);
      }
    }
  });

  socket.ev.on('creds.update', saveCreds);
}

ZyyPairing().catch(console.error);
