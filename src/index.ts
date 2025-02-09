import yaml from "js-yaml";
import fs from "node:fs";
import { F4TConfig } from "./types.js";
import { login } from "./scripts/login.js";
import { marketing } from "./scripts/marketing.js";
import { bot } from "./scripts/bot.js";
import { F4T } from "./f4t.js";
import { AI } from "./groq.js";
import { filterRoom, waitFor } from "./utils.js";

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
    const visitedRooms = new Set();
    let skipCount = 0;

    while (true) {
      if (skipCount >= 25) {
        skipCount = 0;
        visitedRooms.clear();
      }

      let rooms = await f4t.getRooms();
      rooms = rooms.filter((room) =>
        filterRoom(room, f4tConfig.spec.languages),
      );
      const idx = Math.floor(Math.random() * rooms.length);
      const roomURL = rooms[idx].url;

      if (visitedRooms.has(roomURL)) {
        skipCount++;
        console.log("marketing mode: skipping visited room:", roomURL);
        continue;
      }

      try {
        await marketing(f4t, { ...f4tConfig.spec, roomURL });
      } catch (err) {
        console.log("bot mode: error:", err.message);
        f4t.removeAllListeners("roomExit");
      } finally {
        visitedRooms.add(roomURL);
      }
    }
  }

  if (mode === "bot") {
    let recentRoom: string | null = null;
    const ai = new AI(f4tConfig.spec.prompt);

    while (true) {
      if (!f4tConfig.spec.roomURL) {
        let rooms = await f4t.getRooms();
        rooms = rooms.filter((room) =>
          filterRoom(room, f4tConfig.spec.languages),
        );
        const idx = Math.floor(Math.random() * rooms.length);
        const roomURL = rooms[idx].url;
        if (roomURL === recentRoom) {
          continue;
        }
        recentRoom = roomURL;
      } else {
        recentRoom = f4tConfig.spec.roomURL;
      }
      try {
        const options = {
          ...f4tConfig.spec,
          roomURL: recentRoom,
        };
        await bot(f4t, ai, options);
      } catch (err) {
        f4t.removeAllListeners("message");
        f4t.removeAllListeners("roomExit");
      }
    }
  }
}

main();
