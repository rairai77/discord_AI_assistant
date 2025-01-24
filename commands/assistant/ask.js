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
  const allowedUserId = "229094733182533643"; // Replace with the allowed user's Discord ID
  const userId = interaction.user.id;

  if (userId !== allowedUserId) {
    await interaction.reply(
      {
        content:`Hello, ${interaction.user.username}! You are not authorized to use this command.`,
        ephemeral:true
      }
    );
    return;
  }
  await interaction.deferReply();
  const result = await model.generateContent(
    interaction.options.getString("query")
  );
  let text = result.response.text();
  const maxLength = 1950;
  // Split the text into chunks of the specified max length
  const chunks = [];
  while (text.length > 0) {
    // If the text is shorter than the limit, push it as is
    if (text.length <= maxLength) {
      chunks.push(text);
      break;
    }

    // Find the last whitespace within the maxLength
    const splitIndex = text.lastIndexOf(" ", maxLength);

    // If no whitespace is found, fallback to maxLength
    const safeSplit = splitIndex > -1 ? splitIndex : maxLength;

    // Push the chunk and trim it from the main text
    chunks.push(text.slice(0, safeSplit));
    text = text.slice(safeSplit).trim();
  }
  await interaction.editReply(chunks[0]);

  // Follow up with the remaining chunks
  for (let i = 1; i < chunks.length; i++) {
    await interaction.followUp({ content: chunks[i] });
  }
  // await interaction.reply(result.response.text());
}
