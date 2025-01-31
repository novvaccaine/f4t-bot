export type Room = {
  maxPeople: number;
  clients: any[];
  url: string;
  language: string;
  secondLanguage?: string;
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
        reply: true;
        languages?: string[];
        roomID?: string;
      };
    };

export type F4TMessage = {
  username: string;
  content: string;
};
