export type Room = {
  maxPeople: number;
  clients: any[];
  url: string;
  language: string;
  secondLanguage?: string;
};

export type Event =
  | {
      name: "newMessage";
      payload: {
        content: string;
        username: string;
      };
    }
  | {
      name: "roomExit";
      payload: {
        room: string;
      };
    };

export type F4TConfig =
  | {
      mode: "marketing";
      spec: {
        message: string;
        languages?: string[];
      };
    }
  | {
      mode: "login";
    }
  | {
      mode: "bot";
      spec: {
        prompt: string;
        reply: boolean;
        languages?: string[];
        roomID?: string;
      };
    };

type EventPayload<T extends Event["name"]> = Extract<
  Event,
  { name: T }
>["payload"];

export type F4TMessage = EventPayload<"newMessage">;
export type RoomExit = EventPayload<"roomExit">;
