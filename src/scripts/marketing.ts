import { F4T } from "../f4t.js";
import { RoomExit } from "../types.js";

type MarketingOptions = {
  message: string;
  languages?: string[];
  roomURL: string;
};

export async function marketing(f4t: F4T, options: MarketingOptions) {
  return new Promise(async (resolve, reject) => {
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
      await f4t.joinRoom(options.roomURL);
      console.log("joined room", options.roomURL);
      await f4t.sendMessage(options.message);
      resolve("ok");
    } catch (err) {
      reject(err);
    }
  });
}
