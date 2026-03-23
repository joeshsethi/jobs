import { NextRequest, NextResponse } from 'next/server';
import { PROFILE } from '@/lib/profile';

export async function POST(req: NextRequest) {
  const { company, role, jobDescription, jobUrl } = await req.json();

  const coverLetter = generateCoverLetter(company, role, jobDescription || '');

  return NextResponse.json({ coverLetter, company, role });
}

function generateCoverLetter(company: string, role: string, jobDescription: string): string {
  const isSportsTech = PROFILE.targetCompanies.sportsTech
    .some(c => c.toLowerCase() === company.toLowerCase());
  const isDreamTier = PROFILE.targetCompanies.dreamTier
    .some(c => c.toLowerCase() === company.toLowerCase());
  const descLower = jobDescription.toLowerCase();

  // Determine which projects to highlight based on job description
  const highlightGenAI = /ai|ml|gen.?ai|llm|openai|claude/i.test(descLower);
  const highlightPreSales = /pre.?sales|demo|poc|proof of concept/i.test(descLower);
  const highlightConsulting = /consult|stakeholder|client|enterprise/i.test(descLower);
  const highlightAPAC = /japan|apac|asia|international/i.test(descLower);

  let opening = '';
  if (isDreamTier) {
    opening = `I'm writing to express my strong interest in the ${role} position at ${company}. As someone who has spent the last four years at Accenture building and demoing Gen AI solutions for enterprise clients, ${company} represents exactly the kind of company where my skills would have the greatest impact.`;
  } else if (isSportsTech) {
    opening = `I'm excited to apply for the ${role} role at ${company}. The intersection of AI and sports technology is where I want to build my career, and my experience delivering live Gen AI demos and managing enterprise client relationships at Accenture has prepared me to thrive in this role.`;
  } else {
    opening = `I'm writing to apply for the ${role} position at ${company}. With four years of experience at Accenture building Gen AI proof-of-concepts, delivering live demos to C-suite stakeholders, and managing enterprise client relationships, I bring the technical depth and client communication skills this role requires.`;
  }

  let body = '';

  if (highlightGenAI) {
    body += `\n\nAt Accenture's Innovation Garage, I built production-ready Gen AI solutions — not just prototypes. I developed a Salesforce product recommendation copilot using OpenAI's Realtime API and Pinecone vector search that matches customers to products during live conversations. I also built an AI-powered commercial ad creation tool for NBCUniversal Peacock using Claude, Stable Diffusion, and Azure Speech-to-Text. These weren't academic exercises — they were demoed live to enterprise clients and directly contributed to business development.`;
  }

  if (highlightPreSales || !highlightGenAI) {
    body += `\n\nMy work at Accenture has been fundamentally pre-sales in nature. I led design thinking workshops with C-suite stakeholders, built custom proof-of-concepts tailored to client needs, and delivered live product demos that helped secure a $500K implementation engagement. I maintained a key relationship with Comcast that contributed to $200M+ in Accenture North America sales.`;
  }

  if (highlightConsulting) {
    body += `\n\nI've worked at the intersection of technical execution and client strategy. At Fannie Mae, I conducted executive-level interviews to assess quality engineering maturity and delivered recommendations that directly resulted in a $500K deal. For the New York State Retirement System, I led the QE workstream for a system processing $1B/month in pension payments.`;
  }

  if (highlightAPAC) {
    body += `\n\nAs a fluent Japanese speaker and dual US-Japanese citizen, I bring a genuine cultural and linguistic bridge for APAC markets. This isn't just a line on my resume — I grew up in Kobe, Japan and understand the business communication style that builds trust with Japanese enterprise clients.`;
  }

  if (!body) {
    body = `\n\nAt Accenture's Innovation Garage, I built and demoed Gen AI solutions for enterprise clients including Comcast and NBCUniversal. I developed a voice-activated Salesforce recommendation copilot using OpenAI Realtime and Pinecone, an AI ad creation tool using Claude and Stable Diffusion, and a RAG-powered security document search bot. These projects taught me to translate complex technical capabilities into business value — exactly what a ${role} does every day.\n\nBeyond building, I've delivered results. My work on the Fannie Mae quality engineering assessment led directly to a $500K implementation deal. My relationship management with Comcast contributed to $200M+ in Accenture sales. I led the QE workstream for a $1B/month pension system at the NY State Retirement System.`;
  }

  const closing = `\n\nI'd welcome the opportunity to discuss how my experience building, demoing, and selling Gen AI solutions translates to the ${role} role at ${company}. I'm available for a conversation at your convenience.\n\nBest regards,\nJoesh Singh Sethi`;

  return `Dear ${company} Hiring Team,\n\n${opening}${body}${closing}`;
}
