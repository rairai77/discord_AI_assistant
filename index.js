import { Client, Collection, Events, GatewayIntentBits } from "discord.js";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { dirname } from "path";
import { fileURLToPath } from "url";
import express from "express";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const token = process.env.DISCORD_TOKEN;

// Create a new client instance with intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.DirectMessages,
    // GatewayIntentBits.MessageContent,
  ],
  //   partials: ['CHANNEL'],
});

// Initialize commands collection
client.commands = new Collection();

// Load commands dynamically
async function loadCommands(client) {
  const foldersPath = join(__dirname, "commands");
  const commandFolders = readdirSync(foldersPath);

  for (const folder of commandFolders) {
    const commandsPath = join(foldersPath, folder);
    const commandFiles = readdirSync(commandsPath).filter((file) =>
      file.endsWith(".js")
    );

    for (const file of commandFiles) {
      const filePath = join(commandsPath, file);
      const command = await import(filePath);

      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
}

// Handle interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    await interaction.reply({
      content: "Command not recognized!",
      ephemeral: true,
    });
    return;
  }

  try {
    // Check if interaction is in a DM or a guild
    if (!interaction.guild) {
      console.log(
        `Command ${interaction.commandName} executed in DM by ${interaction.user.tag}`
      );
    } else {
      console.log(
        `Command ${interaction.commandName} executed in ${interaction.guild.name} by ${interaction.user.tag}`
      );
    }
    // console.log(client);

    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

// Handle client ready event
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

// Load commands and log in the bot
(async () => {
  try {
    await loadCommands(client);
    await client.login(token);
  } catch (error) {
    console.error("Error initializing bot:", error);
  }
})();

// Express server setup
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server is listening on port ${PORT}`);
});
