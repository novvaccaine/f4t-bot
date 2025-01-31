import { Page } from "playwright";
import { F4TMessage, Room } from "./types.js";
import { NodeHtmlMarkdown } from "node-html-markdown";

export async function waitForSelector(page: Page, selector: string) {
  await page.waitForSelector(selector, { timeout: 600000 });
}

export async function waitFor(seconds: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res("ok");
    }, seconds * 1000);
  });
}

export function filterRoom(room: Room, languages?: string[]) {
  const unlimitedParticipantsRoom =
    room.maxPeople === 0 && room.clients.length > 0;

  const limitedParticipantsRoom =
    room.maxPeople > 0 &&
    room.clients.length > 0 &&
    room.clients.length < room.maxPeople;

  const languagesFilter = languages
    ? languages.includes(room.language.toLowerCase()) ||
      languages.includes(room.secondLanguage?.toLowerCase())
    : true;

  return (
    (unlimitedParticipantsRoom || limitedParticipantsRoom) && languagesFilter
  );
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
