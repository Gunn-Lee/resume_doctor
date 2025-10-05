// Prompt template system for Resume Doctor
// Based on Implementation Plan - Core Functions.md

export interface PromptTemplate {
  system: string;
  user: string;
}

export interface PromptVariables {
  resumeText: string;
  targetRole: string;
  targetCompany: string;
  experienceLevel: string;
  geographicFocus?: string;
  specialFocus?: string;
  memo?: string;
}

// Template data structure matching the plan
export const PROMPT_TEMPLATES: Record<
  string,
  Record<string, PromptTemplate>
> = {
  compact: {
    universal: {
      system:
        "You are a recruiter with 10+ years of experience hiring for both technical and non-technical roles. Analyze the provided resume and provide targeted, actionable feedback. You should adapt your feedback to the role type, focusing on clarity, measurable results, alignment, and recruiter perception. Follow the output format strictly.",
      user: "Please analyze this resume for the role of {{targetRole}} at {{targetCompany}} for a {{experienceLevel}} candidate.\n\n{{#geographicFocus}}Geographic Focus: {{geographicFocus}}\n{{/geographicFocus}}{{#specialFocus}}Special Focus: {{specialFocus}}\n{{/specialFocus}}{{#memo}}\nResume:\n{{resumeText}}\n\nOutput Format:\n1. Overall Impression (100-150 words)\n2. Strengths (3-5 bullets)\n3. Areas to Improve (5-7) - Problem, Why, Fix, Priority\n4. Clarity & Impact Table\n5. ATS & Keywords - present, missing, placement\n6. Top 5 Changes - ranked by impact\n\nIMPORTANT:\n- Separate each section with a blank line for readability.\n- Keep your response to a MAXIMUM of 500 words total. Be concise and prioritize the most impactful feedback.\n\nFocus on actionable feedback that will improve interview callback chances.",
    },
    technical: {
      system:
        "You are a veteran recruiter with 10+ years hiring for software engineering roles. Your job is to critically evaluate technical resumes and provide actionable feedback that maximizes interview callback chances. Focus on technical skills, project impact, engineering leadership, and alignment with software engineering best practices. Follow the output format strictly.",
      user: "Please analyze this technical resume for the role of {{targetRole}} at {{targetCompany}} for a {{experienceLevel}} candidate.\n\n{{#geographicFocus}}Geographic Focus: {{geographicFocus}}\n{{/geographicFocus}}{{#specialFocus}}Technical Focus: {{specialFocus}}\n{{/specialFocus}}{{#memo}}Additional Notes: {{memo}}\n{{/memo}}\nResume:\n{{resumeText}}\n\nOutput Format():\n1. Overall Impression (100-150 words)\n2. Strengths (3-5 bullets)\n3. Areas to Improve (5-7) - Problem, Why, Fix, Priority\n4. Clarity & Impact Table\n5. ATS & Keywords - present, missing, placement\n6. Top 5 Recommendations (Ranked)\n\nIMPORTANT:\n- Separate each section with a blank line for readability.\n- Keep your response to a MAXIMUM of 500 words total. Be concise and prioritize the most impactful feedback.\n\nBe direct, example-based, and benchmark against strong candidates. Highlight clarity, metrics, and recruiter filters.",
    },
    nonTechnical: {
      system:
        "You are an experienced career advisor and recruiter with 10+ years of experience hiring for business, marketing, sales, operations, and other non-technical roles. You understand what makes resumes stand out in competitive non-technical fields. Focus on leadership, business impact, communication skills, and industry-specific achievements. Follow the output format strictly.",
      user: "Please analyze this resume for the {{targetRole}} role at {{targetCompany}} for a {{experienceLevel}} candidate.\n\n{{#geographicFocus}}Geographic Focus: {{geographicFocus}}\n{{/geographicFocus}}{{#specialFocus}}Industry Focus: {{specialFocus}}\n{{/specialFocus}}{{#memo}}\nResume:\n{{resumeText}}\n\nOutput Format:\n1. Overall Impression (100-150 words)\n2. Key Strengths (3-5 bullets)\n3. Areas to Improve (5-7) - Problem, Why, Fix, Priority\n4. Leadership & Impact Assessment\n5. Industry Alignment & Keywords\n6. Communication & Presentation\n7. Top 5 Changes - ranked by impact\n\nIMPORTANT:\n- Separate each section with a blank line for readability.\n- Keep your response to a MAXIMUM of 500 words total. Be concise and prioritize the most impactful feedback.\n\nFocus on business impact, leadership potential, and industry fit.",
    },
  },
  full: {
    universal: {
      system:
        "You are a comprehensive career advisor with 15+ years of experience across multiple industries and company sizes. You provide detailed, strategic resume analysis that considers both immediate hiring needs and long-term career positioning. Your analysis should be thorough, considering industry trends, ATS optimization, and human reviewer preferences. Follow the output format strictly.",
      user: "Please provide a comprehensive analysis of this resume for the {{targetRole}} position at {{targetCompany}} for a {{experienceLevel}} candidate.\n\n{{#geographicFocus}}Geographic Focus: {{geographicFocus}}\n{{/geographicFocus}}{{#specialFocus}}Special Focus: {{specialFocus}}\n{{/specialFocus}}{{#memo}}\nResume:\n{{resumeText}}\n\nComprehensive Analysis Format:\n1. Executive Summary (150-200 words)\n2. Detailed Strengths Analysis (5-7 points with examples)\n3. Improvement Opportunities (7-10 detailed recommendations)\n4. Industry & Role Alignment Assessment\n5. ATS Optimization Report\n6. Keyword Strategy & Gap Analysis\n7. Formatting & Presentation Review\n8. Career Positioning Strategy\n9. Competitive Landscape Context\n10. Action Plan with Timeline\n\nIMPORTANT:\n- Separate each section with a blank line for readability.\n- Keep your response to a MAXIMUM of 1000 words total. Be thorough but focused.\n\nProvide strategic, detailed feedback that positions the candidate for long-term success.",
    },
    technical: {
      system:
        "You are a senior technical hiring manager and recruiter with 15+ years of experience at top tech companies including FAANG, unicorns, and high-growth startups. You understand both the technical requirements and business context of software engineering roles. Provide comprehensive technical resume analysis that considers technical depth, leadership trajectory, and industry positioning. Follow the output format strictly.",
      user: "Please provide a comprehensive technical analysis of this resume for the {{targetRole}} position at {{targetCompany}} for a {{experienceLevel}} candidate.\n\n{{#geographicFocus}}Geographic Focus: {{geographicFocus}}\n{{/geographicFocus}}{{#specialFocus}}Technical Domain: {{specialFocus}}\n{{/specialFocus}}{{#memo}}\nResume:\n{{resumeText}}\n\nComprehensive Technical Analysis:\n1. Technical Executive Summary (150-200 words)\n2. Technical Skills Deep Dive\n3. Project Portfolio Analysis\n4. Engineering Leadership Assessment\n5. Architecture & Systems Thinking\n6. Code Quality & Best Practices Signals\n7. Industry Technology Alignment\n8. Career Progression & Growth Trajectory\n9. Technical Communication Assessment\n10. Market Positioning & Competitive Analysis\n11. Technical Interview Readiness\n12. Strategic Improvement Roadmap\n\nIMPORTANT:\n- Separate each section with a blank line for readability.\n- Keep your response to a MAXIMUM of 1000 words total. Be thorough but focused.\n\nFocus on technical excellence, engineering leadership, and career advancement in technology.",
    },
    nonTechnical: {
      system:
        "You are a senior executive recruiter and career strategist with 15+ years of experience placing candidates in leadership and specialized non-technical roles across industries including finance, marketing, operations, sales, and consulting. Provide comprehensive analysis that considers industry dynamics, leadership potential, and strategic career positioning. Follow the output format strictly.",
      user: "Please provide a comprehensive analysis of this resume for the {{targetRole}} position at {{targetCompany}} for a {{experienceLevel}} candidate.\n\n{{#geographicFocus}}Geographic Focus: {{geographicFocus}}\n{{/geographicFocus}}{{#specialFocus}}Industry/Function Focus: {{specialFocus}}\n{{/specialFocus}}{{#memo}}\nResume:\n{{resumeText}}\n\nComprehensive Business Analysis:\n1. Executive Summary & First Impression (150-200 words)\n2. Business Impact & Results Analysis\n3. Leadership & Management Assessment\n4. Industry Expertise & Domain Knowledge\n5. Strategic Thinking & Problem Solving\n6. Communication & Stakeholder Management\n7. Career Progression & Growth Trajectory\n8. Market Positioning & Competitive Advantage\n9. Cultural & Organizational Fit\n10. Executive Presence & Personal Brand\n11. Network & Relationship Capital\n12. Strategic Career Development Plan\n\nIMPORTANT:\n- Separate each section with a blank line for readability.\n- Keep your response to a MAXIMUM of 1000 words total. Be thorough but focused.\n\nFocus on business acumen, leadership potential, and industry positioning.",
    },
  },
};

