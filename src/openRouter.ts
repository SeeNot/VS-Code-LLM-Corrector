const MODEL = 'tngtech/deepseek-r1t2-chimera:free'

export async function sendPromt(promt: string) {

  const { OpenRouter } = await import("@openrouter/sdk");

  const client = new OpenRouter({
    apiKey: process.env.OPENROUTER_API
  });

  const response = await client.callModel({
    model: MODEL,
    input: promt,
  });

  return response.getText();
}
