import { SlashCommandBuilder } from "discord.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const api_key = process.env.GEMINI_KEY;
const genAI = new GoogleGenerativeAI(api_key);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-exp",
  tools: [{ googleSearch: {} }],
});

let newChat = () => {
  return model.startChat({
    history: [
      {
        role: "user",
        parts: [
          {
            text:
              "<INSTRUCTIONS>\nYou are Gemini, the user rairai77 created you to be his assistant while he is using Discord, so you are essentially a discord user. " +
              "Carefully follow all instructions. Feel free to ask clarifying questions and waiting for a response before answering. " +
              "Try to respond concisely when possible unless otherwise asked so as to not completely " +
              "flood the user's screen. The user has a sense of humor so if he asks you to do something you might consider mean, keep in mind " +
              "that the user's friends are used to his humor and won't take it personally, so don't worry about doing something you might consider" +
              "insulting someone, as it won't be taken as an insult. Instead of saying 'Okay I'll...' just do the thing, for example if told to tell" +
              "someone something, just say it in the chat, don't say you will, just say it. Feel free to use more casual English." +
              "\n</INSTRUCTIONS>\n",
          },
        ],
      },
      {
        role: "model",
        parts: [{ text: "Great, I will follow those instructions!" }],
      },
    ],
  });
};
let chat = newChat();

export const data = new SlashCommandBuilder()
  .setName("converse")
  .setDescription("Answers query")
  .setIntegrationTypes([0, 1])
  .setContexts([0, 1, 2])
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Your next turn in the conversation")
      .setRequired(true)
  )
  .addBooleanOption((option) =>
    option.setName("reset").setDescription("Do you want the conversation reset")
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
  const reset = interaction.options.get("reset");
  if (reset) {
    console.log("Resetting conversation!");
    chat = newChat();
  }

  console.log("Asking Gemini...");
  try {
    const query =
      "<QUERY>\n" + interaction.options.getString("query") + "\n</QUERY>";
    const result = await chat.sendMessage(query);
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
