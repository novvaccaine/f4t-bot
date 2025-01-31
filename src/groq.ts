import Groq from "groq-sdk";
import { config } from "./config.js";

export class AI {
  client: Groq;
  systemPrompt: string;

  constructor(systemPrompt: string) {
    this.client = new Groq({ apiKey: config.groq.apiKey });
    this.systemPrompt = systemPrompt;
  }

  async response(query: string) {
    const completion = await this.client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: this.systemPrompt,
        },
        {
          role: "user",
          content: query,
        },
      ],
      temperature: 1,
      model: config.groq.model,
      max_tokens: 8192,
      top_p: 1,
      stream: false,
      stop: null,
    });
    return completion.choices[0].message.content;
  }
}
