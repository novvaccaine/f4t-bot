import { chromium, Page } from "playwright";
import { config } from "./config.js";
import { nhm, waitFor, waitForSelector, waitForSelectors } from "./utils.js";
import { Room } from "./types.js";
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
  }

  async joinRoom(url: string) {
    await this.page.goto(url);

    const key = await waitForSelectors(this.page, {
      success: 'img[src^="https://lh3.googleusercontent.com"]',
      fail: ".ant-result",
    });

    if (key === "fail") {
      throw new Error("failed to join room");
    }

    await this.page.getByText("Click on anywhere to start").click();

    await this.registerObserver();

    // wait for participants to be connected
    await waitFor(7.5);

    this.listenOnConsole();
  }

  async listenOnConsole() {
    this.page.on("console", async (message) => {
      try {
        const event = JSON.parse(message.text());
        if (event.eventName === "newMessage") {
          const { msg, username } = event.payload;
          const md = nhm.translate(msg);
          this.emit("message", { content: md, username });
        }
      } catch (err) {}
    });
  }

  async registerObserver() {
    await this.page
      .locator(".translate-container")
      .waitFor({ state: "visible" });

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
                    eventName: "newMessage",
                    payload: {
                      msg: systemMessage.innerText,
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
                const msg = htmlNode.innerHTML;
                const message = JSON.stringify({
                  eventName: "newMessage",
                  payload: {
                    msg,
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

  async getRandomRoom(callback: (room: Room) => boolean) {
    const rooms: Record<string, Room> = await this.page.evaluate(() => {
      return JSON.parse(
        JSON.parse(JSON.stringify(localStorage))["groups:groupMap"],
      ).data;
    });

    const filteredRooms = Object.values(rooms).filter(callback);

    if (!filteredRooms.length) {
      throw new Error("failed to find any rooms");
    }

    const randomIndex = Math.floor(Math.random() * filteredRooms.length);
    return filteredRooms[randomIndex];
  }
}
