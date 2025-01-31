import { config } from "../config.js";
import { F4T } from "../f4t.js";
import { AI } from "../groq.js";
import { F4TMessage } from "../types.js";
import { debounce, filterRoom, getQuery, waitFor } from "../utils.js";

const MAX_MESSAGES_COUNT = 25;

type BotOptions = {
  languages?: string[];
  reply: boolean;
  roomID?: string;
};

export async function bot(f4t: F4T, ai: AI, options: BotOptions) {
  const { languages } = options;
  const room = await f4t.getRandomRoom((room) => filterRoom(room, languages));
  let messages: F4TMessage[] = [];
  const defaultRoom = options.roomID
    ? `${config.f4t.url}/room/${options.roomID}`
    : null;

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
    await f4t.joinRoom(defaultRoom ?? room.url);
    console.log("joined room", defaultRoom ?? room.url);

    f4t.on("message", async (event: F4TMessage) => {
      console.log(event);
      if (event.username === config.f4t.username) {
        return;
      }
      replyWithAI(event.content, messages);
      messages.push(event);
      if (messages.length >= MAX_MESSAGES_COUNT) {
        messages = messages.slice(-1 * MAX_MESSAGES_COUNT);
      }
    });
  } catch (err) {
    console.log("error:", err);
  } finally {
    await waitFor(2.5);
  }
}
