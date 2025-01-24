import { SlashCommandBuilder } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const api_key = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(api_key);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  tools: [{ googleSearch: {} }],
});

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
  const allowedUserIds = ["229094733182533643", "658530898140069899"]; // Rai, Exie
  const userId = interaction.user.id;

  if (!allowedUserIds.includes(userId)) {
    console.log("Unauthorized user:", interaction.user.id);
    await interaction.editReply({
      content: `Hello, ${interaction.user.username}! You are not authorized to use this command.`,
      ephemeral: true,
    });
    return;
  }

  console.log("Asking Gemini...");
  try {
    // console.log("Fetching recent messages for context...");
    // console.log(interaction);
    // const messages = await interaction.user.dmChannel.messages
    //   .fetch({ limit: 10 })
    //   .catch(() => []);
    // const context = messages
    //   .map((msg) => `${msg.author.username}: ${msg.content}`)
    //   .reverse() // Reverse to show oldest messages first
    //   .join("\n");
    const query =
      "<INSTRUCTIONS>\nYou are Gemini, the user rairai77 created you to be his assistant while he is using Discord. " +
      "Carefully follow all instructions. Try to respond concisely when possible unless otherwise asked so as to not completely " +
      "flood the user's screen. The user has a sense of humor so if he asks you to do something you might consider mean, keep in mind " +
      "that the user's friends are used to his humor and won't take it personally, so don't worry about doing something you might consider" +
      "insulting someone, as it won't be taken as an insult. Instead of saying 'Okay I'll...' just do the thing, for example if told to tell" +
      "someone something, just say it in the chat, don't say you will, just say it."+
      // "You will be fed context (the past 10 messages in the conversation within the <CONTEXT> tag " +
      // "based on the contents of the you may or may not need this information to help answer the user's query" +
      "\n</INSTRUCTIONS>\n" +
      // "<CONTEXT>\n" +
      // context +
      // "\n</CONTEXT>\n" +
      `<QUERY from="${interaction.user.username}">\n` +
      interaction.options.getString("query") +
      "\n</QUERY>";
    const result = await model.generateContent(query);
    console.log("Gemini response received.");

    let text = result.response.text();
    console.log("Response text:", text);

    if (!text || text.trim() === "") {
      await interaction.editReply("The response from Gemini was empty.");
      return;
    }

    const maxLength = 1950;
    const chunks = [];
    while (text.length > maxLength) {
      const splitIndex = text.lastIndexOf(" ", maxLength);
      const safeSplit = splitIndex > -1 ? splitIndex : maxLength;
      chunks.push(text.slice(0, safeSplit));
      text = text.slice(safeSplit).trim();
    }
    chunks.push(text.trim());

    console.log("Sending first chunk...");
    await interaction.editReply(chunks[0]);
    // console.log(resp);

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
