import yaml from "js-yaml";
import fs from "node:fs";
import { F4TConfig } from "./types.js";
import { login } from "./scripts/login.js";
import { marketing } from "./scripts/marketing.js";
import { bot } from "./scripts/bot.js";
import { F4T } from "./f4t.js";
import { AI } from "./groq.js";

async function main() {
  const path = "./f4t.yaml";
  const content = fs.readFileSync(path, "utf8");
  const f4tConfig = yaml.load(content) as F4TConfig;
  const { mode } = f4tConfig;

  if (mode === "login") {
    await login();
    process.exit();
  }

  const f4t = new F4T();
  await f4t.init();

  if (mode === "marketing") {
    marketing(f4t, f4tConfig.spec);
  } else if (mode === "bot") {
    const ai = new AI(f4tConfig.spec.prompt);
    bot(f4t, ai, f4tConfig.spec);
  }
}

main();
