import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set in Vercel later
});

interface ParsedCommand {
  tokenSymbol: string;
  amount: number;
  recipientAddress: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { command } = req.body as { command: string };
  if (!command) {
    return res.status(400).json({ error: 'Command required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'Parse the command into tokenSymbol, amount, and recipientAddress as JSON. Example: "send 10 USDC to 0x1234..." -> {"tokenSymbol": "USDC", "amount": 10, "recipientAddress": "0x1234..."}',
        },
        { role: 'user', content: command },
      ],
      response_format: { type: 'json_object' }, // Ensures JSON output
    });

    const parsed: ParsedCommand = JSON.parse(completion.choices[0].message.content || '{}');
    res.status(200).json(parsed);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
}