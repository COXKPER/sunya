const pino = require("pino");
const path = require("path");
const CFonts = require("cfonts");
const fs = require("fs-extra");
const axios = require("axios");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");

global.sessionName = "auth-info";

// Dynamically import chalk
const getChalk = async () => {
  const { default: chalk } = await import('chalk');
  return chalk;
};

// Database file
const databaseFile = path.join(__dirname, 'database.json');

// Load or initialize the database
const loadDatabase = () => {
  if (fs.existsSync(databaseFile)) {
    return JSON.parse(fs.readFileSync(databaseFile, 'utf-8'));
  } else {
    return {};
  }
};

const saveDatabase = (database) => {
  fs.writeFileSync(databaseFile, JSON.stringify(database, null, 2));
};

const database = loadDatabase();

// AI URL scan function
async function scanUrlWithAI(link) {
  try {
    const response = await axios.get(
      `https://fastrestapis.fasturl.cloud/ai/gpt4?prompt=Is%20this%20URL%20${encodeURIComponent(link)}%20a%20scam%3F%20Reply%20with%20scam%20or%20secure.`, // AI prompt here
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': '4aef1af7-afbf-4576-8e74-a71ce5f77fc3',
          'User-Agent': 'axios',
        }
      }
    );
    return response.data.response === 'scam'; // Check for 'scam' response
  } catch (error) {
    console.error('Error fetching from AI URL:', error);
    return false;
  }
}

async function main() {
  const chalk = await getChalk();
  const sessionExists = await fs.pathExists(path.join(__dirname, sessionName));
  if (sessionExists) {
    console.log(chalk.greenBright("Session exists, using the existing session"));
    ZyyPairing();
  } else {
    console.log(chalk.greenBright("Starting QR Code Pairing"));
    ZyyPairing();
  }
}

async function ZyyPairing() {
  const { state, saveCreds } = await useMultiFileAuthState("./" + sessionName);
  try {
    const chalk = await getChalk();
    const socket = makeWASocket({
      printQRInTerminal: true,
      logger: pino({ level: "silent" }),
      browser: ["Chrome (Linux)", "", ""], // Don't change this
      auth: state,
    });

    // Check messages for links and phishing
    socket.ev.on("messages.upsert", async (msg) => {
      const message = msg.messages[0];
      const from = message.key.remoteJid;
      const messageId = message.key.id;
      const isGroup = from.endsWith('@g.us');
      const sender = message.key.participant; // For group messages

      // Extract text from the message
      let text = '';
      if (message.message?.conversation) {
        text = message.message.conversation;
      } else if (message.message?.extendedTextMessage?.text) {
        text = message.message.extendedTextMessage.text;
      }

      // Check for URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex);

      if (urls && urls.length > 0) {
        for (const url of urls) {
          console.log(`Scanning ${url}...`);

          // Delay by 3 seconds
          await new Promise((resolve) => setTimeout(resolve, 3000));

          const isPhishing = await scanUrlWithAI(url);

          if (isPhishing) {
            const userPhone = sender.split('@')[0]; // Extract phone number from sender
            let userData = database[userPhone] || { warnings: 0 };

            userData.warnings += 1;
            database[userPhone] = userData;
            saveDatabase(database);

            if (userData.warnings >= 3) {
              // Remove user from the group after 3 warnings
              if (isGroup) {
                try {
                  await socket.groupParticipantsUpdate(from, [sender], 'remove');
                  await socket.sendMessage(from, { text: 'User kicked for phishing links after 3 warnings.' });
                } catch (error) {
                  await socket.sendMessage(from, { text: 'Bot cannot kick the user, either because it\'s not admin or the user is the group owner.' });
                }
              }

              // Remove user from the database
              delete database[userPhone];
              saveDatabase(database);
            } else {
              // Warn the user
              await socket.sendMessage(from, { text: `Warning ${userData.warnings}/3: Phishing link detected.` });
            }

            // Delete the message
            await socket.sendMessage(from, { delete: message.key });

            // Break after processing the first phishing link
            break;
          }
        }
      }
    });

    socket.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
      if (connection === "open") {
        console.log(chalk.greenBright("Connection opened and session is active"));
      } else if (
        connection === "close" &&
        lastDisconnect &&
        lastDisconnect.error &&
        lastDisconnect.error.output.statusCode &&
        lastDisconnect.error.output.statusCode !== 401
      ) {
        ZyyPairing();
      }
    });

    socket.ev.on("creds.update", saveCreds);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main().catch((error) => console.error(error));