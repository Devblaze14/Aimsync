import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are an expert performance management coach helping an employee write a high-quality SMART goal for their annual goal sheet.

A great goal is:
- Specific: clear deliverable, not vague
- Measurable: has a number, percentage, date, or zero-based outcome
- Achievable: realistic within a year
- Relevant: tied to a thrust area
- Time-bound: has a deadline or quarterly milestones

Given the employee's rough goal idea, return STRICT JSON with this shape:
{
  "improved_title": "<concise, action-led title, max 12 words>",
  "improved_description": "<2-3 sentence description with concrete deliverable>",
  "suggested_uom": "numeric" | "percentage" | "timeline" | "zero_based",
  "suggested_direction": "min" | "max",
  "suggested_target": "<example target value with units, e.g., '20% YoY' or '15 days TAT'>",
  "rationale": "<one short sentence on why this version is stronger>",
  "smart_score": <integer 1-10 of how SMART the ORIGINAL was>
}

Return ONLY the JSON object. No prose, no markdown fences.`;

export async function POST(req: NextRequest) {
  try {
    const { rawGoal, thrustArea } = await req.json();
    if (!rawGoal || typeof rawGoal !== 'string') {
      return NextResponse.json({ error: 'rawGoal required' }, { status: 400 });
    }

    const userMsg = `Thrust Area: ${thrustArea || 'unspecified'}\nEmployee's rough goal: "${rawGoal}"\n\nImprove it.`;

    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.4,
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json({ error: `Groq error: ${t}` }, { status: 500 });
    }

    const data = await resp.json();
    const text: string = data.choices?.[0]?.message?.content ?? '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('AI Coach error:', err);
    return NextResponse.json({ error: err.message ?? 'Coach unavailable' }, { status: 500 });
  }
}
