import { F4T } from "../f4t.js";
import { filterRoom, waitFor } from "../utils.js";

type MarketingOptions = {
  message: string;
  languages?: string[];
};

export async function marketing(f4t: F4T, options: MarketingOptions) {
  const { languages, message } = options;
  const visitedRooms = new Set();

  while (true) {
    if (visitedRooms.size > 100) {
      console.log("visited rooms max limit exceeded");
      visitedRooms.clear();
    }

    const room = await f4t.getRandomRoom((room) => filterRoom(room, languages));
    if (visitedRooms.has(room.url)) {
      console.log("skipping visited room:", room.url);
      continue;
    }

    try {
      await f4t.joinRoom(room.url);
      console.log("joined room", room.url);
      await f4t.sendMessage(message);
      visitedRooms.add(room.url);
    } catch (err) {
      console.log("error:", err);
    } finally {
      await waitFor(2.5);
    }
  }
}
