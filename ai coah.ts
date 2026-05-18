import { Anthropic } from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

    const resp = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }],
    });

    const text = resp.content
      .filter((b) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    // Strip any accidental code fences
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('AI Coach error:', err);
    return NextResponse.json({ error: err.message ?? 'Coach unavailable' }, { status: 500 });
  }
}
