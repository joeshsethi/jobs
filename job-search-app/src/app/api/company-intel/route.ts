import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getDb } from '@/lib/db';

const anthropic = new Anthropic();

const RESEARCH_PROMPT = (company: string) => `
Research "${company}" thoroughly for a job interview. Use web search to find current, accurate information.

Write a comprehensive company brief with exactly these sections:

## What They Do
Core product/service, the specific problem they solve, who their target customers are (SMB vs enterprise vs consumer), and what makes their technology or approach unique in the market.

## Products & Services
All major products and product lines. Pricing structure (free tier, SMB plans, enterprise contracts, usage-based). Key integrations and partnerships. Notable recent launches or upcoming features.

## Growth Story
When and where founded, key founders and their backgrounds. Full funding history (seed, Series A/B/C/D amounts and lead investors). Major milestones (first enterprise customer, 1M users, IPO or acquisition). Current scale: employee count, customer count, ARR or revenue if public. Office locations.

## How They Make Money
Every revenue stream in detail: SaaS subscriptions (tiers and typical ACV), usage-based/consumption pricing, professional services and implementation fees, marketplace or transaction fees, data/analytics products, hardware, training, support contracts, partner ecosystem revenue share. Which streams are primary vs emerging.

## Goals & Strategy
Stated company mission and vision. Current strategic priorities (what they've said publicly about 2024-2026 plans). Product roadmap direction. Geographic expansion targets. Recent acquisitions or rumored M&A. What they need to achieve to reach their next milestone (IPO, profitability, market leadership).

## Social & ESG Goals
Diversity, equity and inclusion commitments and reported metrics. Carbon neutrality or sustainability pledges and timelines. Community programs, foundations, or philanthropic initiatives. Social impact work. Employee-focused programs (mental health, benefits). Any controversies or criticism and how they've responded.

## Competitive Landscape
Top 3-5 direct competitors. How "${company}" wins deals vs each competitor. Where they are weak. Their market position (leader, challenger, niche). Recent competitive moves (poaching, price cuts, new features targeting competitors).

## Interview Angles for Joesh
Based on this company's actual products and mission, write 4-5 specific talking points connecting their work to:
- Gen AI building experience (OpenAI, Claude, Pinecone, Stable Diffusion): which of their products/roadmap does this directly apply to?
- 4 years Accenture consulting (enterprise clients, $500K deal, $200M relationship): how does this background map to what their SEs do day-to-day?
- Live demo and pre-sales experience: what would a typical demo or PoC look like for their product?
- Sports tech interest (if applicable): any connection to sports, media, entertainment, or consumer data?
- Japanese fluency (low priority, only mention if the company has notable APAC operations or Japanese-speaking customers in the US)

Be specific with numbers, names, and dates. Prioritize accuracy over comprehensiveness. If you cannot find reliable information for a section, say so briefly rather than speculating.
`.trim();

export async function POST(req: NextRequest) {
  const { company } = await req.json();

  if (!company?.trim()) {
    return new Response('Company name required', { status: 400 });
  }

  const db = getDb();

  // Serve from cache if available
  const cached = db.prepare(
    'SELECT company_intel FROM interview_prep WHERE company = ? AND company_intel IS NOT NULL ORDER BY created_at DESC LIMIT 1'
  ).get(company) as { company_intel: string } | undefined;

  if (cached?.company_intel) {
    const encoder = new TextEncoder();
    const cachedStream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(cached.company_intel));
        controller.close();
      },
    });
    return new Response(cachedStream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Cache': 'HIT' },
    });
  }

  // Stream fresh research from Claude
  const encoder = new TextEncoder();
  let fullText = '';

  const responseStream = new ReadableStream({
    async start(controller) {
      try {
        const stream = anthropic.messages.stream({
          model: 'claude-opus-4-6',
          max_tokens: 8000,
          tools: [{ type: 'web_search_20260209', name: 'web_search' }],
          messages: [{ role: 'user', content: RESEARCH_PROMPT(company) }],
        } as Parameters<typeof anthropic.messages.stream>[0]);

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            fullText += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }

        // Persist to DB
        if (fullText) {
          const existingRow = db.prepare(
            'SELECT id FROM interview_prep WHERE company = ? ORDER BY created_at DESC LIMIT 1'
          ).get(company) as { id: number } | undefined;

          if (existingRow) {
            db.prepare(
              "UPDATE interview_prep SET company_intel = ?, updated_at = datetime('now') WHERE id = ?"
            ).run(fullText, existingRow.id);
          } else {
            db.prepare(
              "INSERT INTO interview_prep (company, role, company_intel, company_research, likely_questions, talking_points, technical_prep) VALUES (?, ?, ?, '{}', '[]', '[]', '[]')"
            ).run(company, 'General', fullText);
          }
        }

        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[company-intel] Claude error:', msg);
        controller.enqueue(
          encoder.encode(`\n\n## Error\n${msg}`)
        );
        controller.close();
      }
    },
  });

  return new Response(responseStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Cache': 'MISS' },
  });
}

// Allow clearing the cache for a company
export async function DELETE(req: NextRequest) {
  const { company } = await req.json();
  const db = getDb();
  db.prepare("UPDATE interview_prep SET company_intel = NULL WHERE company = ?").run(company);
  return new Response(JSON.stringify({ cleared: true }), { headers: { 'Content-Type': 'application/json' } });
}
