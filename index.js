const axios = require('axios');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState } = require('@whiskeysockets/baileys');
const fs = require('fs');
const { HttpsProxyAgent } = require('https-proxy-agent');
const pino = require('pino');

// SOCKS5 Proxy setup
const proxy = 'socks5://frpax2oj6spziip-country-us:n9y230w2brf7t5w@rp.proxyscrape.com:6060';
const agent = new HttpsProxyAgent(proxy);

// Load or initialize the database
const databaseFile = './database.json';
let database = {};

if (fs.existsSync(databaseFile)) {
  database = JSON.parse(fs.readFileSync(databaseFile));
} else {
  fs.writeFileSync(databaseFile, JSON.stringify(database));
}

function saveDatabase(db) {
  fs.writeFileSync(databaseFile, JSON.stringify(db, null, 2));
}

// Fetch blacklist from GitHub
async function fetchBlacklist() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/NeonGebaCorp/test/refs/heads/main/blacklist', {
      httpsAgent: agent, // Use the proxy agent
    });
    return response.data.split('\n'); // Assuming the blacklist is a newline-separated text file
  } catch (error) {
    console.error('Error fetching blacklist from GitHub:', error);
    return [];
  }
}

// AI URL scan function with updated prompt
async function scanUrlWithAI(link) {
  try {
    const prompt = `this link is scam or not, link: ${link}, if scam say scam and if not scam say secure  `;
    const response = await axios.get(
      `https://fastrestapis.fasturl.cloud/ai/gemini/chat?ask=${encodeURIComponent(prompt)}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': '4aef1af7-afbf-4576-8e74-a71ce5f77fc3',
          'User-Agent': 'axios',
        },
        httpsAgent: agent, // Use the proxy agent
      }
    );
    return response.data.response === 'Scam'; // Check for 'scam' response
  } catch (error) {
    console.error('Error fetching from AI URL:', error);
    return false;
  }
}

// Fetch warning message from GitHub
async function fetchWarningMessage() {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/NeonGebaCorp/test/refs/heads/main/white', {
      httpsAgent: agent, // Use the proxy agent
    });
    return response.data; // Assuming the message is plain text
  } catch (error) {
    console.error('Error fetching warning message:', error);
    return 'Please avoid sharing suspicious links.';
  }
}

// Main function to handle phishing checks and warnings
async function ZyyPairing() {
  const sessionName = "auth-info"; // Define the session name
  const { state, saveCreds } = await useMultiFileAuthState("./" + sessionName);
  
  try {
    const socket = makeWASocket({
      printQRInTerminal: true,
      logger: pino({ level: "silent" }),
      browser: ["Chrome (Linux)", "", ""],
      auth: state,
    });

    // Check messages for links and phishing
    socket.ev.on("messages.upsert", async (msg) => {
      const message = msg.messages[0];
      const from = message.key.remoteJid;
      const messageId = message.key.id;
      const sender = message.key.participant;
      const isGroup = from.endsWith('@g.us');

      // Only process the message if it contains a URL
      const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex);

      if (urls && urls.length > 0) {
        for (const url of urls) {
          console.log(`Scanning ${url}...`);
          const blacklist = await fetchBlacklist();

          // Check if the URL is on the blacklist
          if (blacklist.includes(url)) {
            console.log('URL is on the blacklist!');
            await handlePhishingDetected(socket, from, message, sender, isGroup);
            break;
          } else {
            // Use AI if URL is not on the blacklist
            const isPhishing = await scanUrlWithAI(url);

            if (isPhishing) {
              console.log('AI detected phishing!');
              await handlePhishingDetected(socket, from, message, sender, isGroup);
              break;
            }
          }
        }
      }
    });

    socket.ev.on("creds.update", saveCreds);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// Handle phishing detection by sending a warning or kicking the user
async function handlePhishingDetected(socket, from, message, sender, isGroup) {
  const warnings = database[sender]?.warnings || 0;

  if (isGroup) {
    if (warnings >= 3) {
      try {
        await socket.groupParticipantsUpdate(from, [sender], 'remove');
        await socket.sendMessage(from, { text: 'User removed for phishing!' });
        delete database[sender]; // Remove user from the database
      } catch (error) {
        console.error('Error removing user:', error);
        await socket.sendMessage(from, { text: 'Cannot remove user, bot is not admin!' });
      }
    } else {
      const warningMessage = await fetchWarningMessage();
      await socket.sendMessage(from, { text: `Warning ${warnings + 1}/3: ${warningMessage}` });
      database[sender] = { warnings: warnings + 1 };
      saveDatabase(database);
    }
  } else {
    await socket.sendMessage(from, { text: 'Phishing detected in private chat!' });
  }

  // Remove the phishing message
  await socket.sendMessage(from, { delete: message.key });
}

// Start the bot
ZyyPairing().catch((error) => console.error(error));
