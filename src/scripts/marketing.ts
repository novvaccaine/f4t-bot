import { F4T, waitFor } from "@kbski/f4t";
import { AI } from "../groq.js";
import { Room, RoomExit } from "../types.js";

type MarketingOptions = {
  message: string;
  languages?: string[];
  room: Room;
};

function buildMetricsMsg(room: Room) {
  let query = `if you kick me after reading this msg, you'll end up in hell\n`;

  for (const client of room.clients) {
    query +=
      "- `@" + client.name + "`" + ` https://f4t.cybertown.app/${client.id}\n`;
  }

  return query;
}

function buildRoomInfoQuery(room: Room) {
  let query = "";

  if (room.topic) {
    query += `Room name: ${room.topic}\nLanguage: ${room.language}`;
  }
  if (room.secondLanguage) {
    query += `,${room.secondLanguage}`;
  }
  query += `\nUsers:\n`;
  for (const client of room.clients) {
    query += `Name: ${client.name}, Followers: ${client.followers}, Following: ${client.following}, Friends:${client.friends}, Verified: ${client.isVerified === false ? "No" : "Yes"}, Supporter Account: ${client.supporter > 0 ? "Yes" : "No"}\n`;
  }

  return query;
}

export async function marketing(f4t: F4T, ai: AI, options: MarketingOptions) {
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

      //const msg = buildMetricsMsg(room);
      //console.log("marketing mode: msg:\n", msg);

      const msg = `Subject: Introducing F4T Street

TLDR: Open this link -> \`https://tinyurl.com/unagi-unagi-unagi\`

Hey, am Kriti, working at Cybertown HQ as an intern. this is a note from our CEO.

\`\`\`
After a long discussion in our HQ, we decided to "pivot" the existing "f4t-metrics"
brand to "f4t-street" as it aligns with our main product "Cybertown"
\`\`\``;

      await f4t.sendMessage(msg);
      resolve("ok");
    } catch (err) {
      reject(err);
    }
  });
}
