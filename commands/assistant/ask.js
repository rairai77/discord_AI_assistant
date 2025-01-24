import { SlashCommandBuilder } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const api_key = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(api_key);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

export const data = new SlashCommandBuilder()
  .setName("ask")
  .setDescription("Answers query")
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("The query you'd like to ask")
      .setRequired(true)
  );

export async function execute(interaction) {
  console.log("Executing ask command...");
  await interaction.deferReply();
  const allowedUserId = "229094733182533643"; // Replace with the allowed user's Discord ID
  const userId = interaction.user.id;

  if (userId !== allowedUserId) {
    console.log("Unauthorized user:", interaction.user.id);
    await interaction.editReply({
      content: `Hello, ${interaction.user.username}! You are not authorized to use this command.`,
      ephemeral: true,
    });
    return;
  }

  console.log("Asking Gemini...");
  try {
    const result = await model.generateContent(
      interaction.options.getString("query")
    );
    console.log("Gemini response received.");

    let text = result.response.text();
    console.log("Response text:", text);

    if (!text || text.trim() === "") {
      await interaction.editReply("The response from Gemini was empty.");
      return;
    }

    const maxLength = 1950;
    const chunks = [];
    while (text.length > 0) {
      const splitIndex = text.lastIndexOf(" ", maxLength);
      const safeSplit = splitIndex > -1 ? splitIndex : maxLength;
      chunks.push(text.slice(0, safeSplit));
      text = text.slice(safeSplit).trim();
    }

    console.log("Sending first chunk...");
    let resp = await interaction.editReply(chunks[0]);
    console.log(resp);

    for (let i = 1; i < chunks.length; i++) {
      console.log(`Sending chunk ${i + 1}`);
      await interaction.followUp({ content: chunks[i] });
    }
  } catch (error) {
    console.error("Error during command execution:", error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "An error occurred while processing your request.",
        ephemeral: true,
      });
    } else {
      await interaction.editReply(
        "An error occurred while processing your request."
      );
    }
  }
}
