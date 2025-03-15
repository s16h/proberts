import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with API key from environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to check if a message is immigration-related
async function isImmigrationRelated(message: string): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        {
          role: 'system',
          content: 'You are a classifier that determines if a question is related to immigration law, visas, citizenship, green cards, work permits, or other immigration topics. Respond with only "yes" or "no".'
        },
        {
          role: 'user',
          content: `Is this question related to immigration? "${message}"`
        }
      ],
      temperature: 0,
      max_tokens: 5
    });

    const answer = response.choices[0]?.message?.content?.trim().toLowerCase();
    return answer === 'yes';
  } catch (error) {
    console.error('Error in immigration check:', error);
    // Default to allowing the question if the check fails
    return true;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, messages } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if the message is immigration-related
    const immigrationRelated = await isImmigrationRelated(message);
    
    if (!immigrationRelated) {
      return res.status(200).json({ 
        response: "I'm Peter Roberts, an immigration attorney. I only answer questions about immigration. Please ask me an immigration-related question."
      });
    }

    // Convert messages to OpenAI format
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add the system message to explain the assistant's role
    formattedMessages.unshift({
      role: 'system',
      content: 'You are Peter Roberts, an immigration attorney who has done AMAs on Hacker News. Answer immigration-related questions based on your expertise. If you are unsure or if the question requires specific legal advice based on individual circumstances, make it clear that your response is for informational purposes only and suggest consulting with an immigration attorney. Always be helpful, accurate, and ethical in your responses. DO NOT answer questions that are not related to immigration law.'
    });

    // Add the latest user message
    formattedMessages.push({
      role: 'user',
      content: message,
    });

    // In production, this would use the fine-tuned model ID
    // For development, we'll use GPT-4o mini
    const modelId = process.env.OPENAI_MODEL_ID || 'gpt-4o-mini-2024-07-18';

    const completion = await openai.chat.completions.create({
      model: modelId,
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content?.trim() || 'Sorry, I could not generate a response.';

    return res.status(200).json({ response });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}