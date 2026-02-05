import { tool } from "@openrouter/sdk";
import { OpenRouter } from "@openrouter/sdk";

const MODEL = 'arcee-ai/trinity-large-preview:free';

export async function sendPromt(promt: string) {

  const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API
  });


  const response = client.callModel({
    model: MODEL,
    input: promt,
  });

  return response.getText();
}
