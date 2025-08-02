import { Message } from "../messages/messages";
export async function getChatResponseStream(
  messages: Message[],
  apiKey: string,
  openRouterKey: string
) {
  console.log('Starting getChatResponseStream');
  console.log('Using model: google/gemini-2.0-flash-exp:free');

  const stream = new ReadableStream({
    async start(controller: ReadableStreamDefaultController) {
      try {
        console.log('Initializing stream controller');
        
        const OPENROUTER_API_KEY = openRouterKey;
        if (!OPENROUTER_API_KEY) {
          throw new Error('No OpenRouter API key provided');
        }

        const YOUR_SITE_URL = 'http://localhost:3000'; // Update for local testing
        const YOUR_SITE_NAME = 'ChatVRM Local';

        console.log('Preparing API request');
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": `${YOUR_SITE_URL}`,
            "X-Title": `${YOUR_SITE_NAME}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            "model": "anthropic/claude-3-haiku", // More reliable free model
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 200,
            "stream": true,
          })
        });

        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error('API Error:', errorBody);
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('No response body received');
        }

        console.log('Starting to process stream');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log('Stream completed');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || trimmed.startsWith(':') || trimmed === 'data: [DONE]') {
                continue;
              }

              if (trimmed.startsWith('data:')) {
                try {
                  const jsonStr = trimmed.substring(5).trim();
                  if (jsonStr) {
                    const data = JSON.parse(jsonStr);
                    if (data.choices?.[0]?.delta?.content) {
                      controller.enqueue(data.choices[0].delta.content);
                    }
                  }
                } catch (error) {
                  console.error('Error parsing line:', trimmed, '\nError:', error);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } catch (error) {
        console.error('Stream error:', error);
        // Provide more specific error message
        controller.enqueue("Sorry, I'm having trouble responding right now. ");
        controller.enqueue("Please check your API key and connection. ");
        controller.enqueue(`Error details: ${error instanceof Error ? error.message : String(error)}`);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}