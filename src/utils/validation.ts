import { z } from "zod";

export const JobContextSchema = z.object({
  analysisDepth: z.enum(["compact", "full"]),
  domain: z.enum(["universal", "technical", "nonTechnical"]),
  targetRole: z.string().min(2, "Role must be at least 2 characters"),
  targetCompany: z.string().min(2, "Company must be at least 2 characters"),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"]),
  geographicFocus: z.string().optional(),
  specialFocus: z.string().optional(),
  memo: z.string().max(1000, "Memo must be under 1000 characters").optional(),
});

export const ResumeTextSchema = z
  .string()
  .min(200, "Resume must be at least 200 characters")
  .max(6000, "Resume must be under 6000 characters");

export const ApiKeySchema = z
  .string()
  .regex(/^AI/, "API key must start with 'AI'")
  .min(20, "Invalid API key format");

export type JobContextFormValues = z.infer<typeof JobContextSchema>;
