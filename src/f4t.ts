import { chromium, Page } from "playwright";
import { config } from "./config.js";
import { nhm, waitFor, waitForSelector } from "./utils.js";
import { Event, Room } from "./types.js";
import { EventEmitter } from "events";

export class F4T extends EventEmitter {
  page: Page | null = null;

  async init() {
    const browser = await chromium.launch({
      headless: config.env === "prod",
      args: ["--disable-blink-features=AutomationControlled"],
    });

    const context = await browser.newContext({
      storageState: config.authFile,
    });

    this.page = await context.newPage();

    await this.page.goto(config.f4t.url);

    await waitForSelector(
      this.page,
      ".ant-layout-header .ant-dropdown-trigger",
    );
    this.listenOnConsole();
  }

  async joinRoom(url: string) {
    await this.page.goto(url);

    this.detectIfInRoom();

    await waitForSelector(
      this.page,
      'img[src^="https://lh3.googleusercontent.com"]',
    );
    await this.page.getByText("Click on anywhere to start").click();

    // wait for participants to be connected
    await waitFor(7.5);

    // check if anyone is in room
    const hasParticipants = await this.page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll(".bottom .name"));
      return elements.length > 1;
    });
    if (!hasParticipants) {
      throw new Error("no participants found in room");
    }

    // listen for new messages
    this.registerObserver();
  }

  async detectIfInRoom() {
    this.page.evaluate(() => {
      const observer = new MutationObserver(() => {
        const resultElement = document.querySelector(
          ".ant-result .ant-result-title",
        );
        let banned = false;

        const modal = document.querySelector(".ant-modal-body");
        if (modal instanceof HTMLDivElement) {
          banned = modal.innerText.includes("Banning reason");
        }

        if (!resultElement && !banned) {
          return;
        }

        observer.disconnect();
        const message = JSON.stringify({
          name: "roomExit",
          payload: {
            room: window.location.href.split("?")[0],
            reason: banned ? "banned" : undefined,
          },
        });
        console.log(message);
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  async listenOnConsole() {
    this.page.on("console", async (message) => {
      try {
        const event: Event = JSON.parse(message.text());
        if (event.name === "newMessage") {
          const { content, username } = event.payload;
          const md = nhm.translate(content);
          this.emit("message", { content: md, username });
        } else if (event.name === "roomExit") {
          this.emit("roomExit", event.payload);
        }
      } catch (err) {}
    });
  }

  async registerObserver() {
    await waitForSelector(this.page, ".translate-container");

    this.page.evaluate(() => {
      const container = document.querySelector(".translate-container");
      const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              if (node instanceof HTMLDivElement && node.id) {
                const systemMessage = node.querySelector(
                  ".system span.ant-typography.ant-typography-secondary",
                );
                if (systemMessage instanceof HTMLSpanElement) {
                  const message = JSON.stringify({
                    name: "newMessage",
                    payload: {
                      content: systemMessage.innerText,
                      username: "F4T Notification",
                    },
                  });
                  console.log(message);
                  return;
                }

                const htmlNodes = Array.from(
                  node.querySelectorAll(".text .html"),
                );
                if (!htmlNodes.length) {
                  return;
                }
                const htmlNode = htmlNodes.at(-1);
                const username =
                  node.querySelector(".user .name span")?.textContent;
                const content = htmlNode.innerHTML;
                const message = JSON.stringify({
                  name: "newMessage",
                  payload: {
                    content,
                    username,
                  },
                });
                console.log(message);
              }
            });
          }
        }
      });

      observer.observe(container, {
        childList: true,
      });
    });
  }

  async sendMessage(message: string) {
    await this.page.waitForSelector("textarea");
    await this.page.locator("textarea").fill(message);
    await this.page.locator(".input-send-box button[type='button']").click();
  }

  async getRooms() {
    const groups: Record<string, Room> = await this.page.evaluate(() => {
      return JSON.parse(
        JSON.parse(JSON.stringify(localStorage))["groups:groupMap"],
      ).data;
    });

    const rooms = Object.values(groups);
    if (!rooms.length) {
      throw new Error("failed to find any rooms");
    }

    return rooms;
  }
}
