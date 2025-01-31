import { Page } from "playwright";
import { F4TMessage, Room } from "./types.js";
import { NodeHtmlMarkdown } from "node-html-markdown";

export async function waitForSelector(page: Page, selector: string) {
  await page.waitForSelector(selector, { timeout: 600000 });
}

export async function waitForSelectors(
  page: Page,
  selectors: Record<string, string>,
) {
  const promises = Object.entries(selectors).map(([key, selector]) =>
    waitForSelector(page, selector).then(() => key),
  );

  try {
    const key = await Promise.race(promises);
    return key;
  } catch (error) {
    throw new Error(`failed to find any selectors`);
  }
}

export async function waitFor(seconds: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res("ok");
    }, seconds * 1000);
  });
}

export function filterRoom(room: Room, languages?: string[]) {
  return (
    ((!room.maxPeople && room.clients.length > 0) ||
      (room.maxPeople > 0 &&
        room.clients.length > 0 &&
        room.clients.length < room.maxPeople)) &&
    ((languages?.length && languages.includes(room.language.toLowerCase())) ||
      languages.includes(room.secondLanguage.toLowerCase()))
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
