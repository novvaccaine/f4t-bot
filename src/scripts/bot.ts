import { config } from "../config.js";
import { F4T } from "../f4t.js";
import { AI } from "../groq.js";
import { F4TMessage, RoomExit } from "../types.js";
import { debounce, filterRoom, getQuery, waitFor } from "../utils.js";

const MAX_MESSAGES_COUNT = 25;

type BotOptions = {
  languages?: string[];
  reply: boolean;
  roomID?: string;
};

export async function bot(f4t: F4T, ai: AI, options: BotOptions) {
  let messages: F4TMessage[] = [];

  const room = options.roomID
    ? `${config.f4t.url}/room/${options.roomID}`
    : await f4t.getRandomRoom((room) => filterRoom(room, options.languages));

  const replyWithAI = debounce(
    async (content: string, messages: F4TMessage[]) => {
      try {
        const reply = await ai.response(getQuery(content, messages));
        await f4t.sendMessage(reply);
        messages.push({ content: reply, username: config.f4t.username });
      } catch (err) {
        console.error("error: reply with ai:", err);
      }
    },
  );

  try {
    f4t.once("message", async (event: F4TMessage) => {
      console.log(event);
      if (event.username === config.f4t.username || !options.reply) {
        return;
      }
      replyWithAI(event.content, messages);
      messages.push(event);
      if (messages.length >= MAX_MESSAGES_COUNT) {
        messages = messages.slice(-1 * MAX_MESSAGES_COUNT);
      }
    });
    await f4t.joinRoom(room);
    console.log("joined room", room);
  } catch (err) {
    console.log("error:", err);
  } finally {
    await waitFor(2.5);
  }
}
