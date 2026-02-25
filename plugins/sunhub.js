const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = (register) => {

  const pluginFolder = __dirname;

  function validName(name) {
    return /^[a-zA-Z0-9_-]+$/.test(name);
  }

  function reloadPlugin(pluginName) {
    const pluginPath = path.join(pluginFolder, `${pluginName}.js`);

    delete require.cache[require.resolve(pluginPath)];

    const plugin = require(pluginPath);
    if (typeof plugin === "function") {
      plugin(register);
    }
  }

  register.command("sunhub")
    .desc("Sunhub Plugin Manager")
    .owner()
    .function(async ({ sock, from, args }) => {

      const action = args[0];
      const pluginName = args[1];

      if (!action) {
        return sock.sendMessage(from, {
          text:
            "📦 Sunhub Commands:\n\n" +
            ".sunhub install <plugin>\n" +
            ".sunhub remove <plugin>\n" +
            ".sunhub about <plugin>"
        });
      }

      // ================= INSTALL =================
      if (action === "install") {

        if (!pluginName || !validName(pluginName)) {
          return sock.sendMessage(from, {
            text: "❌ Invalid plugin name."
          });
        }

        const baseURL =
          `https://git.disroot.org/Sunhub/${pluginName}/raw/branch/main`;

        try {
          await sock.sendMessage(from, {
            text: `📦 Installing ${pluginName}...`
          });

          const jsRes = await axios.get(`${baseURL}/${pluginName}.js`);
          fs.writeFileSync(
            path.join(pluginFolder, `${pluginName}.js`),
            jsRes.data
          );

          try {
            const mdRes = await axios.get(`${baseURL}/${pluginName}.md`);
            fs.writeFileSync(
              path.join(pluginFolder, `${pluginName}.md`),
              mdRes.data
            );
          } catch {}

          reloadPlugin(pluginName);

          await sock.sendMessage(from, {
            text: `✅ Plugin ${pluginName} installed & loaded (no restart).`
          });

        } catch (err) {

          if (err.response?.status === 404) {
            return sock.sendMessage(from, {
              text: "❌ Plugin not found."
            });
          }

          console.error(err);

          await sock.sendMessage(from, {
            text: "❌ Installation failed."
          });
        }
      }

      // ================= REMOVE =================
      else if (action === "remove") {

        if (!pluginName || !validName(pluginName)) {
          return sock.sendMessage(from, {
            text: "❌ Invalid plugin name."
          });
        }

        const jsPath = path.join(pluginFolder, `${pluginName}.js`);
        const mdPath = path.join(pluginFolder, `${pluginName}.md`);

        if (!fs.existsSync(jsPath)) {
          return sock.sendMessage(from, {
            text: "❌ Plugin not installed."
          });
        }

        delete require.cache[require.resolve(jsPath)];

        fs.unlinkSync(jsPath);
        if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);

        await sock.sendMessage(from, {
          text: `🗑 Plugin ${pluginName} removed.`
        });
      }

      // ================= ABOUT =================
      else if (action === "about") {

        if (!pluginName || !validName(pluginName)) {
          return sock.sendMessage(from, {
            text: "❌ Invalid plugin name."
          });
        }

        const mdPath = path.join(pluginFolder, `${pluginName}.md`);

        if (!fs.existsSync(mdPath)) {
          return sock.sendMessage(from, {
            text: "❌ No README found for this plugin."
          });
        }

        const content = fs.readFileSync(mdPath, "utf-8");

        await sock.sendMessage(from, {
          text: `📄 About ${pluginName}:\n\n${content.slice(0, 3000)}`
        });
      }

      else {
        await sock.sendMessage(from, {
          text: "❌ Unknown sunhub command."
        });
      }

    });

};