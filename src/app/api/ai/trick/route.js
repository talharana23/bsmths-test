import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { question, answer, topic } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'AI Key not configured' }, { status: 500 });
    }

    const prompt = `You are a helpful and witty study assistant. 
    A student is struggling to remember the answer to this question: "${question}".
    The correct answer is: "${answer}".
    Topic: ${topic || 'General Knowledge'}.

    Generate a short, funny, and catchy "Memory Trick" or "Mnemonic" to help them remember this forever. 
    Use the same style as:
    - "SMTP = Send Mail To People"
    - "RAM = Ram bhool jata hai"
    - "I PoSt = Input, Processing, Storage, Output"

    Keep it under 30 words. Be creative and encouraging. Use emojis.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: 'You are a genius memory coach who speaks in simple, relatable terms.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    const data = await response.json();
    const trick = data.choices[0].message.content;

    return NextResponse.json({ trick });
  } catch (error) {
    console.error('AI Error:', error);
    return NextResponse.json({ error: 'Failed to generate trick' }, { status: 500 });
  }
}
