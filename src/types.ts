export type Participant = {
  id: string;
  followers: number;
  following: number;
  friends: number;
  name: string;
  supporter: number;
  isVerified: boolean;
};

export type Room = {
  maxPeople: number;
  clients: Participant[];
  url: string;
  language: string;
  secondLanguage?: string;
  topic: string;
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
      reason?: "banned";
    };
  };

export type F4TConfig =
  | {
    mode: "marketing";
    spec: {
      message: string;
      prompt: string;
      roomURL: string;
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
      roomURL: string;
    };
  };

type EventPayload<T extends Event["name"]> = Extract<
  Event,
  { name: T }
>["payload"];

export type F4TMessage = EventPayload<"newMessage">;
export type RoomExit = EventPayload<"roomExit">;
