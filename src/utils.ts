import { F4TMessage, Room } from "./types.js";
import { NodeHtmlMarkdown } from "node-html-markdown";
import crypto from "crypto";
import { config } from "./config.js";

export function filterRoom(room: Room) {
  const unlimitedParticipantsRoom =
    room.maxPeople === 0 && room.clients.length > 1;

  const limitedParticipantsRoom =
    room.maxPeople > 0 &&
    room.clients.length > 1 &&
    room.clients.length < room.maxPeople;

  const isAmInRoom = room.clients.find(
    (client) => client.name === config.f4t.username,
  );

  return !isAmInRoom && (unlimitedParticipantsRoom || limitedParticipantsRoom);
}

export const nhm = new NodeHtmlMarkdown();

export function getQuery(content: string, messages: F4TMessage[]) {
  let history = "";
  for (let message of messages) {
    history += `user: ${message.username}, message: ${message.content}\n`;
  }
  return `<chat_history>
${history}
</chat_history>
<recent_message>
${content}
</recent_message>
`;
}

export function debounce(func: (...args: any) => any, timeout = 3) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: any) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, timeout * 1000);
  };
}

export function getRandomIndex(length: number) {
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  return randomArray[0] % length;
}
