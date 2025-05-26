import yaml from "js-yaml";
import fs from "node:fs";
import { F4TConfig, Room } from "./types.js";
import { marketing } from "./scripts/marketing.js";
import { bot } from "./scripts/bot.js";
import { F4T, login, waitFor } from "@kbski/f4t";
import { AI } from "./groq.js";
import { filterRoom, getRandomIndex } from "./utils.js";
import { config } from "./config.js";

async function main() {
  const path = "./f4t.yaml";
  const content = fs.readFileSync(path, "utf8");
  const f4tConfig = yaml.load(content) as F4TConfig;
  const { mode } = f4tConfig;

  if (mode === "login") {
    await login({
      headless: false,
      authFile: config.authFile,
      email: config.f4t.email,
      password: config.f4t.password,
      loginURL: config.google.loginURL,
      loginRedirectURL: config.google.loginRedirectURL,
      f4tURL: config.f4t.url,
    });
    process.exit();
  }

  const f4t = new F4T();
  await f4t.init({
    authFile: config.authFile,
    f4tURL: config.f4t.url,
    headless: config.env === "prod",
  });

  const ai = new AI(f4tConfig.spec.prompt);
  const visitedRooms = new Set<string>();
  let skipCount = 0;

  if (mode === "marketing") {
    while (true) {
      if (skipCount >= 25) {
        skipCount = 0;
        visitedRooms.clear();
      }

      let rooms = await f4t.getRooms();
      rooms = rooms.filter((room) => filterRoom(room));
      const idx = getRandomIndex(rooms.length);
      const room = rooms[idx];

      if (visitedRooms.has(room.url)) {
        skipCount++;
        console.log("marketing mode: skipping visited room:", room.url);
        continue;
      }

      if (f4tConfig.spec.roomURL) {
        room.url = f4tConfig.spec.roomURL;
      }

      try {
        await marketing(f4t, ai, { ...f4tConfig.spec, room });
      } catch (err) {
        console.log("marketing mode: error:", err.message);
      } finally {
        await waitFor(3);
        await f4t.page.reload();
        await waitFor(5);
        visitedRooms.add(room.url);
        f4t.removeAllListeners("roomExit");
      }
    }
  }

  if (mode === "bot") {
    while (true) {
      if (skipCount >= 25) {
        skipCount = 0;
        visitedRooms.clear();
      }
      let room: Room;
      try {
        let rooms = await f4t.getRooms();
        rooms = rooms.filter((room) => filterRoom(room));
        const idx = getRandomIndex(rooms.length);
        room = rooms[idx];
        if (f4tConfig.spec.roomURL) {
          room.url = f4tConfig.spec.roomURL;
        }
        await bot(f4t, ai, { ...f4tConfig.spec, roomURL: room.url });
      } catch (err) {
        await waitFor(3);
        await f4t.page.reload();
        await waitFor(5);
        visitedRooms.add(room.url);
        f4t.removeAllListeners("roomExit");
        f4t.removeAllListeners("message");
      }
    }
  }
}

main();
