import { chromium, Page } from "playwright";
import { config } from "../config.js";
import { waitForSelector } from "../utils.js";

async function googleLogin(page: Page) {
  await page.goto(config.google.loginURL);
  await page.locator("css=input[type='email']").fill(config.f4t.email);
  await page.locator("css=button[type='button']").nth(2).click();
  await page.locator("css=input[type='password']").fill(config.f4t.password);
  await page.locator("css=button[type='button']").nth(1).click();
  await page.waitForURL(new RegExp(config.google.loginRedirectURL));
  await page.context().storageState({ path: config.authFile });
}

async function f4tLogin(page: Page) {
  await page.goto(config.f4t.url);

  waitForSelector(page, ".ant-layout-header button");
  await page.locator(".ant-layout-header button").click();

  await waitForSelector(page, ".ant-layout-header .ant-dropdown-trigger");

  await page.context().storageState({ path: config.authFile });
}

export async function login() {
  const browser = await chromium.launch({
    headless: config.env === "prod",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await googleLogin(page);
  await f4tLogin(page);
}
