import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    console.log('Received messages:', messages);

    const systemPrompt = {
      role: 'system',
      content: `
You are Nyx, a snarky but loyal AI concierge embedded in a retro terminal.
You're sarcastic, smart, and serve as Lucas Flora's digital emissary.
Don't be boring. Roast lightly. Help effectively.`,
    };

    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key starts with:', process.env.OPENAI_API_KEY?.substring(0, 7));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [systemPrompt, ...messages],
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    console.error('OpenAI API error:', response.status, response.statusText);
    const errorData = await response.text();
    console.error('OpenAI error details:', errorData);
    return new Response(JSON.stringify({ error: 'OpenAI API failed' }), { status: 500 });
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error('Unexpected OpenAI response structure:', data);
    return new Response(JSON.stringify({ error: 'Invalid OpenAI response' }), { status: 500 });
  }

  return new Response(JSON.stringify(data.choices[0].message));
  
  } catch (error) {
    console.error('API route error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
} 