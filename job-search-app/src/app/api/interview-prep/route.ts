import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { PROFILE } from '@/lib/profile';

export async function GET(req: NextRequest) {
  const db = getDb();
  const url = new URL(req.url);
  const company = url.searchParams.get('company');

  if (company) {
    const prep = db.prepare('SELECT * FROM interview_prep WHERE company = ? ORDER BY created_at DESC LIMIT 1').get(company);
    return NextResponse.json({ prep });
  }

  const preps = db.prepare('SELECT * FROM interview_prep ORDER BY created_at DESC').all();
  return NextResponse.json({ preps });
}

export async function POST(req: NextRequest) {
  const { company, role, application_id } = await req.json();

  // Generate interview prep content
  const prep = generateInterviewPrep(company, role);

  const db = getDb();
  const result = db.prepare(`
    INSERT INTO interview_prep (application_id, company, role, company_research, likely_questions, talking_points, technical_prep)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    application_id || null, company, role,
    JSON.stringify(prep.companyResearch),
    JSON.stringify(prep.likelyQuestions),
    JSON.stringify(prep.talkingPoints),
    JSON.stringify(prep.technicalPrep)
  );

  return NextResponse.json({ id: result.lastInsertRowid, prep });
}

function generateInterviewPrep(company: string, role: string) {
  const isSportsTech = PROFILE.targetCompanies.sportsTech
    .some(c => c.toLowerCase() === company.toLowerCase());
  const isDreamTier = PROFILE.targetCompanies.dreamTier
    .some(c => c.toLowerCase() === company.toLowerCase());

  const baseQuestions = [
    {
      question: "Tell me about yourself and why you're interested in this role.",
      guidance: `Lead with: 4 years at Accenture building and demoing Gen AI solutions for enterprise clients like Comcast and Fannie Mae. Highlight the transition from consulting to ${role} as a natural evolution — you've been doing SE work without the title.`,
    },
    {
      question: "Walk me through a technical demo you've delivered.",
      guidance: "Use the Salesforce Product Recommendation Copilot: voice-activated, real-time product matching using OpenAI Realtime + Pinecone. Emphasize live demo to enterprise clients, handling Q&A, and connecting technical capabilities to business outcomes.",
    },
    {
      question: "How do you handle a situation where a client asks about a feature your product doesn't have?",
      guidance: "Draw from Accenture Innovation Garage experience. Acknowledge the gap honestly, pivot to what IS possible, offer a PoC or workaround. Reference the ad creation tool — client wanted X, you built something better with Claude + Stable Diffusion.",
    },
    {
      question: "Tell me about a time you influenced a deal or revenue outcome.",
      guidance: "Fannie Mae assessment: led stakeholder interviews → delivered recommendations → $500K implementation deal. Also: Comcast relationship maintenance contributing to $200M+ in sales.",
    },
    {
      question: "How do you explain complex technical concepts to non-technical stakeholders?",
      guidance: "RAG explanation to Fannie Mae executives. Design thinking workshops translating business pain to technical roadmaps. Always start with the business problem, not the tech.",
    },
    {
      question: "What experience do you have with our technology/product?",
      guidance: `Research ${company}'s product beforehand. Connect to relevant experience — if AI company, highlight OpenAI/Claude/Pinecone builds. If data platform, highlight SQL/AWS/data pipeline work.`,
    },
  ];

  const seSpecificQuestions = [
    {
      question: "How would you scope a proof of concept for a prospective customer?",
      guidance: "Reference Innovation Garage methodology: design thinking session → identify core pain point → build minimal viable demo in 2-4 weeks → iterate based on feedback. Give the Peacock ad tool as an example.",
    },
    {
      question: "Describe your technical discovery process.",
      guidance: "Fannie Mae approach: structured interviews with SVP/CIO, mapped processes across 5 verticals, benchmarked against best practices, delivered prioritized recommendations.",
    },
  ];

  const talkingPoints = [
    `I've been doing Solutions Engineering work for 4 years — building PoCs, delivering demos, translating technical capabilities into business value — I just haven't had the title.`,
    `My Japanese fluency is a differentiator for any company with APAC accounts or expansion plans.`,
    `I've built with the actual tools — OpenAI Realtime, Claude, Pinecone, Stable Diffusion — not just used them as end products.`,
    `I thrive in the space between technical depth and client communication — that's exactly what an SE does.`,
  ];

  if (isDreamTier) {
    talkingPoints.push(`${company} is my top-choice company. I've researched the product extensively and can speak to specific use cases.`);
  }
  if (isSportsTech) {
    talkingPoints.push(`AI + sports tech is my dream intersection. I follow the Lakers, F1, and golf closely — I understand the fan and athlete perspective.`);
  }

  const technicalPrep = [
    `Review ${company}'s product documentation and recent releases`,
    `Prepare a 5-minute demo or walkthrough of a relevant personal project`,
    `Be ready to whiteboard a solution architecture for a common ${company} customer use case`,
    `Know the competitive landscape — who are ${company}'s main competitors and how do they differentiate?`,
    `Prepare 3-5 thoughtful questions about the team, product roadmap, and SE workflow`,
  ];

  return {
    companyResearch: {
      company,
      isDreamTier,
      isSportsTech,
      researchTasks: [
        `Visit ${company}'s careers page and read the full job description`,
        `Read ${company}'s latest blog posts and product announcements`,
        `Check Glassdoor for SE interview experiences at ${company}`,
        `Find ${company} employees on LinkedIn who are SEs — study their backgrounds`,
        `Look for ${company} customer case studies to reference in the interview`,
      ],
    },
    likelyQuestions: [...baseQuestions, ...seSpecificQuestions],
    talkingPoints,
    technicalPrep,
  };
}
