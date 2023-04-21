import "std/dotenv/load.ts";
import { Client, Intents } from "harmony";
import { OpenAI } from "openai";
import { listCourses } from "./canvas.ts";
import { getAssignments } from "./assignments.ts";

const openAI = new OpenAI(Deno.env.get("OPENAI_TOKEN")!);

const client = new Client({});

const date_options: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
};

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "clear") {
    const messages = (await message.channel.fetchMessages({ limit: 100 }))
      .array();

    for (const message of messages) {
      if (message.author.bot) {
        await message.delete();
      }
    }

    return;
  }

  await message.channel.triggerTyping();

  const dm_messages = (await message.channel.fetchMessages({ limit: 10 }))
    .array().map((message) => ({
      role: (message.author.bot ? "assistant" : "user") as "assistant" | "user",
      content: message.content,
    })).reverse();
  const courses = await listCourses();
  const completion = await openAI.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          `You are a notification system in a Discord DM. The current date is ${
            new Intl.DateTimeFormat("en-US", date_options).format(new Date())
          }.`,
      },
      {
        role: "system",
        content:
          `The user you are talking to is taking the following classes:\n${
            courses.map((course) => "- " + course.name).join("\n")
          }`,
      },
      ...dm_messages,
    ],
  });

  await message.channel.send(completion.choices[0].message);
});

client.connect(Deno.env.get("DISCORD_TOKEN"), Intents.NonPrivileged);

async function pingAboutCourses() {
  const dm = await client.createDM(Deno.env.get("DISCORD_USER_ID")!);
  const assignments = await getAssignments();

  const completion = await openAI.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          `You are a notification system in a Discord DM. The current date is ${
            new Intl.DateTimeFormat("en-US", date_options).format(new Date())
          }.`,
      },
      {
        role: "system",
        content:
          `The user you are talking to has the following assignments due soon:\n${
            assignments.map((assignment) =>
              `- ${assignment.name} (due at ${
                new Intl.DateTimeFormat("en-US", date_options).format(
                  new Date(assignment.due_at),
                )
              })\n`
            ).join("")
          }`,
      },
      {
        role: "system",
        content:
          "Write a friendly message reminding the user to do these assignments. Please format the assignments on different lines.",
      },
    ],
  });

  dm.send(completion.choices[0].message);
  schedulePing();
}

function schedulePing() {
  const now = new Date();
  let time =
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0)
      .getTime() - now.getTime();
  if (time < 0) {
    time += 86400000; // it's after 10am, try 10am tomorrow.
  }
  setTimeout(pingAboutCourses, time);
}

schedulePing();
