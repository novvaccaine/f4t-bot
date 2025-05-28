import { config } from "../config.js";
import { F4T } from "@kbski/f4t";
import { AI } from "../groq.js";
import { F4TMessage, RoomExit } from "../types.js";
import { debounce, getQuery, nhm } from "../utils.js";

const MAX_MESSAGES_COUNT = 25;

type BotOptions = {
  languages?: string[];
  reply: boolean;
  roomURL: string;
};

export async function bot(f4t: F4T, ai: AI, options: BotOptions) {
  return new Promise(async (_, reject) => {
    let messages: F4TMessage[] = [];

    f4t.on("roomExit", async (event: RoomExit) => {
      console.log("roomExit", event.reason);
      if (event.reason === "banned") {
        console.log(
          "bot mode: got banned at:",
          new Date().toLocaleTimeString(),
        );
        process.exit();
      }
      reject("exited room");
    });

    // setTimeout(() => {
    //   reject("timeout");
    // }, 180_000);

    f4t.on("message", async (event: F4TMessage) => {
      event.content = nhm.translate(event.content);
      console.log(event);
      if (
        event.username === config.f4t.username ||
        !options.reply ||
        event.username === "F4T Notification" ||
        event.content.toLowerCase().includes("blur this image")
      ) {
        return;
      }
      replyWithAI(event.content, messages);
      messages.push(event);
      if (messages.length >= MAX_MESSAGES_COUNT) {
        messages = messages.slice(-1 * MAX_MESSAGES_COUNT);
      }
    });

    const replyWithAI = debounce(
      async (content: string, messages: F4TMessage[]) => {
        try {
          const reply = await ai.response(getQuery(content, messages));
          await f4t.sendMessage(reply);
          messages.push({ content: reply, username: config.f4t.username });
        } catch (err) {
          console.log("failed to send ai reply:", err);
        }
      },
    );

    try {
      await f4t.joinRoom(options.roomURL);
      console.log("joined room", options.roomURL);
    } catch (err) {
      reject(err);
    }
  });
}
