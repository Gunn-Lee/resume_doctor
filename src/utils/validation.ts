import { z } from "zod";

/**
 * Schema for parsed resume data validation
 */
export const ParsedResumeSchema = z.object({
  text: z
    .string()
    .min(200, "Resume text must be at least 200 characters")
    .max(50000, "Resume text must be under 50,000 characters"),
  wordCount: z
    .number()
    .int()
    .min(50, "Resume must contain at least 50 words")
    .max(10000, "Resume must contain less than 10,000 words"),
  pageCount: z
    .number()
    .int()
    .min(1, "Resume must have at least 1 page")
    .max(10, "Resume cannot exceed 10 pages"),
  parseWarnings: z.array(z.string()),
  source: z.enum(["text", "file", "edited"]),
  fileName: z.string().min(1, "File name is required"),
  fileSize: z
    .number()
    .int()
    .min(0)
    .max(1024 * 1024, "File size cannot exceed 1MB"),
});

/**
 * Schema for job context form data validation
 */
export const JobContextFormDataSchema = z.object({
  analysisDepth: z.enum(["compact", "full"], {
    errorMap: () => ({
      message: "Analysis depth must be either 'compact' or 'full'",
    }),
  }),
  domain: z.enum(["universal", "technical", "nonTechnical"], {
    errorMap: () => ({
      message: "Domain must be 'universal', 'technical', or 'nonTechnical'",
    }),
  }),
  targetRole: z
    .string()
    .min(2, "Target role must be at least 2 characters")
    .max(100, "Target role must be under 100 characters"),
  targetCompany: z
    .string()
    .min(2, "Target company must be at least 2 characters")
    .max(100, "Target company must be under 100 characters"),
  experienceLevel: z.enum(["Entry", "Mid", "Senior"], {
    errorMap: () => ({
      message: "Experience level must be 'Entry', 'Mid', or 'Senior'",
    }),
  }),
  geographicFocus: z
    .string()
    .max(100, "Geographic focus must be under 100 characters")
    .optional(),
  specialFocus: z
    .string()
    .max(200, "Special focus must be under 200 characters")
    .optional(),
  memo: z.string().max(1000, "Memo must be under 1000 characters").optional(),
});

/**
 * Schema for API key validation (Gemini API keys start with "AI")
 */
export const ApiKeySchema = z
  .string()
  .min(20, "API key must be at least 20 characters")
  .regex(
    /^AI[a-zA-Z0-9_-]+$/,
    "Invalid API key format. Gemini API keys start with 'AI'"
  );

/**
 * Schema for reCAPTCHA token validation
 */
export const RecaptchaTokenSchema = z
  .string()
  .min(20, "reCAPTCHA token is invalid")
  .max(2000, "reCAPTCHA token is too long");

/**
 * Schema for complete submission validation
 */
export const SubmissionSchema = z.object({
  parsedResume: ParsedResumeSchema,
  formData: JobContextFormDataSchema,
  apiKey: ApiKeySchema,
  recaptchaToken: RecaptchaTokenSchema,
});

/**
 * Legacy schema for backward compatibility
 */
export const JobContextSchema = JobContextFormDataSchema;

export const ResumeTextSchema = z
  .string()
  .min(200, "Resume must be at least 200 characters")
  .max(50000, "Resume must be under 50,000 characters");

// Type exports
export type ParsedResumeValidation = z.infer<typeof ParsedResumeSchema>;
export type JobContextFormDataValidation = z.infer<
  typeof JobContextFormDataSchema
>;
export type ApiKeyValidation = z.infer<typeof ApiKeySchema>;
export type RecaptchaTokenValidation = z.infer<typeof RecaptchaTokenSchema>;
export type SubmissionValidation = z.infer<typeof SubmissionSchema>;
export type JobContextFormValues = z.infer<typeof JobContextSchema>;

/**
 * Validation helper functions
 */
export const validateParsedResume = (data: unknown) => {
  return ParsedResumeSchema.safeParse(data);
};

export const validateJobContextFormData = (data: unknown) => {
  return JobContextFormDataSchema.safeParse(data);
};

export const validateApiKey = (key: unknown) => {
  return ApiKeySchema.safeParse(key);
};

export const validateRecaptchaToken = (token: unknown) => {
  return RecaptchaTokenSchema.safeParse(token);
};

export const validateSubmission = (data: unknown) => {
  return SubmissionSchema.safeParse(data);
};

/**
 * Format validation errors into user-friendly messages
 */
export const formatValidationErrors = (errors: z.ZodError): string => {
  return errors.errors
    .map((err) => {
      const path = err.path.join(".");
      return path ? `${path}: ${err.message}` : err.message;
    })
    .join("; ");
};
