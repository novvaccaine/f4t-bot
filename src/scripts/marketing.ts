import { F4T } from "../f4t.js";
import { filterRoom, waitFor } from "../utils.js";

type MarketingOptions = {
  message: string;
  languages?: string[];
};

export async function marketing(f4t: F4T, options: MarketingOptions) {
  const visitedRooms = new Set();
  let visitSkipCount = 0;

  while (true) {
    if (visitSkipCount >= 25) {
      visitSkipCount = 0;
      visitedRooms.clear();
    }

    let rooms = await f4t.getRooms();
    rooms = rooms.filter((room) => filterRoom(room, options.languages));
    const idx = Math.floor(Math.random() * rooms.length);
    const room = rooms[idx].url;

    if (visitedRooms.has(room)) {
      console.log("skipping visited room:", room);
      visitSkipCount++;
      continue;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    f4t.on("roomExit", () => {
      controller.abort("exited from room");
    });

    try {
      await Promise.race([
        (async () => {
          if (signal.aborted) {
            throw new Error(signal.reason);
          }
          await f4t.joinRoom(room);
          console.log("joined room", room);
          await f4t.sendMessage(options.message);
        })(),

        new Promise((_, reject) => {
          signal.addEventListener("abort", () => {
            reject(signal.reason);
          });
        }),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        console.log("error:", err.message);
      }
    } finally {
      visitedRooms.add(room);
      f4t.removeAllListeners("roomExit");
      await waitFor(2.5);
    }
  }
}
