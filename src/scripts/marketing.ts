import { F4T } from "@kbski/f4t";
import { AI } from "../groq.js";
import { Room, RoomExit } from "../types.js";

type MarketingOptions = {
  message: string;
  languages?: string[];
  room: Room;
};

export async function marketing(f4t: F4T, _ai: AI, options: MarketingOptions) {
  return new Promise(async (resolve, reject) => {
    const { room } = options;

    f4t.on("roomExit", async (event: RoomExit) => {
      if (event.reason === "banned") {
        console.log(
          "marketing mode: got banned at:",
          new Date().toLocaleTimeString(),
        );
        process.exit();
      }
      reject("exited room");
    });

    try {
      await f4t.joinRoom(room.url);
      console.log("marketing mode: joined room", room.url);
      await f4t.sendMessage(options.message);
      resolve("ok");
    } catch (err) {
      reject(err);
    }
  });
}
