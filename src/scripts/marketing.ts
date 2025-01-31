import { F4T } from "../f4t.js";
import { filterRoom, waitFor } from "../utils.js";
import { RoomExit } from "../types.js";

type MarketingOptions = {
  message: string;
  languages?: string[];
};

export async function marketing(f4t: F4T, options: MarketingOptions) {
  const { languages, message } = options;
  const visitedRooms = new Set();
  let visitSkipCount = 0;

  while (true) {
    if (visitSkipCount >= 25) {
      visitSkipCount = 0;
      visitedRooms.clear();
    }

    const room = await f4t.getRandomRoom((room) => filterRoom(room, languages));
    if (visitedRooms.has(room)) {
      console.log("skipping visited room:", room);
      visitSkipCount++;
      continue;
    }

    try {
      await Promise.race([
        f4t.joinRoom(room),
        new Promise((_, reject) => {
          f4t.once("roomExit", (event: RoomExit) => {
            visitedRooms.add(event.room);
            reject(new Error("room exit happened"));
          });
        }),
      ]);
      console.log("joined room", room);
      await f4t.sendMessage(message);
      visitedRooms.add(room);
    } catch (err) {
      if (err instanceof Error) {
        console.log("error:", err.message);
      }
    } finally {
      await waitFor(2.5);
    }
  }
}