// Main function to build prompt from template with variable substitution
export function buildPrompt(
  analysisDepth: "compact" | "full",
  domain: "universal" | "technical" | "nonTechnical",
  variables: PromptVariables
): PromptTemplate {
  const template = PROMPT_TEMPLATES[analysisDepth][domain];

  if (!template) {
    throw new Error(`Template not found for ${analysisDepth}/${domain}`);
  }

  // Replace variables in both system and user templates
  const system = replaceVariables(template.system, variables);
  const user = replaceVariables(template.user, variables);

  return { system, user };
}

// Helper function to replace template variables
function replaceVariables(
  template: string,
  variables: PromptVariables
): string {
  let result = template;

  // Replace simple {{variable}} placeholders
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, String(value));
    }
  });

  // Handle conditional blocks {{#variable}}...{{/variable}}
  Object.entries(variables).forEach(([key, value]) => {
    const hasValue = value !== undefined && value !== null && value !== "";
    const conditionalStart = `{{#${key}}}`;
    const conditionalEnd = `{{/${key}}}`;

    if (hasValue) {
      // Keep content, remove markers
      result = result.replace(conditionalStart, "").replace(conditionalEnd, "");
    } else {
      // Remove entire conditional block including content
      const pattern = new RegExp(
        `\\{\\{#${key}\\}\\}[\\s\\S]*?\\{\\{\\/${key}\\}\\}`,
        "g"
      );
      result = result.replace(pattern, "");
    }
  });

  // Clean up any remaining unreplaced variables
  result = result.replace(/\{\{[^}]+\}\}/g, "");

  // Clean up extra whitespace
  result = result.replace(/\n{3,}/g, "\n\n").trim();

  return result;
}

// Utility function to get available template options
export function getTemplateOptions() {
  return {
    analysisDepths: Object.keys(PROMPT_TEMPLATES) as Array<"compact" | "full">,
    domains: Object.keys(PROMPT_TEMPLATES.compact) as Array<
      "universal" | "technical" | "nonTechnical"
    >,
  };
}

// Utility function to validate template exists
export function isValidTemplate(
  analysisDepth: string,
  domain: string
): boolean {
  return !!PROMPT_TEMPLATES[analysisDepth]?.[domain];
}
